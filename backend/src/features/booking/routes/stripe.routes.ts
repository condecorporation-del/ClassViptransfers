import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../../shared/lib/prisma';
import { getErrorMessage } from '../../../shared/lib/errors';
import { EmailService } from '../services/email.service';

const router = Router();
const emailService = new EmailService();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

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
    const existingPayment = booking.payments.find(
      (payment) => payment.provider === 'STRIPE' && payment.status === 'PENDING' && payment.orderId
    );

    if (existingPayment?.orderId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(existingPayment.orderId);
        if (existing.status !== 'canceled' && existing.status !== 'succeeded') {
          return res.json({ success: true, data: { clientSecret: existing.client_secret } });
        }
      } catch {
        // Fall through and create a fresh intent.
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalAmount,
      currency: (booking.currency || 'USD').toLowerCase(),
      metadata: {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode ?? '',
        customerEmail: booking.customer?.email ?? '',
      },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'STRIPE',
        status: 'PENDING',
        orderId: paymentIntent.id,
        amount: booking.totalAmount,
        currency: booking.currency || 'USD',
      },
    });

    return res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to create payment intent');
    console.error('[Stripe] create-payment-intent error:', message);
    return res.status(500).json({ error: message });
  }
});

router.post('/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({ error: 'bookingId and paymentIntentId are required' });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not completed. Status: ${intent.status}` });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: { customer: true, items: true },
    });

    await prisma.payment.updateMany({
      where: { bookingId, orderId: paymentIntentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    emailService.sendConfirmationEmails(booking, false).catch((error) => {
      console.error('[Stripe] Confirmation email error:', getErrorMessage(error, 'Unknown email error'));
    });

    return res.json({ success: true, data: { status: booking.status } });
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to confirm payment');
    console.error('[Stripe] confirm-payment error:', message);
    return res.status(500).json({ error: message });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set - skipping verification');
    return res.json({ received: true });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    const message = getErrorMessage(error, 'Webhook signature verification failed');
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return res.status(400).json({ error: `Webhook error: ${message}` });
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

        emailService.sendConfirmationEmails(booking, false).catch((error) => {
          console.error('[Stripe Webhook] Email error:', getErrorMessage(error, 'Unknown email error'));
        });

        console.log(`[Stripe Webhook] Booking ${bookingId} confirmed`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] DB error:', getErrorMessage(error, 'Unknown database error'));
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  res.json({ received: true });
});

export default router;
