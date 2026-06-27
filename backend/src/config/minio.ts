// ═══════════════════════════════════════════════════════════
// QA Forge — MinIO / S3 Client Setup
// Object storage for uploaded files and generated artifacts
// ═══════════════════════════════════════════════════════════

import * as Minio from 'minio';
import { config } from './index';
import { logger } from './logger';

export const minioClient = new Minio.Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL as unknown as boolean,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

/**
 * Ensure required S3 buckets exist
 */
export async function ensureBuckets(): Promise<void> {
  const buckets = [
    config.MINIO_BUCKET_UPLOADS,
    config.MINIO_BUCKET_ARTIFACTS,
    config.MINIO_BUCKET_REPORTS,
  ];

  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        logger.info(`Created S3 bucket: ${bucket}`);
      }
    } catch (error) {
      logger.warn(`Could not verify bucket ${bucket}: ${error}`);
    }
  }

  logger.info('✅ MinIO storage ready');
}

export default minioClient;
