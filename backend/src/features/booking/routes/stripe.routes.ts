import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../../shared/lib/prisma';
import { getErrorMessage } from '../../../shared/lib/errors';
import { createAuditLog } from '../../../shared/lib/audit';
import { EmailService } from '../services/email.service';
import { optionalAdminAuth } from '../../../shared/middleware/auth';
import { verifyBookingToken } from '../controllers/booking.controller';

const router = Router();
const emailService = new EmailService();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  return new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
}

function hasBookingAccess(req: Request, bookingId: string, bookingToken?: string): boolean {
  if (req.adminEmail) {
    return true;
  }

  if (!bookingToken || bookingToken.length !== 32) {
    return false;
  }

  try {
    return verifyBookingToken(bookingId, bookingToken);
  } catch {
    return false;
  }
}

async function markStripePaymentCompleted(bookingId: string, intent: Stripe.PaymentIntent) {
  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId, orderId: intent.id, provider: 'STRIPE' },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: 'COMPLETED',
        completedAt: existingPayment.completedAt || new Date(),
        rawPayload: intent as unknown as object,
      },
    });
    return;
  }

  await prisma.payment.create({
    data: {
      bookingId,
      provider: 'STRIPE',
      status: 'COMPLETED',
      orderId: intent.id,
      amount: intent.amount,
      currency: (intent.currency || 'usd').toUpperCase(),
      completedAt: new Date(),
      rawPayload: intent as unknown as object,
    },
  });
}

router.post('/create-payment-intent', optionalAdminAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, bookingToken } = req.body;
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'bookingId is required' });
    }
    if (!hasBookingAccess(req, bookingId, typeof bookingToken === 'string' ? bookingToken : undefined)) {
      return res.status(403).json({ error: 'Invalid or missing booking token.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, payments: true },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'This booking is already paid and confirmed.' });
    }
    if (booking.totalAmount <= 0) {
      return res.status(400).json({ error: 'This booking does not have a payable balance.' });
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
      payment_method_types: ['card'],
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

router.post('/confirm-payment', optionalAdminAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentIntentId, bookingToken } = req.body;
    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({ error: 'bookingId and paymentIntentId are required' });
    }
    if (!hasBookingAccess(req, bookingId, typeof bookingToken === 'string' ? bookingToken : undefined)) {
      return res.status(403).json({ error: 'Invalid or missing booking token.' });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not completed. Status: ${intent.status}` });
    }

    if (intent.metadata?.bookingId && intent.metadata.bookingId !== bookingId) {
      return res.status(400).json({ error: 'Payment intent does not belong to this booking.' });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, items: true },
    });

    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await markStripePaymentCompleted(bookingId, intent);

    if (existingBooking.status === 'CONFIRMED') {
      return res.json({ success: true, data: { status: existingBooking.status, alreadyConfirmed: true } });
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: { customer: true, items: true },
    });

    await createAuditLog({
      action: 'PAYMENT',
      entityType: 'Booking',
      entityId: bookingId,
      userEmail: req.adminEmail,
      description: `Stripe payment confirmed for booking ${bookingId}`,
      changes: {
        status: { from: existingBooking.status, to: 'CONFIRMED' },
        paymentIntentId,
      },
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

        await markStripePaymentCompleted(bookingId, intent);

        await createAuditLog({
          action: 'PAYMENT',
          entityType: 'Booking',
          entityId: bookingId,
          description: `Stripe webhook confirmed booking ${bookingId}`,
          changes: {
            status: { from: existing.status, to: 'CONFIRMED' },
            paymentIntentId: intent.id,
          },
        });

        emailService.sendConfirmationEmails(booking, false).catch((error) => {
          console.error('[Stripe Webhook] Email error:', getErrorMessage(error, 'Unknown email error'));
        });

        console.log(`[Stripe Webhook] Booking ${bookingId} confirmed`);
      } else if (existing) {
        await markStripePaymentCompleted(bookingId, intent);
      }
    } catch (error) {
      console.error('[Stripe Webhook] DB error:', getErrorMessage(error, 'Unknown database error'));
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  res.json({ received: true });
});

export default router;
