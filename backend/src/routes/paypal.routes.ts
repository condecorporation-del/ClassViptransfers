import { Router } from 'express';
import { PayPalController } from '../controllers/paypal.controller';
import { asyncHandler } from '../middleware/validation';

const router = Router();
const paypalController = new PayPalController();

// POST /api/paypal/create-order - Create PayPal order
router.post(
  '/create-order',
  asyncHandler((req, res) => paypalController.createOrder(req, res))
);

// POST /api/paypal/capture-order - Capture PayPal payment
router.post(
  '/capture-order',
  asyncHandler((req, res) => paypalController.captureOrder(req, res))
);

// POST /api/paypal/webhook - PayPal webhook handler
// Note: This endpoint should NOT use JSON body parser for webhook signature verification
// PayPal sends webhook as raw body for signature verification
router.post(
  '/webhook',
  asyncHandler((req, res) => paypalController.webhook(req, res))
);

export default router;

