// ═══════════════════════════════════════════════════════════
// QA Forge — Pipeline Runner
// Sequential executor for the multi-agent AI pipeline
// ═══════════════════════════════════════════════════════════

import { logger } from '../config/logger';

export interface PipelineStep {
  agentId: string;
  agentName: string;
  execute: (context: PipelineContext) => Promise<unknown>;
}

export interface PipelineContext {
  sessionId: string;
  projectConfig: Record<string, unknown>;
  sanitizedInput: Record<string, unknown>;
  agentOutputs: Record<string, unknown>;
  onProgress?: (progress: PipelineProgress) => void;
}

export interface PipelineProgress {
  currentAgent: string;
  agentName: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  totalSteps: number;
  currentStep: number;
}

/**
 * Execute a sequence of agent steps, passing context between each.
 * Emits progress updates via the onProgress callback.
 */
export async function runPipeline(
  steps: PipelineStep[],
  context: PipelineContext
): Promise<PipelineContext> {
  const totalSteps = steps.length;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const progress = Math.round(((i + 1) / totalSteps) * 100);

    logger.info({ step: i + 1, totalSteps, agentId: step.agentId }, `Pipeline step ${i + 1}/${totalSteps}`);

    // Notify progress: running
    context.onProgress?.({
      currentAgent: step.agentId,
      agentName: step.agentName,
      status: 'running',
      progress: Math.round((i / totalSteps) * 100),
      totalSteps,
      currentStep: i + 1,
    });

    try {
      const result = await step.execute(context);
      context.agentOutputs[step.agentId] = result;

      // Notify progress: completed
      context.onProgress?.({
        currentAgent: step.agentId,
        agentName: step.agentName,
        status: 'completed',
        progress,
        totalSteps,
        currentStep: i + 1,
      });
    } catch (error) {
      logger.error({ agentId: step.agentId, error }, 'Pipeline step failed');

      // Notify progress: failed
      context.onProgress?.({
        currentAgent: step.agentId,
        agentName: step.agentName,
        status: 'failed',
        progress,
        totalSteps,
        currentStep: i + 1,
      });

      throw error;
    }
  }

  return context;
}
