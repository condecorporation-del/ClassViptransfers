import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limit login endpoint
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
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

// GET /api/admin/auth/me
router.get(
  '/me',
  asyncHandler((req, res) => authController.me(req, res))
);

export default router;

