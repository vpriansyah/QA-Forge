// ═══════════════════════════════════════════════════════════
// QA Forge — Prisma Database Client (Singleton)
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      config.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to database with retry logic
 */
export async function connectDatabase(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await prisma.$connect();
      logger.info('✅ Database connected successfully');
      return;
    } catch (error) {
      retries++;
      logger.warn(`Database connection attempt ${retries}/${maxRetries} failed`);
      if (retries >= maxRetries) {
        logger.error('❌ Failed to connect to database after max retries. Running in degraded mode.');
        return; // Do not throw error, allow server to start
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
    }
  }
}

/**
 * Disconnect from database gracefully
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
