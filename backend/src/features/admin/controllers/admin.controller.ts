import { Request, Response } from 'express';
import { prisma } from '../../../shared/lib/prisma';
import { BookingService } from '../../booking/services/booking.service';
import { EmailService } from '../../booking/services/email.service';
import { PdfService } from '../../booking/services/pdf.service';
import { DriverVehicleService } from '../../booking/services/driver-vehicle.service';
import { ClientAccountsService } from '../services/client-accounts.service';
import {
  listBookingsSchema,
  exportBookingsSchema,
  priceOverrideSchema,
  assignBookingSchemaExtended,
  createDriverSchema,
  createVehicleSchema,
  createClientAccountSchema,
  createAccountChargeSchema,
  createAccountPaymentSchema,
  manualBookingSchema,
  updateBookingSchema,
} from '../../../shared/lib/validation';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '../../../shared/lib/audit';
import { getErrorMessage } from '../../../shared/lib/errors';

const bookingService = new BookingService();
const emailService = new EmailService();
const pdfService = new PdfService();
const driverVehicleService = new DriverVehicleService();
const clientAccountsService = new ClientAccountsService();
type PreviewBooking = Parameters<EmailService['getFormatBookingData']>[0];

export class AdminController {
  /**
   * GET /api/admin/bookings/:id
   * Get single booking with email logs
   */
  async getBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    try {
      const booking = await bookingService.getBookingById(id, { includeEmailLogs: true });
      res.json({ success: true, data: booking });
    } catch {
      res.status(404).json({ error: 'Booking not found' });
    }
  }

  /**
   * GET /api/admin/bookings/:id/confirmation-pdf
   * Download booking confirmation PDF (admin auth; no token required)
   */
  async getConfirmationPdf(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    try {
      const pdfBuffer = await pdfService.generateBookingConfirmationPdf(id);
      const filename = `reservation-${id.substring(0, 8).toUpperCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('[Admin] PDF generation failed:', getErrorMessage(err, 'Failed to generate PDF.')); 
      res.status(500).json({ error: 'Failed to generate PDF.', details: getErrorMessage(err) });
    }
  }

  /**
   * GET /api/admin/stats
   * Dashboard stats including emails sent today
   */
  async getStats(req: Request, res: Response) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [bookingsToday, emailsSentToday, pendingCount, accountsSummary] = await Promise.all([
      prisma.booking.count({
        where: {
          bookingDate: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.emailLog.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'SENT',
        },
      }),
      prisma.booking.count({
        where: { status: { in: ['DRAFT', 'PENDING_PAYMENT'] } },
      }),
      clientAccountsService.getAccountsSummary().catch(() => ({
        totalAccounts: 0,
        openAccounts: 0,
        outstandingBalanceCents: 0,
        settledAccounts: 0,
      })),
    ]);

    const revenueResult = await prisma.booking.aggregate({
      where: {
        bookingDate: { gte: today, lt: tomorrow },
        status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
      },
      _sum: { totalAmount: true },
    });
    const revenueCents = revenueResult._sum.totalAmount || 0;

    res.json({
      success: true,
      data: {
        bookingsToday,
        emailsSentToday,
        pendingCount,
        revenueToday: (revenueCents / 100).toFixed(2),
        accounts: accountsSummary,
      },
    });
  }

  /**
   * GET /api/admin/dashboard
   * Full dashboard: totalToday, totalMonth, revenueToday, revenueMonth, bookingsToday[], bookingsRecent[]
   */
  async getDashboard(req: Request, res: Response) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const last7Start = new Date(todayStart);
    last7Start.setDate(last7Start.getDate() - 6);

    const [
      totalToday,
      totalMonth,
      revenueTodayResult,
      revenueMonthResult,
      bookingsTodayList,
      bookingsRecentList,
      bookingsLast7,
      accountsSummary,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          bookingDate: { gte: todayStart, lt: todayEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.count({
        where: {
          bookingDate: { gte: monthStart, lt: monthEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.aggregate({
        where: {
          bookingDate: { gte: todayStart, lt: todayEnd },
          status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.aggregate({
        where: {
          bookingDate: { gte: monthStart, lt: monthEnd },
          status: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: {
          bookingDate: { gte: todayStart, lt: todayEnd },
          status: { not: 'CANCELLED' },
        },
        include: { customer: true, items: true },
        orderBy: [{ bookingTime: 'asc' }, { createdAt: 'asc' }],
        take: 50,
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true },
        take: 20,
      }),
      prisma.booking.findMany({
        where: {
          bookingDate: { gte: last7Start, lt: todayEnd },
        },
        select: {
          id: true,
          bookingDate: true,
          totalAmount: true,
          status: true,
          dropoffLocation: true,
          pickupLocation: true,
          tripType: true,
        },
      }),
      clientAccountsService.getAccountsSummary().catch(() => ({
        totalAccounts: 0,
        openAccounts: 0,
        outstandingBalanceCents: 0,
        settledAccounts: 0,
      })),
    ]);

    const bookingsByDayMap = new Map<string, { date: string; bookings: number; revenueCents: number }>();
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(last7Start);
      date.setDate(last7Start.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      bookingsByDayMap.set(key, { date: key, bookings: 0, revenueCents: 0 });
    }

    for (const booking of bookingsLast7) {
      const key = booking.bookingDate.toISOString().slice(0, 10);
      const existing = bookingsByDayMap.get(key);
      if (!existing) continue;
      existing.bookings += booking.status === 'CANCELLED' ? 0 : 1;
      if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(booking.status)) {
        existing.revenueCents += booking.totalAmount;
      }
    }

    const statusCounts = bookingsLast7.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const topRoutesMap = bookingsLast7.reduce<Map<string, number>>((acc, booking) => {
      const route = `${booking.pickupLocation || 'Pickup'} → ${booking.dropoffLocation || 'Destination'}`;
      acc.set(route, (acc.get(route) || 0) + 1);
      return acc;
    }, new Map());

    const topRoutes = [...topRoutesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    res.json({
      success: true,
      data: {
        totalToday,
        totalMonth,
        revenueToday: ((revenueTodayResult._sum.totalAmount || 0) / 100).toFixed(2),
        revenueMonth: ((revenueMonthResult._sum.totalAmount || 0) / 100).toFixed(2),
        bookingsToday: bookingsTodayList,
        bookingsRecent: bookingsRecentList,
        trends: {
          last7Days: [...bookingsByDayMap.values()].map((entry) => ({
            ...entry,
            revenue: Number((entry.revenueCents / 100).toFixed(2)),
            label: new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          })),
          statusCounts,
          topRoutes,
        },
        accounts: accountsSummary,
      },
    });
  }

  async listClientAccounts(req: Request, res: Response) {
    const accounts = await clientAccountsService.listAccounts();
    res.json({ success: true, data: accounts });
  }

  async getClientAccount(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Account ID is required' });

    try {
      const account = await clientAccountsService.getAccountById(id);
      res.json({ success: true, data: account });
    } catch (error) {
      res.status(404).json({ success: false, error: getErrorMessage(error) });
    }
  }

  async createClientAccount(req: Request, res: Response) {
    try {
      const input = createClientAccountSchema.parse(req.body);
      const account = await clientAccountsService.createAccount(input, req.adminEmail);
      await createAuditLog({
        action: 'CREATE',
        entityType: 'ClientAccount',
        entityId: account.id,
        userEmail: req.adminEmail,
        description: `Created client account ${account.name}`,
      });
      res.status(201).json({ success: true, data: account });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  async createAccountCharge(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Account ID is required' });

    try {
      const input = createAccountChargeSchema.parse(req.body);
      const charge = await clientAccountsService.addCharge(id, input, req.adminEmail);
      await createAuditLog({
        action: 'CREATE',
        entityType: 'AccountCharge',
        entityId: charge.id,
        userEmail: req.adminEmail,
        description: `Added account charge to ${id}`,
      });
      res.status(201).json({ success: true, data: charge });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  async attachBookingToAccount(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Account ID is required' });

    try {
      const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId : '';
      if (!bookingId) {
        return res.status(400).json({ success: false, error: 'bookingId is required' });
      }
      const charge = await clientAccountsService.attachBooking(id, bookingId, req.adminEmail);
      await createAuditLog({
        action: 'CREATE',
        entityType: 'AccountCharge',
        entityId: charge.id,
        userEmail: req.adminEmail,
        description: `Attached booking ${bookingId} to account ${id}`,
      });
      res.status(201).json({ success: true, data: charge });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  async createAccountPayment(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Account ID is required' });

    try {
      const input = createAccountPaymentSchema.parse(req.body);
      const payment = await clientAccountsService.addPayment(id, input, req.adminEmail);
      await createAuditLog({
        action: 'PAYMENT',
        entityType: 'ClientAccount',
        entityId: id,
        userEmail: req.adminEmail,
        description: `Recorded account payment for ${id}`,
      });
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  /**
   * GET /api/admin/bookings
   * List bookings with filters
   */
  async listBookings(req: Request, res: Response) {
    const filters = listBookingsSchema.parse(req.query);
    
    const result = await bookingService.listBookings(filters);
    
    res.json({
      success: true,
      data: result.bookings,
      total: result.total,
      pagination: result.pagination,
      ...(result.groupedByTime && { groupedByTime: result.groupedByTime }),
    });
  }

  /**
   * GET /api/admin/bookings/export
   * Export bookings to CSV
   */
  async exportBookings(req: Request, res: Response) {
    const { date, format } = exportBookingsSchema.parse(req.query);
    
    if (format === 'csv') {
      const csv = await bookingService.exportBookingsToCSV(date);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bookings-${date}.csv"`);
      res.send(csv);
    } else {
      // JSON export
      const filters = { date, page: 1, limit: 10000 };
      const result = await bookingService.listBookings(filters);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="bookings-${date}.json"`);
      res.json(result.bookings);
    }
  }

  /**
   * POST /api/admin/bookings/:id/confirm
   * Mark booking as paid offline (confirm)
   */
  async confirmBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    try {
      const { notes } = (req.body || {}) as { notes?: string };
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;
      const booking = await bookingService.confirmBooking(id, userId, userEmail, notes);
      try {
        await emailService.sendConfirmationEmails(booking, false, { manualConfirm: true });
      } catch (e) {
        console.error('[Admin] Confirm emails failed:', e);
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  /**
   * POST /api/admin/bookings/:id/resend-confirmation
   * Resend confirmation emails
   */
  async resendConfirmation(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    try {
      // Get booking with relations
      const booking = await bookingService.getBookingById(id);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const hasCompletedStripePayment = booking.payments?.some(
        (payment) => payment.provider === 'STRIPE' && payment.status === 'COMPLETED'
      );

      // Resend emails (force resend)
      const result = await emailService.sendConfirmationEmails(booking, true, {
        manualConfirm: !hasCompletedStripePayment,
      });

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Booking',
        entityId: id,
        userId,
        userEmail,
        description: `Resent confirmation emails (customer: ${result.customerSent}, company: ${result.companySent})`,
      });

      res.json({
        success: true,
        data: {
          customerEmailSent: result.customerSent,
          companyEmailSent: result.companySent,
        },
      });
    } catch (error) {
      console.error('Resend confirmation error:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/test-email (dev only)
   * Send test emails (both customer and company templates)
   * Body: { customerEmail: string, companyEmail?: string }
   */
  async testEmail(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test emails disabled in production' });
    }

    const { customerEmail, companyEmail } = req.body;

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Missing required field: customerEmail',
      });
    }

    try {
      const result = await emailService.sendTestEmail(customerEmail, companyEmail);

      res.json({
        success: true,
        data: {
          customerSent: result.customerSent,
          companySent: result.companySent,
          details: result.details,
          message: `Test emails sent - Customer: ${result.customerSent ? '✅' : '❌'}, Company: ${result.companySent ? '✅' : '❌'}`,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * GET /api/admin/preview-email (dev only)
   * Preview email templates with mock data
   * Query: ?type=customer|company
   */
  async previewEmail(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Email preview disabled in production' });
    }

    const { type } = req.query;
    const templateType = type === 'company' ? 'company' : 'customer';

    try {
      // Create mock booking data
      const mockBooking: PreviewBooking = {
        id: 'test-booking-' + Date.now(),
        type: 'ACTIVITY',
        status: 'CONFIRMED',
        customer: {
          name: 'John Doe',
          email: 'customer@example.com',
          phone: '+1 (555) 123-4567',
        },
        bookingDate: new Date(),
        bookingTime: '10:00 AM',
        pickupLocation: 'Los Cabos International Airport',
        dropoffLocation: 'Hotel Zone, Cabo San Lucas',
        flightNumber: 'AA1234',
        arrivalTime: '10:30 AM',
        departureFlightNumber: 'AA567',
        departureTime: '2:00 PM',
        departureAirline: 'American Airlines',
        passengers: 2,
        totalAmount: 12500,
        subtotalAmount: 10776,
        taxAmount: 1724,
        tripType: 'roundtrip',
        route: 'airport-hotel',
        confirmationCode: 'CLASS-PRV-001',
        metadata: { departureDate: '2026-04-20T12:00:00.000Z' } as Prisma.JsonObject,
        payments: [{ provider: 'STRIPE', status: 'COMPLETED' }],
        notes: 'Please arrive 15 minutes early. Special dietary requirements noted.',
        internalNotes: 'VIP customer - assign experienced driver',
        items: [
          {
            type: 'ACTIVITY',
            name: 'ATV Adventure Tour',
            quantity: 2,
            totalPrice: 10000,
          },
          {
            type: 'PARK_ENTRANCE',
            name: 'Park Entrance Fee',
            quantity: 2,
            totalPrice: 2500,
          },
        ],
      };

      const emailService = new EmailService();
      const data = emailService.getFormatBookingData(mockBooking);
      if (templateType === 'company') {
        Object.assign(data, {
          companyEmailTitle: 'New Booking Confirmed',
          companyStatusBadge: 'CONFIRMED',
          companyStatusBadgeColor: '#10B981',
          companyPaymentStatusText: '✓ Confirmed',
          companyPaymentStatusColor: '#10B981',
        });
      }
      const templateName = templateType === 'company' ? 'company-confirmed' : 'customer-confirmed';
      const html = emailService.renderEmailTemplate(templateName, data as Record<string, unknown>);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/bookings/:id/price-override
   * Apply price override
   */
  async priceOverride(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    try {
      const { newTotalCents, reason } = priceOverrideSchema.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      const booking = await bookingService.applyPriceOverride(
        id,
        newTotalCents,
        reason,
        userId,
        userEmail
      );

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error('Price override error:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * DELETE /api/admin/bookings/:id/price-override
   * Remove price override
   */
  async removePriceOverride(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      const booking = await bookingService.removePriceOverride(id, userId, userEmail);

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error('Remove price override error:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/bookings/:id/assign
   * Assign driver/vehicle (extended)
   */
  async assignBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    try {
      const input = assignBookingSchemaExtended.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      const result = await bookingService.assignBookingExtended(
        id,
        input.driverId,
        input.vehicleId,
        input.pickupTime,
        input.internalNotes,
        userId,
        userEmail
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Assign booking error:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/bookings/manual
   * Create manual/offline booking
   */
  async createManualBooking(req: Request, res: Response) {
    try {
      const input = manualBookingSchema.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;
      const emailMeta: {
        mode: 'payment-link' | 'confirmation' | 'none';
        customerSent: boolean;
        companySent: boolean;
      } = {
        mode: 'none',
        customerSent: false,
        companySent: false,
      };

      const booking = await bookingService.createManualBooking(
        input,
        input.status,
        input.totalAmount
      );

      // Option A: send secure payment link (pending-payment email)
      if (input.sendPaymentLink && !input.sendConfirmation) {
        emailMeta.mode = 'payment-link';
        try {
          const sent = await emailService.sendBookingReceived(booking);
          emailMeta.customerSent = sent.customerSent;
          emailMeta.companySent = sent.companySent;
        } catch (emailError) {
          console.error('Failed to send payment link email:', emailError);
        }
      }

      // Option B: mark as paid in cash — send confirmation immediately
      if (input.sendConfirmation) {
        emailMeta.mode = 'confirmation';
        try {
          const sent = await emailService.sendConfirmationEmails(booking, false, { manualConfirm: true });
          emailMeta.customerSent = sent.customerSent;
          emailMeta.companySent = sent.companySent;
        } catch (emailError) {
          console.error('Failed to send confirmation emails:', emailError);
        }
      }

      // Audit log
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Booking',
        entityId: booking.id,
        userId,
        userEmail,
        description: `Manual booking created: ${booking.type} (${input.status})`,
      });

      res.status(201).json({
        success: true,
        data: {
          ...booking,
          email: emailMeta,
        },
      });
    } catch (error) {
      console.error('Create manual booking error:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * PATCH /api/admin/bookings/:id
   * Update booking fields
   */
  async updateBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Booking ID is required' });
    try {
      const data = updateBookingSchema.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;
      const booking = await bookingService.updateBooking(id, data, userId, userEmail);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  /**
   * POST /api/admin/bookings/:id/cancel
   * Cancel booking (admin)
   */
  async cancelBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Booking ID is required' });
    try {
      const { reason } = (req.body || {}) as { reason?: string };
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;
      const booking = await bookingService.cancelBooking(id, reason, userId, userEmail);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error) });
    }
  }

  /**
   * GET /api/admin/drivers
   * List drivers
   */
  async listDrivers(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const drivers = await driverVehicleService.listDrivers(includeInactive);

      res.json({
        success: true,
        data: drivers,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/drivers
   * Create driver
   */
  async createDriver(req: Request, res: Response) {
    try {
      const input = createDriverSchema.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      const driver = await driverVehicleService.createDriver(input, userId, userEmail);

      res.status(201).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * GET /api/admin/vehicles
   * List vehicles
   */
  async listVehicles(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const vehicles = await driverVehicleService.listVehicles(includeInactive);

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  /**
   * POST /api/admin/vehicles
   * Create vehicle
   */
  async createVehicle(req: Request, res: Response) {
    try {
      const input = createVehicleSchema.parse(req.body);
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.adminEmail;

      const vehicle = await driverVehicleService.createVehicle(input, userId, userEmail);

      res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }
}


