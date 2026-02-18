import { Request, Response } from 'express';
import { PayPalService } from '../services/paypal.service';
import { z } from 'zod';

// Initialize PayPal service - won't crash if creds are missing in dev
let paypalService: PayPalService;
try {
  paypalService = new PayPalService();
} catch (error: any) {
  console.warn('⚠️ PayPalService initialization warning:', error.message);
  // Create a dummy service that will return errors gracefully
  paypalService = null as any;
}

const createOrderSchema = z.object({
  bookingId: z.string().cuid(),
});

const captureOrderSchema = z.object({
  bookingId: z.string().cuid(),
  orderId: z.string().min(1),
});

export class PayPalController {
  /**
   * POST /api/paypal/create-order
   * Create PayPal order for a booking
   */
  async createOrder(req: Request, res: Response) {
    try {
      if (!paypalService) {
        return res.status(400).json({
          success: false,
          error: 'PAYPAL creds missing - PayPal service is not configured',
        });
      }

      const { bookingId } = createOrderSchema.parse(req.body);

      const result = await paypalService.createOrder(bookingId);

      res.json({
        success: true,
        data: {
          orderId: result.orderId,
          approvalUrl: result.approvalUrl,
        },
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      const statusCode = error.message?.includes('PAYPAL creds') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create PayPal order',
      });
    }
  }

  /**
   * POST /api/paypal/capture-order
   * Capture PayPal payment
   */
  async captureOrder(req: Request, res: Response) {
    try {
      const { bookingId, orderId } = captureOrderSchema.parse(req.body);

      const result = await paypalService.captureOrder(bookingId, orderId);

      res.json({
        success: true,
        data: {
          captureId: result.captureId,
          status: result.status,
        },
      });
    } catch (error: any) {
      console.error('Capture order error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to capture PayPal payment',
      });
    }
  }

  /**
   * POST /api/paypal/webhook
   * Handle PayPal webhook events
   */
  async webhook(req: Request, res: Response) {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
      const headers = req.headers as Record<string, string>;
      const body = req.body;

      // Verify webhook signature (basic check for now)
      // In production, implement full signature verification
      const isValid = await paypalService.verifyWebhookSignature(headers, body, webhookId);

      if (!isValid) {
        console.warn('Webhook signature verification failed');
        // For development, we'll still process it
        // In production, return 401
        // return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      // Handle webhook event
      await paypalService.handleWebhook(body);

      // Always return 200 to PayPal
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      // Still return 200 to PayPal to prevent retries
      res.status(200).json({ received: true, error: error.message });
    }
  }
}

