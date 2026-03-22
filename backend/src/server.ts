import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import bookingsRoutes from './routes/bookings.routes';
import adminRoutes from './routes/admin.routes';
import paypalRoutes from './routes/paypal.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import pricingRoutes from './routes/pricing.routes';
import previewRoutes from './routes/preview.routes';
import { EmailService } from './services/email.service';

dotenv.config();

// Prevent unhandled promise rejections (e.g. Puppeteer cleanup errors) from crashing the server
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] Unhandled promise rejection (non-fatal):', reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[Server] Uncaught exception:', err?.message || err);
  // Only exit for truly unrecoverable errors
  if ((err as any)?.code === 'EADDRINUSE') process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS with multiple allowed origins
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8899', // Netlify Dev
  'https://classvip.netlify.app',
  'https://*.netlify.app', // Allow all Netlify previews
];

// Log allowed origins in production
if (process.env.NODE_ENV === 'production') {
  console.log('[Server] Allowed CORS origins:', allowedOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    if (origin.includes('.netlify.app')) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }

    callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const bookingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many booking requests, please try again later.' }, standardHeaders: true, legacyHeaders: false });
const paypalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many payment requests, please try again later.' }, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later.' }, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests, please slow down.' }, standardHeaders: true, legacyHeaders: false });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/bookings', bookingLimiter, bookingsRoutes);
app.use('/api/admin/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes); // Admin routes (protected by auth middleware)
app.use('/api/paypal', paypalLimiter, paypalRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/pricing', pricingRoutes);
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
  } catch (e: any) {
    console.warn('[Auth] Could not ensure admin:', e?.message || e);
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

