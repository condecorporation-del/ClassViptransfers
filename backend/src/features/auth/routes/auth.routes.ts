import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { optionalAdminAuth } from '../../../shared/middleware/auth';
import { validate, asyncHandler } from '../../../shared/middleware/validation';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limit login endpoint (disabled in dev so you can test freely)
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 9999,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => process.env.NODE_ENV !== 'production',
});

// POST /api/admin/auth/login
router.post(
  '/login',
  loginRateLimit,
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
    'body'
  ),
  asyncHandler((req, res) => authController.login(req, res))
);

// POST /api/admin/auth/logout
router.post(
  '/logout',
  asyncHandler((req, res) => authController.logout(req, res))
);

// GET /api/admin/auth/me - optional auth to check if logged in
router.get(
  '/me',
  optionalAdminAuth,
  asyncHandler((req, res) => authController.me(req, res))
);

export default router;

