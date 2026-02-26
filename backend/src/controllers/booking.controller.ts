import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { EmailService } from '../services/email.service';
import { PdfService } from '../services/pdf.service';
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
const emailService = new EmailService();
const pdfService = new PdfService();

export class BookingController {
  /**
   * POST /api/bookings
   * Create a draft booking
   */
  async createBooking(req: Request, res: Response) {
    const input = createBookingSchema.parse(req.body);
    const source = (req.body.source || 'WEBSITE').toUpperCase();

    const booking = await bookingService.createDraftBooking(input, source as any);

    // Send "Booking Received / Pending Payment" email (non-blocking, errors logged)
    emailService.sendBookingReceived(booking).catch((err) => {
      console.error('[Booking] Email failed:', err?.message || err);
      if (err?.stack) console.error(err.stack);
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  }

  /**
   * GET /api/bookings/:id/confirmation-pdf?token=xxx
   * Download booking confirmation PDF (token from email link; no auth required)
   */
  async getConfirmationPdf(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }
    if (!token) {
      return res.status(401).json({ error: 'Download token is required. Use the link from your confirmation email.' });
    }
    const bookingId = pdfService.verifyPdfToken(token);
    if (!bookingId || bookingId !== id) {
      return res.status(403).json({ error: 'Invalid or expired download link.' });
    }
    try {
      const pdfBuffer = await pdfService.generateBookingConfirmationPdf(bookingId);
      const filename = `reservation-${id.substring(0, 8).toUpperCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('[Booking] PDF generation failed:', err?.message || err);
      res.status(500).json({ error: 'Failed to generate PDF.', details: err?.message });
    }
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

    // Send manual confirmation emails (admin confirmed / paid offline)
    emailService.sendConfirmationEmails(booking, false, { manualConfirm: true }).catch((err) => {
      console.error('[Booking] Failed to send manual confirmation emails:', err);
    });

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

    // Send cancellation email (non-blocking)
    emailService.sendCancellation(booking, reason).catch((err) => {
      console.error('[Booking] Failed to send cancellation email:', err);
    });

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

