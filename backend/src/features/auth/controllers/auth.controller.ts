import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../shared/lib/prisma';
import { createAuditLog } from '../../../shared/lib/audit';
import { z } from 'zod';
import { getErrorMessage } from '../../../shared/lib/errors';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  /**
   * POST /api/admin/auth/login
   * Admin login - find user in DB, compare password, issue JWT
   */
  async login(req: Request, res: Response) {
    try {
      console.log('[Auth] Login attempt - body keys:', req.body ? Object.keys(req.body) : 'none');
      const raw = loginSchema.safeParse(req.body);
      if (!raw.success) {
        console.log('[Auth] Validation failed:', raw.error.flatten());
        return res.status(400).json({
          success: false,
          error: raw.error.errors?.[0]?.message || 'Invalid request',
        });
      }
      const { email, password } = raw.data;
      console.log('[Auth] Looking up user by email:', email);

      const jwtSecret = process.env.ADMIN_JWT_SECRET;
      if (!jwtSecret) {
        console.error('[Auth] ADMIN_JWT_SECRET not set');
        return res.status(500).json({
          success: false,
          error: 'Admin authentication not configured',
        });
      }

      const user = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        console.log('[Auth] User not found:', email);
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Auth',
          entityId: 'login',
          description: `Failed login: user not found (${email})`,
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      console.log('[Auth] User found:', user.email, '| role:', user.role);

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      console.log('[Auth] Password comparison result:', passwordMatch ? 'match' : 'no match');

      if (!passwordMatch) {
        console.log('[Auth] Invalid password for:', email);
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Auth',
          entityId: 'login',
          description: `Failed login: invalid password for ${email}`,
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      if (user.role !== 'admin') {
        console.log('[Auth] User has insufficient role:', user.role);
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Auth',
          entityId: 'login',
          description: `Failed login: insufficient role for ${email} (${user.role})`,
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      const token = jwt.sign(
        { email: user.email, role: user.role, userId: user.id },
        jwtSecret,
        { expiresIn: '7d' }
      );
      console.log('[Auth] Token created, expires 7d');

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      console.log('[Auth] Login success:', user.email, '| role:', user.role);

      await createAuditLog({
        action: 'CREATE',
        entityType: 'Auth',
        entityId: 'login',
        userId: user.id,
        userEmail: user.email,
        description: `Admin login successful: ${user.email}`,
      });

      res.json({
        success: true,
        token,
        data: {
          authenticated: true,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[Auth] Login error:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, 'Login failed'),
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const adminEmail = req.adminEmail;

      res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      if (adminEmail) {
        await createAuditLog({
          action: 'DELETE',
          entityType: 'Auth',
          entityId: 'logout',
          userEmail: adminEmail,
          description: `Admin logout: ${adminEmail}`,
        });
      }

      res.json({
        success: true,
        data: { authenticated: false },
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const adminEmail = req.adminEmail;
      const adminRole = req.adminRole;

      if (!adminEmail) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      res.json({
        success: true,
        data: {
          authenticated: true,
          email: adminEmail,
          role: adminRole || 'admin',
        },
      });
    } catch (error) {
      console.error('[Auth] Me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }
}
