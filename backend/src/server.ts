import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './shared/lib/prisma';
import { errorHandler } from './shared/middleware/errorHandler';
import bookingsRoutes from './features/booking/routes/bookings.routes';
import adminRoutes from './features/admin/routes/admin.routes';
import stripeRoutes from './features/booking/routes/stripe.routes';
import aiRoutes from './features/ai/routes/ai.routes';
import authRoutes from './features/auth/routes/auth.routes';
import pricingRoutes from './features/pricing/routes/pricing.routes';
import hotelsRoutes from './features/pricing/routes/hotels.routes';
import previewRoutes from './features/booking/routes/preview.routes';
import { EmailService } from './features/booking/services/email.service';
import { getErrorMessage, hasErrorCode } from './shared/lib/errors';

dotenv.config();

// Prevent unhandled promise rejections (e.g. Puppeteer cleanup errors) from crashing the server
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled promise rejection (non-fatal):', reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[Server] Uncaught exception:', err?.message || err);
  // Only exit for truly unrecoverable errors
  if (hasErrorCode(err) && err.code === 'EADDRINUSE') process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS with multiple allowed origins
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8899',
  'http://localhost:4173',
];

const allowedOrigins = [...new Set([...envOrigins, ...defaultDevOrigins])];

const hardcodedProductionOrigins = [
  'https://classviptransfers.com',
  'https://www.classviptransfers.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (hardcodedProductionOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
// Stripe webhook must receive raw body — register BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const bookingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many booking requests, please try again later.' }, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 9999,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests, please slow down.' }, standardHeaders: true, legacyHeaders: false });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/bookings', bookingLimiter, bookingsRoutes);
app.use('/api/admin/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (protected by auth middleware)
app.use('/api/stripe', stripeRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/hotels', hotelsRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/preview', previewRoutes);
}

// Error handling
app.use(errorHandler);

// Ensure admin user exists (from ADMIN_EMAIL + ADMIN_PASSWORD_HASH)
async function ensureAdminExists() {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) return;
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log('[Auth] Admin user exists:', email);
      return;
    }
    await prisma.adminUser.create({
      data: { email, passwordHash, role: 'admin' },
    });
    console.log('[Auth] Admin user created:', email);
  } catch (error) {
    console.warn('[Auth] Could not ensure admin:', getErrorMessage(error));
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/api`);

  await ensureAdminExists();

  // Send test email on startup to verify configuration (non-blocking, never crash)
  const emailService = new EmailService();
  if (emailService.isConfigured()) {
    const testTo = process.env.EMAIL_TEST_TO || process.env.COMPANY_BOOKINGS_EMAIL || process.env.GMAIL_USER;
    if (testTo) {
      emailService
        .sendStartupTest(testTo)
        .then((r) => {
          if (r.success) console.log('[Email] Startup test email sent to', testTo);
          else console.warn('[Email] Startup test failed:', r.error);
        })
        .catch((err) => console.warn('[Email] Startup test error (server unaffected):', err?.message || err));
    } else {
      console.warn('[Email] No EMAIL_TEST_TO / COMPANY_BOOKINGS_EMAIL / GMAIL_USER for startup test');
    }
  }
});

export default app;

