// ═══════════════════════════════════════════════════════════
// QA Forge — Global Error Handler Middleware
// ═══════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err }, 'Unhandled error');

  // Multer file size error
  if (err.message?.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum size of 50MB' },
    });
    return;
  }

  // Multer file type error
  if (err.message?.includes('File type not allowed')) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: err.message },
    });
    return;
  }

  // JSON parse error
  if (err.message?.includes('JSON')) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Request body contains invalid JSON' },
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal server error occurred'
        : err.message,
    },
  });
}
