import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

/**
 * Require admin authentication and role=admin
 * Checks for JWT token in cookie or Authorization header.
 * Only allows access if role === 'admin'.
 */
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Dev bypass
  if (process.env.ADMIN_AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
    req.adminEmail = process.env.ADMIN_EMAIL || 'dev@admin.com';
    req.adminRole = 'admin';
    return next();
  }

  if (process.env.ADMIN_AUTH_DISABLED === 'true' && process.env.NODE_ENV === 'production') {
    console.error('[Auth] ADMIN_AUTH_DISABLED is not allowed in production.');
  }

  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) {
    console.error('[Auth] ADMIN_JWT_SECRET not set');
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
    const decoded = jwt.verify(token, jwtSecret) as { email: string; role?: string };
    const role = decoded.role || 'admin';

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: decoded.email.toLowerCase().trim() },
      select: { email: true, role: true },
    });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin account no longer exists',
      });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    req.adminEmail = adminUser.email;
    req.adminRole = adminUser.role;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Optional auth: if valid token present, set req.adminEmail and req.adminRole. Never blocks.
 */
export const optionalAdminAuth = async (req: Request, _res: Response, next: NextFunction) => {
  if (process.env.ADMIN_AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
    req.adminEmail = process.env.ADMIN_EMAIL || 'dev@admin.com';
    req.adminRole = 'admin';
    return next();
  }
  if (process.env.ADMIN_AUTH_DISABLED === 'true' && process.env.NODE_ENV === 'production') {
    console.error('[Auth] ADMIN_AUTH_DISABLED is not allowed in production.');
  }
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) return next();
  let token = req.cookies?.admin_token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, jwtSecret) as { email: string; role?: string };
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: decoded.email.toLowerCase().trim() },
      select: { email: true, role: true },
    });

    if (adminUser?.role === 'admin') {
      req.adminEmail = adminUser.email;
      req.adminRole = adminUser.role;
    }
  } catch {
    // ignore invalid token
  }
  next();
};
