// ═══════════════════════════════════════════════════════════
// QA Forge — Rate Limiting Middleware
// ═══════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // per window
const PIPELINE_MAX = 10; // pipeline runs per window

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `${ip}:${req.path.startsWith('/api/v1/pipeline') ? 'pipeline' : 'general'}`;
  const limit = req.path.startsWith('/api/v1/pipeline') ? PIPELINE_MAX : MAX_REQUESTS;

  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= limit) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    });
    return;
  }

  entry.count++;
  next();
}
