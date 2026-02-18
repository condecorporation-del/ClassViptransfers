import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import bookingsRoutes from './routes/bookings.routes';
import adminRoutes from './routes/admin.routes';
import paypalRoutes from './routes/paypal.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';

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

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/api`);
});

export default app;

