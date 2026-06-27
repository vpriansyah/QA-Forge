// ═══════════════════════════════════════════════════════════
// QA Forge — Auth Controller
// ═══════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { logger } from '../../config/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
        });
        return;
      }

      const password_hash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, password_hash, name },
        select: { id: true, email: true, name: true, role: true, created_at: true },
      });

      const tokens = generateTokens(user);

      logger.info({ userId: user.id }, 'User registered');
      res.status(201).json({ success: true, data: { user, tokens } });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Akun belum terdaftar' },
        });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Email atau password salah' },
        });
        return;
      }

      const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at, settings: user.settings };
      const tokens = generateTokens(safeUser);

      logger.info({ userId: user.id }, 'User logged in');
      res.json({ success: true, data: { user: safeUser, tokens } });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const payload = jwt.verify(refresh_token, config.JWT_SECRET) as { id: string; email: string; role: string };
      const tokens = generateTokens(payload);
      res.json({ success: true, data: { tokens } });
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Refresh token is invalid or expired' },
      });
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userReq = (req as any).user;
      if (!userReq) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userReq.id },
        select: { id: true, email: true, name: true, role: true, settings: true, created_at: true },
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userReq = (req as any).user;
      if (!userReq) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      const { settings } = req.body;

      const user = await prisma.user.update({
        where: { id: userReq.id },
        data: { settings },
        select: { id: true, email: true, name: true, role: true, settings: true, created_at: true },
      });

      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
}

function generateTokens(user: { id: string; email: string; role: string }) {
  const access_token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: 604800 } // 7 days in seconds
  );
  const refresh_token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: 2592000 } // 30 days in seconds
  );
  return { access_token, refresh_token, expires_in: 604800 };
}

