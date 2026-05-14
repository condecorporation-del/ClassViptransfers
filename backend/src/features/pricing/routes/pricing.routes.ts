import { Router } from 'express';
import { PricingController } from '../controllers/pricing.controller';
import { requireAdminAuth } from '../../../shared/middleware/auth';
import { asyncHandler } from '../../../shared/middleware/validation';

const router = Router();
const pricingController = new PricingController();

// Public endpoints - no auth required
router.get(
  '/rules',
  asyncHandler((req, res) => pricingController.getPublicRules(req, res))
);
router.get(
  '/zones',
  asyncHandler((req, res) => pricingController.getZones(req, res))
);
router.get(
  '/hotels',
  asyncHandler((req, res) => pricingController.getHotels(req, res))
);
router.get(
  '/extras',
  asyncHandler((req, res) => pricingController.getPublicExtras(req, res))
);
router.get(
  '/areas',
  asyncHandler((req, res) => pricingController.getPublicAreas(req, res))
);
router.post(
  '/quote',
  asyncHandler((req, res) => pricingController.getQuote(req, res))
);

export default router;

