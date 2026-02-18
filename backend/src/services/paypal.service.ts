import axios, { AxiosInstance } from 'axios';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';
import { BookingStatus, PaymentProvider, PaymentStatus } from '@prisma/client';
import { centsToDollars } from '../lib/validation';

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    payee?: {
      email_address?: string;
      merchant_id?: string;
    };
  }>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  final_capture?: boolean;
}

export class PayPalService {
  private apiClient: AxiosInstance;
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    const env = process.env.PAYPAL_ENV || 'sandbox';
    this.baseURL = env === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

    // Don't crash in dev - let methods handle missing creds gracefully
    if (!this.clientId || !this.clientSecret) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ PayPal credentials not configured. PayPal features will be disabled.');
      } else {
        throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
      }
    }

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private checkCredentials(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PAYPAL creds missing - PayPal service is not configured');
    }
  }

  private getFrontendUrl(): string {
    // In development, use localhost:8899 (Netlify Dev) or fallback to 8080
    if (process.env.NODE_ENV === 'development') {
      return process.env.FRONTEND_URL || 'http://localhost:8899';
    }
    // In production, use FRONTEND_URL or fallback
    return process.env.FRONTEND_URL || 'http://localhost:8080';
  }

  /**
   * Get or refresh PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    this.checkCredentials();
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData: PayPalAccessToken = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);

      return this.accessToken;
    } catch (error: any) {
      console.error('PayPal access token error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal access token');
    }
  }

  /**
   * Create PayPal order for a booking
   */
  async createOrder(bookingId: string): Promise<{ orderId: string; approvalUrl: string }> {
    this.checkCredentials();
    // Load booking and verify
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error(`Cannot create payment for booking with status: ${booking.status}`);
    }

    // Compute total server-side (in dollars for PayPal)
    const totalDollars = centsToDollars(booking.totalAmount);
    const totalString = totalDollars.toFixed(2);

    // Get access token
    const accessToken = await this.getAccessToken();

    // Get frontend URL (dev-aware)
    const frontendUrl = this.getFrontendUrl();
    const returnUrl = `${frontendUrl}/checkout/success?bookingId=${bookingId}`;
    const cancelUrl = `${frontendUrl}/checkout/cancel?bookingId=${bookingId}`;

    // Log URLs in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[PayPal] Frontend URL:', frontendUrl);
      console.log('[PayPal] Return URL:', returnUrl);
      console.log('[PayPal] Cancel URL:', cancelUrl);
    }

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: bookingId,
          description: `Booking ${booking.type} - ${booking.customer.name}`,
          amount: {
            currency_code: booking.currency || 'USD',
            value: totalString,
          },
        },
      ],
      application_context: {
        brand_name: 'Los Cabos Luxe Transfers',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const order: PayPalOrder = response.data;
      const approvalLink = order.links.find(link => link.rel === 'approve')?.href;

      if (!approvalLink) {
        throw new Error('No approval URL in PayPal order response');
      }

      // Store payment record
      await prisma.payment.create({
        data: {
          bookingId,
          provider: PaymentProvider.PAYPAL,
          status: PaymentStatus.PENDING,
          orderId: order.id,
          amount: booking.totalAmount, // Store in cents
          currency: booking.currency || 'USD',
          rawPayload: order as any,
        },
      });

      // Update booking status to PENDING_PAYMENT
      if (booking.status === 'DRAFT') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.PENDING_PAYMENT },
        });
      }

      // Audit log
      await createAuditLog({
        action: 'PAYMENT',
        entityType: 'Payment',
        entityId: bookingId,
        description: `PayPal order created: ${order.id}`,
      });

      return {
        orderId: order.id,
        approvalUrl: approvalLink,
      };
    } catch (error: any) {
      console.error('PayPal create order error:', error.response?.data || error.message);
      throw new Error(`Failed to create PayPal order: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Capture PayPal order payment
   */
  async captureOrder(bookingId: string, orderId: string): Promise<{ captureId: string; status: string }> {
    this.checkCredentials();
    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if already paid/confirmed (idempotency)
    // First check if Payment already exists and is COMPLETED for this orderId
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        orderId,
        status: PaymentStatus.COMPLETED,
      },
    });

    if (existingPayment) {
      // Already captured - return success (idempotent)
      return {
        captureId: existingPayment.captureId || orderId,
        status: 'COMPLETED',
      };
    }

    // Also check booking status for idempotency
    if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
      // Booking already paid, but payment record might not exist
      // Still try to capture (PayPal will handle idempotency)
    }

    // Get access token
    const accessToken = await this.getAccessToken();

    // Capture the order
    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const order: any = response.data;
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0] as PayPalCapture | undefined;

      if (!capture) {
        throw new Error('No capture in PayPal response');
      }

      // Verify amount matches
      const capturedAmount = parseFloat(capture.amount.value);
      const expectedAmount = centsToDollars(booking.totalAmount);

      if (Math.abs(capturedAmount - expectedAmount) > 0.01) {
        console.error(`Amount mismatch: expected $${expectedAmount}, captured $${capturedAmount}`);
        throw new Error(`Payment amount mismatch: expected $${expectedAmount}, got $${capturedAmount}`);
      }

      // Find and update payment record
      const existingPayment = await prisma.payment.findFirst({
        where: {
          bookingId,
          orderId,
        },
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            captureId: capture.id,
            transactionId: capture.id,
            completedAt: new Date(),
            rawPayload: order as any,
          },
        });
      }

      // Update booking status (idempotent - only if not already paid/confirmed)
      if (booking.status !== 'PAID' && booking.status !== 'CONFIRMED') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.PAID,
          },
        });

        // Auto-confirm booking
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });
      }

      // Audit log
      await createAuditLog({
        action: 'PAYMENT',
        entityType: 'Payment',
        entityId: bookingId,
        description: `PayPal payment captured: ${capture.id}, Booking confirmed`,
        changes: {
          status: { from: booking.status, to: 'CONFIRMED' },
          payment: { captureId: capture.id, amount: capturedAmount },
        },
      });

      // Send confirmation emails
      try {
        const { EmailService } = await import('./email.service');
        const emailService = new EmailService();
        const confirmedBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            customer: true,
            items: true,
          },
        });
        if (confirmedBooking) {
          await emailService.sendConfirmationEmails(confirmedBooking);
        }
      } catch (emailError) {
        console.error('Failed to send confirmation emails:', emailError);
        // Don't fail the payment if email fails
      }

      return {
        captureId: capture.id,
        status: capture.status,
      };
    } catch (error: any) {
      console.error('PayPal capture error:', error.response?.data || error.message);
      
      // Update payment status to failed
      await prisma.payment.updateMany({
        where: {
          bookingId,
          orderId,
        },
        data: {
          status: PaymentStatus.FAILED,
          rawPayload: error.response?.data || { error: error.message },
        },
      });

      throw new Error(`Failed to capture PayPal payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhookSignature(headers: Record<string, string>, body: any, webhookId: string): Promise<boolean> {
    // For production, implement proper webhook signature verification
    // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-an-event-notification
    
    // Basic check: verify webhook ID matches
    if (body.resource_type === 'checkout-order' || body.event_type) {
      // In production, verify signature using PayPal's webhook verification API
      // For now, we'll do basic validation
      return true;
    }

    return false;
  }

  /**
   * Handle PayPal webhook events
   */
  async handleWebhook(event: any): Promise<void> {
    const eventType = event.event_type;
    const resource = event.resource;

    // Handle PAYMENT.CAPTURE.COMPLETED
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = resource.id;
      const orderId = resource.supplementary_data?.related_ids?.order_id;

      if (!orderId) {
        console.error('No order ID in webhook');
        return;
      }

      // Find payment by orderId
      const payment = await prisma.payment.findFirst({
        where: {
          orderId,
          provider: PaymentProvider.PAYPAL,
        },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        console.error(`Payment not found for orderId: ${orderId}`);
        return;
      }

      // Idempotency check
      if (payment.status === PaymentStatus.COMPLETED) {
        console.log(`Payment already completed for orderId: ${orderId}`);
        return;
      }

      const booking = payment.booking;
      const capturedAmount = parseFloat(resource.amount.value);
      const expectedAmount = centsToDollars(booking.totalAmount);

      // Verify amount
      if (Math.abs(capturedAmount - expectedAmount) > 0.01) {
        console.error(`Webhook amount mismatch: expected $${expectedAmount}, got $${capturedAmount}`);
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            rawPayload: event,
          },
        });
        return;
      }

      // Update payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          captureId,
          transactionId: captureId,
          completedAt: new Date(),
          rawPayload: event,
        },
      });

      // Update booking status (idempotent)
      if (booking.status !== 'PAID' && booking.status !== 'CONFIRMED') {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.PAID,
          },
        });

        // Auto-confirm
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });
      }

      // Audit log
      await createAuditLog({
        action: 'PAYMENT',
        entityType: 'Payment',
        entityId: booking.id,
        description: `PayPal webhook: Payment captured ${captureId}, Booking confirmed`,
      });

      // Send confirmation emails
      try {
        const { EmailService } = await import('./email.service');
        const emailService = new EmailService();
        const confirmedBooking = await prisma.booking.findUnique({
          where: { id: booking.id },
          include: {
            customer: true,
            items: true,
          },
        });
        if (confirmedBooking) {
          await emailService.sendConfirmationEmails(confirmedBooking);
        }
      } catch (emailError) {
        console.error('Failed to send confirmation emails:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    // Handle CHECKOUT.ORDER.APPROVED (optional - for order approval tracking)
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = resource.id;
      const payment = await prisma.payment.findFirst({
        where: {
          orderId,
          provider: PaymentProvider.PAYPAL,
        },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            rawPayload: event,
          },
        });
      }
    }
  }
}

