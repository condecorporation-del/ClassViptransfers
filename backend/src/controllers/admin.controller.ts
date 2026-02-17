import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { EmailService } from '../services/email.service';
import { DriverVehicleService } from '../services/driver-vehicle.service';
import {
  listBookingsSchema,
  exportBookingsSchema,
  priceOverrideSchema,
  assignBookingSchemaExtended,
  createDriverSchema,
  createVehicleSchema,
  manualBookingSchema,
} from '../lib/validation';
import { createAuditLog } from '../lib/audit';

const bookingService = new BookingService();
const emailService = new EmailService();
const driverVehicleService = new DriverVehicleService();

export class AdminController {
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
      const filters = { date, limit: 10000 };
      const result = await bookingService.listBookings(filters);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="bookings-${date}.json"`);
      res.json(result.bookings);
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

      // Resend emails (force resend)
      const result = await emailService.sendConfirmationEmails(booking, true);

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

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
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend confirmation emails',
      });
    }
  }

  /**
   * POST /api/admin/test-email (dev only)
   * Send test email
   */
  async testEmail(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test emails disabled in production' });
    }

    const { to, type } = req.body;

    if (!to || !type) {
      return res.status(400).json({
        error: 'Missing required fields: to, type (customer|company)',
      });
    }

    try {
      const sent = await emailService.sendTestEmail(to, type);

      res.json({
        success: true,
        data: {
          sent,
          message: `Test ${type} email ${sent ? 'sent' : 'failed'} to ${to}`,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send test email',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

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
    } catch (error: any) {
      console.error('Price override error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to apply price override',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

      const booking = await bookingService.removePriceOverride(id, userId, userEmail);

      res.json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      console.error('Remove price override error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove price override',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

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
    } catch (error: any) {
      console.error('Assign booking error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to assign booking',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

      const booking = await bookingService.createManualBooking(
        input,
        input.status,
        input.totalAmount
      );

      // Send confirmation email if requested
      if (input.sendConfirmation) {
        try {
          await emailService.sendConfirmationEmails(booking, false);
        } catch (emailError) {
          console.error('Failed to send confirmation emails:', emailError);
          // Don't fail the booking creation
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
        data: booking,
      });
    } catch (error: any) {
      console.error('Create manual booking error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create manual booking',
      });
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to list drivers',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

      const driver = await driverVehicleService.createDriver(input, userId, userEmail);

      res.status(201).json({
        success: true,
        data: driver,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create driver',
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to list vehicles',
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
      const userEmail = req.headers['x-user-email'] as string | undefined;

      const vehicle = await driverVehicleService.createVehicle(input, userId, userEmail);

      res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create vehicle',
      });
    }
  }
}
