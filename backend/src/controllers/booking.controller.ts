import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import {
  createBookingSchema,
  confirmBookingSchema,
  cancelBookingSchema,
  assignBookingSchema,
  updateCustomerSchema,
  listBookingsSchema,
  exportBookingsSchema,
} from '../lib/validation';

const bookingService = new BookingService();

export class BookingController {
  /**
   * POST /api/bookings
   * Create a draft booking
   */
  async createBooking(req: Request, res: Response) {
    const input = createBookingSchema.parse(req.body);
    const source = (req.body.source || 'WEBSITE').toUpperCase();
    
    const booking = await bookingService.createDraftBooking(input, source as any);
    
    res.status(201).json({
      success: true,
      data: booking,
    });
  }

  /**
   * GET /api/bookings/:id
   * Get booking details
   */
  async getBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    
    const booking = await bookingService.getBookingById(id);
    
    res.json({
      success: true,
      data: booking,
    });
  }

  /**
   * POST /api/bookings/:id/confirm
   * Admin confirm booking
   */
  async confirmBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string' || !id.match(/^c[a-z0-9]{24}$/)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    
    const { notes } = confirmBookingSchema.parse(req.body);
    
    // In a real app, get userId/userEmail from auth middleware
    const userId = req.headers['x-user-id'] as string | undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    
    const booking = await bookingService.confirmBooking(id, userId, userEmail, notes);
    
    res.json({
      success: true,
      data: booking,
    });
  }

  /**
   * POST /api/bookings/:id/cancel
   * Cancel booking
   */
  async cancelBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string' || !id.match(/^c[a-z0-9]{24}$/)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    
    const { reason } = cancelBookingSchema.parse(req.body);
    
    const userId = req.headers['x-user-id'] as string | undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    
    const booking = await bookingService.cancelBooking(id, reason, userId, userEmail);
    
    res.json({
      success: true,
      data: booking,
    });
  }

  /**
   * POST /api/bookings/:id/assign
   * Assign driver/vehicle to booking
   */
  async assignBooking(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string' || !id.match(/^c[a-z0-9]{24}$/)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    
    const input = assignBookingSchema.parse(req.body);
    
    const userId = req.headers['x-user-id'] as string | undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    
    const result = await bookingService.assignBooking(
      id,
      input.driverId,
      input.vehicleId,
      userId,
      userEmail,
      input.notes
    );
    
    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * PATCH /api/bookings/:id/customer
   * Update customer information
   */
  async updateCustomer(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string' || !id.match(/^c[a-z0-9]{24}$/)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const customerData = updateCustomerSchema.parse(req.body);
    
    const booking = await bookingService.updateCustomer(id, customerData);
    
    res.json({
      success: true,
      data: booking,
    });
  }
}

