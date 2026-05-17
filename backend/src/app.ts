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
import { getErrorMessage } from './shared/lib/errors';

dotenv.config();

function parseOrigins(value?: string): string[] {
  return value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

const envOrigins = parseOrigins(process.env.ALLOWED_ORIGINS).map(normalizeOrigin);
const frontendUrlOrigin = process.env.FRONTEND_URL ? [normalizeOrigin(process.env.FRONTEND_URL)] : [];
const previewOrigins = parseOrigins(process.env.FRONTEND_PREVIEW_URLS).map(normalizeOrigin);
const allowVercelPreviewOrigins = process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === 'true';

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8899',
  'http://localhost:4173',
];

const allowedOrigins = [...new Set([...envOrigins, ...frontendUrlOrigin, ...defaultDevOrigins].map(normalizeOrigin))];

const hardcodedProductionOrigins = [
  'https://classviptransfers.com',
  'https://www.classviptransfers.com',
].map(normalizeOrigin);

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many booking requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 9999,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    if (hardcodedProductionOrigins.includes(normalizedOrigin)) return callback(null, true);
    if (previewOrigins.includes(normalizedOrigin)) return callback(null, true);
    if (allowVercelPreviewOrigins && normalizedOrigin.endsWith('.vercel.app')) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    console.warn(`[CORS] Blocked origin: ${normalizedOrigin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/bookings', bookingLimiter, bookingsRoutes);
app.use('/api/admin/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/hotels', hotelsRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/preview', previewRoutes);
}

app.use(errorHandler);

export async function ensureAdminExists() {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || !passwordHash) {
    return;
  }

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

export default app;
