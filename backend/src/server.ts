import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Check Netlify preview pattern
    if (origin.includes('.netlify.app')) {
      callback(null, true);
      return;
    }
    
    // Log blocked origins in production
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[CORS] Blocked origin: ${origin}`);
    }
    
    // Allow anyway for development, but log
    callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin/auth', authRoutes); // Auth routes (no protection)
app.use('/api/admin', adminRoutes); // Admin routes (protected)
app.use('/api/paypal', paypalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pricing', pricingRoutes); // Pricing routes (public quote + admin routes)
app.use('/api/preview', previewRoutes); // Email preview (no auth, for design workflow)

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

