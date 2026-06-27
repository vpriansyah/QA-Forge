// ═══════════════════════════════════════════════════════════
// QA Forge — HTTP Server Entry Point
// Starts Express + Socket.IO + connects to all services
// ═══════════════════════════════════════════════════════════

import http from 'http';
import { app } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { ensureBuckets } from './config/minio';
import { initSocketIO } from './websocket';
import { initPipelineWorker } from './queue/pipeline.worker';

const server = http.createServer(app);

async function start(): Promise<void> {
  try {
    logger.info('🚀 Starting QA Forge Backend...');

    // Connect to database
    await connectDatabase();

    // Ensure S3 buckets exist
    await ensureBuckets();

    // Initialize Socket.IO for real-time updates
    initSocketIO(server);

    // Initialize BullMQ pipeline worker
    initPipelineWorker();

    // Start HTTP server
    server.listen(config.PORT, () => {
      logger.info(`✅ QA Forge Backend running on port ${config.PORT}`);
      logger.info(`   Environment: ${config.NODE_ENV}`);
      logger.info(`   API: http://localhost:${config.PORT}/api/v1`);
      logger.info(`   Health: http://localhost:${config.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.fatal({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await disconnectDatabase();
    logger.info('Server shut down successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

start();
