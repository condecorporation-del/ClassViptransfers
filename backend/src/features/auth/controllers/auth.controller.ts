import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../shared/lib/prisma';
import { createAuditLog } from '../../../shared/lib/audit';
import { z } from 'zod';
import { getErrorMessage } from '../../../shared/lib/errors';
import { getAdminCookieOptions } from '../../../shared/lib/admin-cookie';

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
      const raw = loginSchema.safeParse(req.body);
      if (!raw.success) {
        return res.status(400).json({
          success: false,
          error: raw.error.errors?.[0]?.message || 'Invalid request',
        });
      }
      const { email, password } = raw.data;

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

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
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

      res.cookie('admin_token', token, getAdminCookieOptions());

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

      res.clearCookie('admin_token', getAdminCookieOptions());

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
