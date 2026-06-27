// ═══════════════════════════════════════════════════════════
// QA Forge — Base Agent Abstract Class
// All AI agents extend this class
// ═══════════════════════════════════════════════════════════

import { callAgent } from '../config/gemini';
import { logger } from '../config/logger';

export interface AgentResult<T> {
  data: T;
  usage: { input_tokens: number; output_tokens: number };
  duration_ms: number;
}

export abstract class BaseAgent<TInput, TOutput> {
  abstract readonly agentId: string;
  abstract readonly agentName: string;
  abstract readonly temperature: number;
  abstract readonly maxTokens: number;

  /** Return the system prompt for this agent */
  abstract getSystemPrompt(): string;

  /** Build the user message from input data */
  abstract buildUserMessage(input: TInput): string;

  /** Validate the output matches expected schema */
  abstract validateOutput(output: unknown): TOutput;

  /**
   * Execute the agent: call Anthropic API with system prompt + user message
   */
  async execute(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();

    logger.info({ agentId: this.agentId }, `🤖 Agent ${this.agentName} starting...`);

    const systemPrompt = this.getSystemPrompt();
    const userMessage = this.buildUserMessage(input);

    try {
      const { data, usage } = await callAgent<TOutput>({
        systemPrompt,
        userMessage,
        maxTokens: this.maxTokens,
        temperature: this.temperature,
      });

      const validated = this.validateOutput(data);
      const duration_ms = Date.now() - startTime;

      logger.info(
        { agentId: this.agentId, duration_ms, usage },
        `✅ Agent ${this.agentName} completed`
      );

      return { data: validated, usage, duration_ms };
    } catch (error) {
      const duration_ms = Date.now() - startTime;
      logger.error(
        { agentId: this.agentId, duration_ms, error },
        `❌ Agent ${this.agentName} failed`
      );

      // Retry once on failure
      logger.info({ agentId: this.agentId }, 'Retrying agent call...');
      try {
        const { data, usage } = await callAgent<TOutput>({
          systemPrompt,
          userMessage,
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        });

        const validated = this.validateOutput(data);
        const retryDuration = Date.now() - startTime;

        logger.info({ agentId: this.agentId }, `✅ Agent ${this.agentName} succeeded on retry`);
        return { data: validated, usage, duration_ms: retryDuration };
      } catch (retryError) {
        logger.error({ agentId: this.agentId, retryError }, `❌ Agent ${this.agentName} failed on retry`);
        throw retryError;
      }
    }
  }
}
