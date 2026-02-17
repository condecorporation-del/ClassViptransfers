import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createAuditLog } from '../lib/audit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  /**
   * POST /api/admin/auth/login
   * Admin login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Get admin credentials from env
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const jwtSecret = process.env.ADMIN_JWT_SECRET;

      if (!adminEmail || !adminPasswordHash || !jwtSecret) {
        return res.status(500).json({
          success: false,
          error: 'Admin authentication not configured',
        });
      }

      // Verify email
      if (email !== adminEmail) {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Auth',
          entityId: 'login',
          description: `Failed login attempt: Invalid email (${email})`,
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
      if (!passwordMatch) {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Auth',
          entityId: 'login',
          description: `Failed login attempt: Invalid password for ${email}`,
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { email: adminEmail },
        jwtSecret,
        { expiresIn: '7d' } // 7 days
      );

      // Set httpOnly cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // Allow cross-site in production if needed
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      // Audit log
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Auth',
        entityId: 'login',
        userEmail: adminEmail,
        description: `Admin login successful: ${adminEmail}`,
      });

      res.json({
        success: true,
        data: {
          authenticated: true,
          email: adminEmail,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  /**
   * POST /api/admin/auth/logout
   * Admin logout
   */
  async logout(req: Request, res: Response) {
    try {
      const adminEmail = (req as any).adminEmail;

      // Clear cookie
      res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      // Audit log
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
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * GET /api/admin/auth/me
   * Get current admin user
   */
  async me(req: Request, res: Response) {
    try {
      const adminEmail = (req as any).adminEmail;

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
        },
      });
    } catch (error: any) {
      console.error('Me error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }
}

