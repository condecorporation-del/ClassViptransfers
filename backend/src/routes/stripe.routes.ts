import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

// ─── POST /api/stripe/create-payment-intent ──────────────────────────────────
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, payments: true },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'This booking is already paid and confirmed.' });
    }

    const stripe = getStripe();

    // Check for an existing incomplete payment intent (idempotency)
    const existingPayment = booking.payments.find(
      (p) => p.provider === 'STRIPE' && p.status === 'PENDING' && p.orderId
    );
    if (existingPayment?.orderId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(existingPayment.orderId);
        if (existing.status !== 'canceled' && existing.status !== 'succeeded') {
          return res.json({ success: true, data: { clientSecret: existing.client_secret } });
        }
      } catch {
        // Fall through to create a new one
      }
    }

    const amountCents = booking.totalAmount; // Already stored in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (booking.currency || 'USD').toLowerCase(),
      metadata: {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode ?? '',
        customerEmail: booking.customer?.email ?? '',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Record the pending payment in our DB
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'STRIPE',
        status: 'PENDING',
        orderId: paymentIntent.id,
        amount: amountCents,
        currency: booking.currency || 'USD',
      },
    });

    return res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (err: any) {
    console.error('[Stripe] create-payment-intent error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to create payment intent' });
  }
});

// ─── POST /api/stripe/confirm-payment ────────────────────────────────────────
router.post('/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({ error: 'bookingId and paymentIntentId are required' });
    }

    // Verify with Stripe that the payment actually succeeded
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not completed. Status: ${intent.status}` });
    }

    // Confirm booking in DB
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: { customer: true, items: true },
    });

    // Update payment record to COMPLETED
    await prisma.payment.updateMany({
      where: { bookingId, orderId: paymentIntentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Send confirmation emails (non-blocking)
    emailService.sendConfirmationEmails(booking as any, false).catch((err: any) => {
      console.error('[Stripe] Confirmation email error:', err?.message);
    });

    return res.json({ success: true, data: { status: booking.status } });
  } catch (err: any) {
    console.error('[Stripe] confirm-payment error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to confirm payment' });
  }
});

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
// Fallback: confirms booking if client-side confirm-payment call fails.
// Note: server.ts registers raw body parsing for this route before express.json()
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification');
    return res.json({ received: true });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) return res.json({ received: true });

    try {
      const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (existing && existing.status !== 'CONFIRMED') {
        const booking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
          include: { customer: true, items: true },
        });

        await prisma.payment.updateMany({
          where: { bookingId, orderId: intent.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        emailService.sendConfirmationEmails(booking as any, false).catch((err: any) => {
          console.error('[Stripe Webhook] Email error:', err?.message);
        });

        console.log(`[Stripe Webhook] ✅ Booking ${bookingId} confirmed`);
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] DB error:', err?.message);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  res.json({ received: true });
});

export default router;
