// ═══════════════════════════════════════════════════════════
// QA Forge — WebSocket Event Types
// ═══════════════════════════════════════════════════════════

import type { AgentId, AgentStatus, PipelineStatus } from './pipeline-status';

/**
 * WebSocket event names (Socket.IO)
 */
export const WS_EVENTS = {
  // Client → Server
  JOIN_SESSION: 'session:join',
  LEAVE_SESSION: 'session:leave',

  // Server → Client
  PIPELINE_STARTED: 'pipeline:started',
  PIPELINE_PROGRESS: 'pipeline:progress',
  AGENT_STARTED: 'pipeline:agent:started',
  AGENT_COMPLETED: 'pipeline:agent:completed',
  AGENT_FAILED: 'pipeline:agent:failed',
  PIPELINE_COMPLETED: 'pipeline:completed',
  PIPELINE_FAILED: 'pipeline:failed',
  SANITIZATION_PREVIEW: 'pipeline:sanitization:preview',
  CLARIFICATION_NEEDED: 'pipeline:clarification:needed',
} as const;

/**
 * Pipeline progress event payload
 */
export interface PipelineProgressEvent {
  session_id: string;
  pipeline_id: string;
  status: PipelineStatus;
  progress: number;
  current_agent: AgentId | null;
  message: string;
}

/**
 * Agent status change event payload
 */
export interface AgentStatusEvent {
  session_id: string;
  agent_id: AgentId;
  agent_name: string;
  status: AgentStatus;
  duration_ms?: number;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

/**
 * Sanitization preview event (requires user confirmation)
 */
export interface SanitizationPreviewEvent {
  session_id: string;
  input_type: string;
  sanitization_log: string[];
  request_count?: number;
}

/**
 * Clarification needed event (requires user response)
 */
export interface ClarificationNeededEvent {
  session_id: string;
  question: string;
}
