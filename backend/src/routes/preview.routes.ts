import { Router, Request, Response } from 'express';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

/**
 * GET /api/preview/booking-email
 * Preview booking confirmation email with mock data.
 * Query params: passengers, extras, flight, activities, manualConfirm
 * Example: ?passengers=2&extras=true&flight=true
 */
router.get('/booking-email', (req: Request, res: Response) => {
  const passengers = Math.min(14, Math.max(1, parseInt(String(req.query.passengers || '2'), 10) || 2));
  const hasExtras = String(req.query.extras).toLowerCase() === 'true' || req.query.extras === '1';
  const hasFlight = String(req.query.flight).toLowerCase() === 'true' || req.query.flight === '1';
  const hasActivities = String(req.query.activities).toLowerCase() === 'true' || req.query.activities === '1';
  const manualConfirm = String(req.query.manualConfirm).toLowerCase() === 'true' || req.query.manualConfirm === '1';

  const items: Array<{ type: string; name: string; quantity: number; totalPrice: number; metadata?: object }> = [
    {
      type: 'TRANSPORTATION',
      name: 'Private Transfer - Villa La Estancia → SJD Airport',
      quantity: 1,
      totalPrice: 13000,
      metadata: {
        included: [{ code: 'BASIC_KIT', label: 'Basic kit (beers + water)' }],
        extras: hasExtras ? [{ label: 'Baby Seat', qty: 1, priceCents: 1500 }, { label: 'Grocery Stop', qty: 1, priceCents: 5000 }] : [],
      },
    },
  ];

  if (hasExtras) {
    items.push({ type: 'ADDON', name: 'Baby Seat', quantity: 1, totalPrice: 1500 });
    items.push({ type: 'ADDON', name: 'Grocery Stop', quantity: 1, totalPrice: 5000 });
  }

  if (hasActivities) {
    items.push({ type: 'ACTIVITY', name: 'ATV Adventure Tour', quantity: passengers, totalPrice: 12000 });
    items.push({ type: 'PARK_ENTRANCE', name: 'Park Entrance Fee', quantity: passengers, totalPrice: 2500 });
  }

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

  const mockBooking = {
    id: 'c' + 'x'.repeat(23),
    type: hasActivities ? 'COMBO' : 'TRANSPORTATION',
    status: 'CONFIRMED',
    customer: {
      name: 'John Doe',
      email: 'customer@example.com',
      phone: '+1 (555) 123-4567',
    },
    bookingDate: new Date(),
    bookingTime: '10:00 AM',
    pickupTime: '10:00 AM',
    pickupLocation: 'Villa La Estancia, Cabo Pacific Area',
    dropoffLocation: 'SJD International Airport',
    flightNumber: hasFlight ? 'AA1234' : null,
    arrivalTime: hasFlight ? '10:30 AM' : null,
    departureFlightNumber: hasFlight ? 'AA5678' : null,
    departureTime: hasFlight ? '15:00' : null,
    arrivalAirline: hasFlight ? 'American Airlines' : null,
    departureAirline: hasFlight ? 'American Airlines' : null,
    passengers,
    totalAmount,
    notes: 'Please arrive 15 minutes early.',
    internalNotes: null,
    items,
  };

  const LOGO_URL = process.env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/dpmozdkfh/image/upload/v1772074422/Gemini_Generated_Image_zbgk2uzbgk2uzbgk_jnj3n2.png';

  try {
    const data = emailService.getFormatBookingData(mockBooking as any);
    (data as any).logoUrl = LOGO_URL;
    (data as any).paymentMethodText = manualConfirm ? '✓ Paid offline (confirmed)' : '✓ Paid via PayPal';
    (data as any).confirmationPdfUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/preview/booking-email?passengers=${passengers}`;
    const html = emailService.renderConfirmationEmail(data as Record<string, unknown>);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to render preview', details: err?.message });
  }
});

export default router;
