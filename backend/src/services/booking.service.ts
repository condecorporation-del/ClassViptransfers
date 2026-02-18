import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';
import { moneyToCents, CreateBookingInput } from '../lib/validation';
import { BookingStatus, BookingType, BookingSource } from '@prisma/client';

export class BookingService {
  /**
   * Create a draft booking
   */
  async createDraftBooking(input: CreateBookingInput, source: BookingSource = 'WEBSITE') {
    // Calculate total amount in cents
    const totalAmount = input.items.reduce((sum, item) => {
      return sum + moneyToCents(item.unitPrice) * item.quantity;
    }, 0);

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

    // Create booking with items
    const booking = await prisma.booking.create({
      data: {
        type: input.type as BookingType,
        status: BookingStatus.DRAFT,
        source,
        customerId: customer.id,
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
        totalAmount,
        subtotalAmount: totalAmount,
        notes: input.notes,
        metadata: input.metadata || {},
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
  async getBookingById(id: string) {
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
            // Note: Driver and Vehicle relations would be included here
            // when those models are fully implemented
          },
        },
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
    status?: string;
    type?: string;
    q?: string; // Search query
    page?: number;
    limit?: number;
    groupedByTime?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      where.bookingDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // Search query (name, email, phone, bookingId)
    if (filters.q) {
      const searchTerm = filters.q.trim();
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
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

    // Update booking total
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: newTotalCents,
        subtotalAmount: newTotalCents,
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
      description: `Price override: $${(originalAmount / 100).toFixed(2)} → $${(newTotalCents / 100).toFixed(2)}`,
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

    // Calculate original total from items
    const computedTotal = booking.items.reduce((sum, item) => {
      return sum + item.totalPrice;
    }, 0);

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: computedTotal,
        subtotalAmount: computedTotal,
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
      description: `Price override removed: Reverted to computed total $${(computedTotal / 100).toFixed(2)}`,
      changes: {
        totalAmount: { from: booking.totalAmount, to: computedTotal },
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
    // Calculate total (use override if provided)
    const totalAmount = totalOverride || input.items.reduce((sum, item) => {
      return sum + moneyToCents(item.unitPrice) * item.quantity;
    }, 0);

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

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        type: input.type as BookingType,
        status: status as BookingStatus,
        source: 'ADMIN',
        customerId: customer.id,
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
        totalAmount,
        subtotalAmount: totalAmount,
        notes: input.notes,
        metadata: input.metadata || {},
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

