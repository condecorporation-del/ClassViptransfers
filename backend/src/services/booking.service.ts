import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';
import { moneyToCents, CreateBookingInput, UpdateBookingInput } from '../lib/validation';
import { BookingStatus, BookingType, BookingSource } from '@prisma/client';
import { PricingService } from './pricing.service';

const pricingService = new PricingService();

/** Mexico IVA 16% — subtotal is pre-tax line items; total = subtotal + tax */
const MX_IVA = 0.16;
function applyMxIvaFromSubtotal(subtotalCents: number): { subtotalCents: number; taxCents: number; totalCents: number } {
  const sub = Math.max(0, Math.round(subtotalCents));
  const tax = Math.round(sub * MX_IVA);
  return { subtotalCents: sub, taxCents: tax, totalCents: sub + tax };
}

/** When admin sets final total including IVA, split back for storage */
function splitTotalIncludingIva(finalTotalCents: number): { subtotalCents: number; taxCents: number; totalCents: number } {
  const total = Math.max(0, Math.round(finalTotalCents));
  const sub = Math.round(total / (1 + MX_IVA));
  const tax = total - sub;
  return { subtotalCents: sub, taxCents: tax, totalCents: total };
}

// Extras allowed only for shuttle (no personalized/kits)
const SHUTTLE_ALLOWED_EXTRA_CODES = new Set([
  'OVERSIZE_LUGGAGE', 'EXTRA_STOP', 'GROCERY_STOP', 'BABY_SEAT', 'BOOSTER',
  'SPECIAL_ASSISTANCE', 'WAIT_TIME', 'EARLY_MORNING', 'LATE_NIGHT', 'INCLUDED_BASIC_KIT',
]);
// Personalized/kits — not allowed for shuttle
const SHUTTLE_BLOCKED_EXTRA_CODES = new Set([
  'BIRTHDAY_KIT', 'ROMANTIC_KIT', 'CHAMPAGNE', 'CHAMPAGNE_UPGRADE',
  'DELUXE_ARRIVAL_KIT', 'LUXURY_WELCOME',
]);

export class BookingService {
  /**
   * Generate a short confirmation code like CLASS2026001
   */
  async generateConfirmationCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CLASS${year}`;
    const count = await prisma.booking.count({
      where: { confirmationCode: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  /**
   * Create a draft booking
   */
  async createDraftBooking(input: CreateBookingInput, source: BookingSource = 'WEBSITE') {
    const pax = Math.max(1, input.passengers ?? 1);

    // --- Log payload (sanitized) ---
    console.log('[Booking] Payload received:', {
      type: input.type,
      serviceType: input.serviceType,
      tripType: input.tripType,
      areaId: input.areaId ?? null,
      passengers: pax,
      itemsCount: input.items?.length ?? 0,
      hasPricingData: !!input.pricingData,
    });

    let totalAmount: number;
    let items = input.items;

    // --- Validation: passengers range for transport ---
    if (input.type === 'TRANSPORTATION') {
      if (pax < 1 || pax > 14) {
        throw new Error('Passengers must be between 1 and 14 for transport bookings.');
      }
    }

    // --- Validation: shuttle extras + vehicle capacity (backend enforcement) ---
    if (input.type === 'TRANSPORTATION') {
      if (input.serviceType === 'shuttle') {
        const extraCodes = new Set<string>();
        if (input.pricingData?.extras?.length) {
          input.pricingData.extras.forEach((e) => extraCodes.add(e.code));
        }
        items.forEach((item) => {
          if (item.type === 'ADDON' && item.metadata?.code) {
            extraCodes.add(String(item.metadata.code));
          }
        });
        for (const code of extraCodes) {
          if (SHUTTLE_BLOCKED_EXTRA_CODES.has(code)) {
            throw new Error('Shuttle does not allow personalized extras');
          }
        }
      }

      const vehicleClass = (input.pricingData?.vehicleClass ?? (input.metadata as Record<string, unknown>)?.vehicleClass) as string | undefined;
      const vc = vehicleClass?.toUpperCase?.() || vehicleClass;
      if (input.serviceType === 'private' && vc) {
        if (vc === 'SUV') {
          if (pax > 5) {
            throw new Error('SUV allows 1-5 passengers. For 6 or more, please select Sprinter.');
          }
        }
        if (vc === 'SPRINTER') {
          if (pax < 6 || pax > 14) {
            throw new Error('Sprinter allows 6-14 passengers.');
          }
        }
      }
    }

    // If TRANSPORTATION type with areaId, calculate price from Area
    if (input.type === 'TRANSPORTATION' && input.areaId && input.tripType) {
      try {
        const { totalCents: baseCents, area } = await pricingService.getTransportPriceByArea(
          input.areaId,
          input.tripType
        );
        // Shuttle: price per passenger; private: flat rate
        const totalCents = input.serviceType === 'shuttle'
          ? Math.round(baseCents * pax)
          : baseCents;
        totalAmount = totalCents;
        items = [
          {
            type: 'TRANSPORTATION' as const,
            name: `Transfer: ${area.name} (${input.tripType === 'roundtrip' ? 'Round trip' : 'One way'})`,
            quantity: input.serviceType === 'shuttle' ? pax : 1,
            unitPrice: totalCents / 100,
            metadata: {
              areaId: area.id,
              areaName: area.name,
              tripType: input.tripType,
              oneWayPriceCents: area.oneWayPriceCents,
              roundTripPriceCents: area.roundTripPriceCents,
              pricePerPax: input.serviceType === 'shuttle',
            },
          },
        ];
        console.log('[Booking] Price from area:', { areaName: area.name, tripType: input.tripType, baseCents, passengers: pax, totalCents, serviceType: input.serviceType });
      } catch (error: any) {
        console.error('[Booking] Area pricing failed:', error?.message || error);
        throw new Error(error.message || 'Invalid area for transport pricing');
      }
    } else if (input.type === 'TRANSPORTATION' && input.pricingData) {
      // Legacy: pricing from zones/vehicle
      try {
        const quote = await pricingService.calculateQuote({
          serviceType: 'TRANSFER',
          tripType: input.pricingData.tripType === 'roundtrip' ? 'ROUND_TRIP' : 'ONE_WAY',
          zoneFrom: input.pricingData.zoneFrom,
          zoneTo: input.pricingData.zoneTo,
          vehicleClass: input.pricingData.vehicleClass,
          passengers: input.passengers,
          extras: input.pricingData.extras,
        });

        totalAmount = quote.totalCents;

        // Override items with calculated pricing
        items = [
          {
            type: 'TRANSPORTATION' as const,
            name: `Transfer: ${input.pricingData.zoneFrom} → ${input.pricingData.zoneTo}`,
            quantity: 1,
            unitPrice: quote.basePrice,
            metadata: {
              pricingRuleId: quote.pricingRuleId,
              basePriceCents: quote.basePriceCents,
              extras: quote.extrasBreakdown,
              included: quote.includedBreakdown || [],
            },
          },
        ];

        // Add extras as separate items
        for (const extra of quote.extrasBreakdown) {
          items.push({
            type: 'ADDON' as const,
            name: extra.label,
            quantity: extra.qty,
            unitPrice: extra.price,
            metadata: {
              code: extra.code,
            },
          });
        }
      } catch (error: any) {
        console.error('[Booking] Pricing calculation failed (legacy path):', error?.message || error);
        throw new Error(
          `Pricing calculation failed: ${error?.message || 'Invalid zones or pricing data'}. Please check route and try again.`
        );
      }
    } else {
      // Calculate total amount in cents from items (e.g. ACTIVITY, COMBO, or transport without areaId/pricingData)
      totalAmount = Math.round(
        input.items.reduce((sum, item) => sum + moneyToCents(item.unitPrice) * item.quantity, 0)
      );
      console.log('[Booking] Total from items:', { totalCents: totalAmount, itemsCount: input.items.length });
    }

    totalAmount = Math.round(totalAmount);
    if (totalAmount < 0) {
      throw new Error('Booking total cannot be negative');
    }
    const { subtotalCents, taxCents, totalCents } = applyMxIvaFromSubtotal(totalAmount);
    console.log('[Booking] Subtotal (pre-IVA) cents:', totalAmount, '| IVA 16%:', taxCents, '| Total:', totalCents);

    // Create or find customer by email
    let customer = await prisma.customer.findFirst({
      where: {
        email: input.customer.email,
      },
    });

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: input.customer.name,
          phone: input.customer.phone,
          country: input.customer.country,
          language: input.customer.language,
        },
      });
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
          country: input.customer.country,
          language: input.customer.language,
        },
      });
    }

    // Parse booking date
    let bookingDate: Date;
    if (input.bookingDate instanceof Date) {
      bookingDate = input.bookingDate;
    } else {
      bookingDate = new Date(input.bookingDate);
      if (isNaN(bookingDate.getTime())) {
        throw new Error('Invalid booking date');
      }
    }

    const confirmationCode = await this.generateConfirmationCode();

    // Create booking with items (totalAmount and item prices stored in cents)
    const booking = await prisma.booking.create({
      data: {
        type: input.type as BookingType,
        status: BookingStatus.DRAFT,
        source,
        customerId: customer.id,
        confirmationCode,
        bookingDate,
        bookingTime: input.bookingTime,
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        flightNumber: input.flightNumber,
        arrivalTime: input.arrivalTime,
        departureFlightNumber: input.departureFlightNumber,
        departureTime: input.departureTime,
        pickupTime: input.pickupTime,
        passengers: pax,
        serviceType: input.serviceType,
        tripType: input.tripType,
        route: input.route,
        totalAmount: totalCents,
        subtotalAmount: subtotalCents,
        taxAmount: taxCents,
        notes: input.notes,
        metadata: (() => {
          const base =
            input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
              ? { ...input.metadata }
              : {};
          if (input.departureDate) {
            const dd = input.departureDate;
            base.departureDate = dd instanceof Date ? dd.toISOString() : String(dd);
          }
          return base;
        })(),
        items: {
          create: items.map((item) => {
            const unitCents = moneyToCents(item.unitPrice);
            const totalPrice = unitCents * item.quantity;
            return {
              type: item.type,
              name: item.name,
              slug: item.slug,
              quantity: item.quantity,
              unitPrice: unitCents,
              totalPrice,
              metadata: item.metadata || {},
            };
          }),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    console.log('[Booking] Saved:', { id: booking.id, totalAmount: booking.totalAmount, itemsCount: booking.items.length });

    // Create audit log
    await createAuditLog({
      action: 'CREATE',
      entityType: 'Booking',
      entityId: booking.id,
      description: `Created draft booking: ${booking.type}`,
    });

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string, options?: { includeEmailLogs?: boolean }) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        pricingOverrides: {
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
        ...(options?.includeEmailLogs && {
          emailLogs: {
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  /**
   * Confirm booking (admin action)
   */
  async confirmBooking(bookingId: string, userId?: string, userEmail?: string, notes?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Cannot confirm a cancelled booking');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        internalNotes: notes ? `${booking.internalNotes || ''}\n[Confirmed] ${notes}`.trim() : booking.internalNotes,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    await createAuditLog({
      action: 'CONFIRM',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Confirmed booking ${bookingId}`,
      changes: {
        status: { from: booking.status, to: 'CONFIRMED' },
      },
    });

    return updated;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason?: string, userId?: string, userEmail?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed booking');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        internalNotes: reason ? `${booking.internalNotes || ''}\n[Cancelled] ${reason}`.trim() : booking.internalNotes,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    await createAuditLog({
      action: 'CANCEL',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Cancelled booking ${bookingId}${reason ? `: ${reason}` : ''}`,
      changes: {
        status: { from: booking.status, to: 'CANCELLED' },
      },
    });

    return updated;
  }

  /**
   * Assign driver/vehicle to booking (extended)
   */
  async assignBookingExtended(
    bookingId: string,
    driverId?: string | null,
    vehicleId?: string | null,
    pickupTime?: string,
    internalNotes?: string,
    userId?: string,
    userEmail?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Handle unassign (null values)
    const assignments = [];

    // Remove existing assignments if unassigning
    if (driverId === null) {
      await prisma.bookingAssignment.deleteMany({
        where: {
          bookingId,
          type: 'DRIVER',
        },
      });
    } else if (driverId) {
      // Remove existing driver assignment
      await prisma.bookingAssignment.deleteMany({
        where: {
          bookingId,
          type: 'DRIVER',
        },
      });
      // Create new assignment
      const assignment = await prisma.bookingAssignment.create({
        data: {
          bookingId,
          type: 'DRIVER',
          driverId,
          assignedBy: userId,
          notes: internalNotes,
        },
      });
      assignments.push(assignment);
    }

    if (vehicleId === null) {
      await prisma.bookingAssignment.deleteMany({
        where: {
          bookingId,
          type: 'VEHICLE',
        },
      });
    } else if (vehicleId) {
      // Remove existing vehicle assignment
      await prisma.bookingAssignment.deleteMany({
        where: {
          bookingId,
          type: 'VEHICLE',
        },
      });
      // Create new assignment
      const assignment = await prisma.bookingAssignment.create({
        data: {
          bookingId,
          type: 'VEHICLE',
          vehicleId,
          assignedBy: userId,
          notes: internalNotes,
        },
      });
      assignments.push(assignment);
    }

    // Update booking with pickup time and internal notes if provided
    const updateData: any = {};
    if (pickupTime) {
      updateData.bookingTime = pickupTime;
    }
    if (internalNotes) {
      updateData.internalNotes = booking.internalNotes
        ? `${booking.internalNotes}\n[${new Date().toISOString()}] ${internalNotes}`
        : internalNotes;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
      });
    }

    const description = [
      driverId ? 'driver assigned' : driverId === null ? 'driver unassigned' : '',
      vehicleId ? 'vehicle assigned' : vehicleId === null ? 'vehicle unassigned' : '',
      pickupTime ? 'pickup time updated' : '',
    ].filter(Boolean).join(', ');

    await createAuditLog({
      action: 'ASSIGN',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Booking assignment updated: ${description}`,
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        assignments: {
          include: {
            driver: true,
            vehicle: true,
          },
        },
      },
    });

    return {
      booking: updatedBooking,
      assignments,
    };
  }

  /**
   * Assign driver/vehicle to booking (legacy - for backward compatibility)
   */
  async assignBooking(bookingId: string, driverId?: string, vehicleId?: string, userId?: string, userEmail?: string, notes?: string) {
    return this.assignBookingExtended(bookingId, driverId, vehicleId, undefined, notes, userId, userEmail);
  }

  /**
   * List bookings with filters
   */
  async listBookings(filters: {
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    type?: string;
    q?: string;
    page?: number;
    limit?: number;
    groupedByTime?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.bookingDate = {};
      if (filters.dateFrom) {
        const d = new Date(filters.dateFrom);
        d.setHours(0, 0, 0, 0);
        where.bookingDate.gte = d;
      }
      if (filters.dateTo) {
        const d = new Date(filters.dateTo);
        d.setHours(23, 59, 59, 999);
        where.bookingDate.lte = d;
      }
    } else if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      where.bookingDate = { gte: startDate, lte: endDate };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // Search query (name, email, phone, bookingId, confirmationCode)
    if (filters.q) {
      const searchTerm = filters.q.trim();
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { confirmationCode: { contains: searchTerm, mode: 'insensitive' } },
        { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { customer: { phone: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { bookingTime: 'asc' },
          { bookingDate: 'asc' },
        ],
        include: {
          customer: true,
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          assignments: {
            include: {
              driver: true,
              vehicle: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    let groupedByTime: Record<string, any[]> | null = null;
    if (filters.groupedByTime) {
      groupedByTime = {};
      bookings.forEach(booking => {
        const timeKey = booking.bookingTime || 'TBD';
        if (!groupedByTime![timeKey]) {
          groupedByTime![timeKey] = [];
        }
        groupedByTime![timeKey].push(booking);
      });
    }

    return {
      bookings,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...(groupedByTime && { groupedByTime }),
    };
  }

  /**
   * Export bookings to CSV (Daily Manifest)
   */
  async exportBookingsToCSV(date: string): Promise<string> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { bookingTime: 'asc' },
        { bookingDate: 'asc' },
      ],
    });

    // CSV header (as specified)
    const headers = [
      'bookingId',
      'status',
      'type',
      'scheduledDate',
      'scheduledTime',
      'customerName',
      'email',
      'phone',
      'pickup',
      'dropoff',
      'flightNumber',
      'itemsSummary',
      'parkFees',
      'totalCents',
      'currency',
      'paymentStatus',
      'paypalOrderId',
      'createdAt',
      'notes',
    ];

    const rows = bookings.map(booking => {
      // Group items
      const activities = booking.items.filter(i => 
        i.type === 'ACTIVITY' || i.type === 'COMBO' || i.type === 'CRAZY_COMBO'
      );
      const parkFees = booking.items.filter(i => i.type === 'PARK_ENTRANCE');
      const transportation = booking.items.filter(i => i.type === 'TRANSPORTATION');

      const itemsSummary = [
        ...activities.map(i => `${i.name} (${i.quantity}x)`),
        ...transportation.map(i => `${i.name}`),
      ].join('; ');

      const parkFeesTotal = parkFees.reduce((sum, item) => sum + item.totalPrice, 0);
      const parkFeesStr = parkFeesTotal > 0 ? (parkFeesTotal / 100).toFixed(2) : '';

      const payment = booking.payments[0];
      const paymentStatus = payment?.status || 'NONE';
      const paypalOrderId = payment?.orderId || '';

      return [
        booking.id,
        booking.status,
        booking.type,
        booking.bookingDate.toISOString().split('T')[0],
        booking.bookingTime || '',
        booking.customer.name,
        booking.customer.email,
        booking.customer.phone,
        booking.pickupLocation || '',
        booking.dropoffLocation || '',
        booking.flightNumber || '',
        itemsSummary,
        parkFeesStr,
        booking.totalAmount.toString(),
        booking.currency,
        paymentStatus,
        paypalOrderId,
        booking.createdAt.toISOString(),
        booking.notes || '',
      ];
    });

    // Escape CSV values
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Apply price override to booking
   */
  async applyPriceOverride(
    bookingId: string,
    newTotalCents: number,
    reason: string,
    userId?: string,
    userEmail?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
      throw new Error('Cannot override price for paid/confirmed booking');
    }

    const originalAmount = booking.totalAmount;

    // Create pricing override record
    await prisma.pricingOverride.create({
      data: {
        bookingId,
        originalAmount,
        overrideAmount: newTotalCents,
        reason,
        createdBy: userId,
      },
    });

    const split = splitTotalIncludingIva(newTotalCents);
    // Update booking total
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: split.totalCents,
        subtotalAmount: split.subtotalCents,
        taxAmount: split.taxCents,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Audit log
    await createAuditLog({
      action: 'PRICING_OVERRIDE',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Price override: $${(originalAmount / 100).toFixed(2)} → $${(newTotalCents / 100).toFixed(2)} (incl. IVA breakdown)`,
      changes: {
        totalAmount: { from: originalAmount, to: newTotalCents },
        reason,
      },
    });

    return updated;
  }

  /**
   * Remove price override (revert to computed total)
   */
  async removePriceOverride(bookingId: string, userId?: string, userEmail?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true, pricingOverrides: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
      throw new Error('Cannot remove override for paid/confirmed booking');
    }

    // Calculate original subtotal from items (pre-tax)
    const computedSubtotal = booking.items.reduce((sum, item) => {
      return sum + item.totalPrice;
    }, 0);
    const { subtotalCents, taxCents, totalCents } = applyMxIvaFromSubtotal(computedSubtotal);

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: totalCents,
        subtotalAmount: subtotalCents,
        taxAmount: taxCents,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Audit log
    await createAuditLog({
      action: 'PRICING_OVERRIDE',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Price override removed: Reverted to computed total $${(totalCents / 100).toFixed(2)} (incl. IVA)`,
      changes: {
        totalAmount: { from: booking.totalAmount, to: totalCents },
      },
    });

    return updated;
  }

  /**
   * Create manual/offline booking
   */
  async createManualBooking(
    input: CreateBookingInput,
    status: 'OFFLINE_HOLD' | 'CONFIRMED' = 'OFFLINE_HOLD',
    totalOverride?: number
  ) {
    // Subtotal pre-IVA (use override if provided = subtotal in cents)
    const subtotalPre = totalOverride ?? input.items.reduce((sum, item) => {
      return sum + moneyToCents(item.unitPrice) * item.quantity;
    }, 0);
    const { subtotalCents, taxCents, totalCents } = applyMxIvaFromSubtotal(subtotalPre);

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: { email: input.customer.email },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: input.customer.name,
          phone: input.customer.phone,
          country: input.customer.country,
          language: input.customer.language,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
          country: input.customer.country,
          language: input.customer.language,
        },
      });
    }

    // Parse booking date
    let bookingDate: Date;
    if (input.bookingDate instanceof Date) {
      bookingDate = input.bookingDate;
    } else {
      bookingDate = new Date(input.bookingDate);
      if (isNaN(bookingDate.getTime())) {
        throw new Error('Invalid booking date');
      }
    }

    const confirmationCode = await this.generateConfirmationCode();

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        type: input.type as BookingType,
        status: status as BookingStatus,
        source: 'ADMIN',
        customerId: customer.id,
        confirmationCode,
        bookingDate,
        bookingTime: input.bookingTime,
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        flightNumber: input.flightNumber,
        arrivalTime: input.arrivalTime,
        departureFlightNumber: input.departureFlightNumber,
        departureTime: input.departureTime,
        passengers: input.passengers,
        serviceType: input.serviceType,
        tripType: input.tripType,
        route: input.route,
        totalAmount: totalCents,
        subtotalAmount: subtotalCents,
        taxAmount: taxCents,
        notes: input.notes,
        metadata: (() => {
          const base =
            input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
              ? { ...input.metadata }
              : {};
          if (input.departureDate) {
            const dd = input.departureDate;
            base.departureDate = dd instanceof Date ? dd.toISOString() : String(dd);
          }
          return base;
        })(),
        ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
        items: {
          create: input.items.map(item => ({
            type: item.type,
            name: item.name,
            slug: item.slug,
            quantity: item.quantity,
            unitPrice: moneyToCents(item.unitPrice),
            totalPrice: moneyToCents(item.unitPrice) * item.quantity,
            metadata: item.metadata || {},
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Audit log
    await createAuditLog({
      action: 'CREATE',
      entityType: 'Booking',
      entityId: booking.id,
      description: `Manual booking created: ${booking.type} (${status})`,
    });

    return booking;
  }

  /**
   * Update booking fields (admin action)
   */
  async updateBooking(bookingId: string, data: UpdateBookingInput, userId?: string, userEmail?: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');

    const update: Record<string, any> = {};

    if (data.bookingDate !== undefined) {
      const d = new Date(data.bookingDate);
      if (isNaN(d.getTime())) throw new Error('Invalid booking date');
      update.bookingDate = d;
    }

    const directFields = [
      'bookingTime', 'passengers', 'notes', 'internalNotes',
      'flightNumber', 'arrivalTime', 'departureFlightNumber',
      'departureTime', 'pickupLocation', 'dropoffLocation',
    ] as const;
    for (const key of directFields) {
      if (data[key] !== undefined) update[key] = data[key];
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: update,
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        assignments: { include: { driver: true, vehicle: true } },
        emailLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Booking',
      entityId: bookingId,
      userId,
      userEmail,
      description: `Booking updated by admin`,
      changes: update,
    });

    return updated;
  }

  /**
   * Update customer information for a booking
   */
  async updateCustomer(
    bookingId: string,
    customerData: { name?: string; email?: string; phone?: string; country?: string }
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: booking.customerId },
      data: {
        ...(customerData.name && { name: customerData.name }),
        ...(customerData.email && { email: customerData.email }),
        ...(customerData.phone && { phone: customerData.phone }),
        ...(customerData.country && { country: customerData.country }),
      },
    });

    // Return updated booking
    return await this.getBookingById(bookingId);
  }
}

