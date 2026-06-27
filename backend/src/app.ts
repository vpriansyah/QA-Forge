// ═══════════════════════════════════════════════════════════
// QA Forge — Express Application Setup
// ═══════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './config/logger';
import { apiRouter } from './api/routes';
import { errorMiddleware } from './api/middlewares/error.middleware';
import { rateLimitMiddleware } from './api/middlewares/rateLimit.middleware';
import { setupSwagger } from './config/swagger';
import { ai, AI_MODEL } from './config/gemini';

const app = express();

// ─── Security ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,           // Disable CSP — server runs on HTTP, no upgrade-insecure-requests needed
    hsts: false,                            // Disable HSTS — server has no SSL, this would force HTTPS
    crossOriginOpenerPolicy: false,         // Not useful on non-HTTPS origins
    crossOriginEmbedderPolicy: false,       // Blocks resource loading on HTTP
    originAgentCluster: false,              // Prevents agent cluster warning on HTTP
  })
);
app.use(
  cors({
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ───────────────────────────────────────
app.use(rateLimitMiddleware);

// ─── Request Logging ─────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// ─── Health Check ────────────────────────────────────────
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Returns the health status of the backend service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     version:
 *                       type: string
 */
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'qaforge-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/api/v1/health/gemini', async (_req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: 'Hello, are you online?',
    });
    res.json({
      success: true,
      data: {
        status: 'connected',
        model: AI_MODEL,
        response: response.text,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Gemini Health Check Failed');
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to connect to Gemini API',
        details: error.stack || error,
      },
    });
  }
});

// ─── API Routes ──────────────────────────────────────────
setupSwagger(app);
app.use('/api/v1', apiRouter);

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── Global Error Handler ────────────────────────────────
app.use(errorMiddleware);

export { app };
export default app;
