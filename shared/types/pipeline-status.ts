// ═══════════════════════════════════════════════════════════
// QA Forge — Pipeline Status Types
// ═══════════════════════════════════════════════════════════

/**
 * Pipeline execution status lifecycle:
 * queued → running → completed | failed | cancelled
 */
export type PipelineStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Individual agent execution status
 */
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Agent identifiers matching the 7-agent pipeline
 */
export type AgentId =
  | 'input_sanitizer'
  | 'orchestrator'
  | 'bug_analyst'
  | 'test_case_writer'
  | 'test_reviewer'
  | 'scripter_playwright'
  | 'scripter_postman'
  | 'scripter_k6'
  | 'scripter_cypress'
  | 'scripter_locust'
  | 'scripter_appium'
  | 'data_generator'
  | 'cicd_scripter'
  | 'report_compiler';

/**
 * Pipeline execution state — tracks progress across all agents
 */
export interface PipelineState {
  /** Unique pipeline run ID */
  id: string;
  /** Associated session ID */
  session_id: string;
  /** Overall pipeline status */
  status: PipelineStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Currently executing agent */
  current_agent: AgentId | null;
  /** Status of each agent in the pipeline */
  agent_statuses: AgentExecutionStatus[];
  /** Error message if pipeline failed */
  error?: string;
  /** ISO timestamp — when pipeline started */
  started_at: string;
  /** ISO timestamp — when pipeline completed/failed */
  completed_at?: string;
}

/**
 * Execution status for a single agent step
 */
export interface AgentExecutionStatus {
  agent_id: AgentId;
  agent_name: string;
  status: AgentStatus;
  /** Duration in milliseconds */
  duration_ms?: number;
  /** Token usage for AI agents */
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  /** Error message if agent failed */
  error?: string;
  /** ISO timestamp */
  started_at?: string;
  /** ISO timestamp */
  completed_at?: string;
}

/**
 * Trigger types classified by the Orchestrator agent
 */
export type TriggerType =
  | 'new_feature'
  | 'bug'
  | 'regression'
  | 'api_test'
  | 'load_test'
  | 'mobile_test';

/**
 * Session status lifecycle:
 * draft → processing → completed | failed | cancelled
 */
export type SessionStatus = 'draft' | 'processing' | 'completed' | 'failed' | 'cancelled';
