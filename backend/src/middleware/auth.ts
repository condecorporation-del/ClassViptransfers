import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  adminEmail?: string;
}

/**
 * Require admin authentication
 * Checks for JWT token in cookie or Authorization header
 */
export const requireAdminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Dev bypass
  if (process.env.ADMIN_AUTH_DISABLED === 'true') {
    req.adminEmail = process.env.ADMIN_EMAIL || 'dev@admin.com';
    return next();
  }

  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) {
    console.error('ADMIN_JWT_SECRET not set');
    return res.status(500).json({
      success: false,
      error: 'Authentication not configured',
    });
  }

  // Try cookie first
  let token = req.cookies?.admin_token;

  // Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { email: string };
    req.adminEmail = decoded.email;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

