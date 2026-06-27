// ═══════════════════════════════════════════════════════════
// QA Forge — BullMQ Pipeline Worker
// Processes AI pipeline jobs asynchronously
// ═══════════════════════════════════════════════════════════

import { Worker, Queue } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export const PIPELINE_QUEUE_NAME = 'qaforge-pipeline';

export const pipelineQueue = new Queue(PIPELINE_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

let worker: Worker | null = null;

/**
 * Initialize the pipeline worker that processes AI agent jobs
 */
export function initPipelineWorker(): void {
  worker = new Worker(
    PIPELINE_QUEUE_NAME,
    async (job) => {
      const { sessionId, projectConfig, sanitizedInput, inputType } = job.data;

      logger.info({ jobId: job.id, sessionId }, 'Pipeline job started');

      try {
        // TODO: Implement full pipeline execution
        // 1. Run Input Sanitizer (if not already done)
        // 2. Run Orchestrator → get routing plan
        // 3. Run Bug Analyst (if bug trigger)
        // 4. Run Test Case Writer
        // 5. Run Test Reviewer
        // 6. Run Scripter Agents (per selected framework)
        // 7. Run Report Compiler
        // 8. Save artifacts to MinIO
        // 9. Update session status in database

        await job.updateProgress(100);
        logger.info({ jobId: job.id, sessionId }, 'Pipeline job completed');

        return { status: 'completed', sessionId };
      } catch (error) {
        logger.error({ jobId: job.id, sessionId, error }, 'Pipeline job failed');
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 2, // Max 2 concurrent pipeline runs
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job?.id }, 'Pipeline worker: job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Pipeline worker: job failed');
  });

  logger.info('✅ Pipeline worker initialized');
}

/**
 * Add a new pipeline job to the queue
 */
export async function enqueuePipelineJob(data: {
  sessionId: string;
  projectConfig: Record<string, unknown>;
  sanitizedInput: Record<string, unknown>;
  inputType: string;
}): Promise<string> {
  const job = await pipelineQueue.add('run-pipeline', data, {
    jobId: `pipeline-${data.sessionId}-${Date.now()}`,
  });
  logger.info({ jobId: job.id, sessionId: data.sessionId }, 'Pipeline job enqueued');
  return job.id!;
}

export { worker as pipelineWorker };
