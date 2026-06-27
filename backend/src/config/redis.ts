// ═══════════════════════════════════════════════════════════
// QA Forge — Redis Client Setup
// Used for BullMQ job queue and caching
// ═══════════════════════════════════════════════════════════

import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 500, 5000);
    logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error({ err }, '❌ Redis connection error');
});

export default redis;
