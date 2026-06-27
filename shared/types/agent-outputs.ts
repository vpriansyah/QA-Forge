// ═══════════════════════════════════════════════════════════
// QA Forge — Agent Output Types (All 7 Agents)
// ═══════════════════════════════════════════════════════════

import type { TriggerType, AgentId } from './pipeline-status';

// ─── AGENT 01: Input Sanitizer Output ────────────────────
export interface SanitizerOutput {
  input_type: InputTypeId;
  sanitized_input: Record<string, unknown>;
  sanitization_log: string[];
  request_count?: number;
  confirmed: boolean;
}

export type InputTypeId =
  | 'har' | 'curl' | 'postman' | 'swagger'
  | 'text' | 'screenshot' | 'jira' | 'xml'
  | 'log' | 'figma';

// ─── AGENT 02: Orchestrator Output ───────────────────────
export interface OrchestratorOutput {
  trigger_type: TriggerType;
  input_summary: string;
  agents_to_call: AgentId[];
  context_for_agents: OrchestratorContext;
  clarification_needed: boolean;
  clarification_question: string | null;
}

export interface OrchestratorContext {
  feature_name: string;
  endpoints?: EndpointInfo[];
  auth_observed?: boolean;
  user_roles?: string[];
  app_type: string;
  [key: string]: unknown;
}

export interface EndpointInfo {
  method: string;
  path: string;
  status: number;
}

// ─── AGENT 03: Test Case Writer Output ───────────────────
export interface TestCaseWriterOutput {
  feature_name: string;
  test_cases: GeneratedTestCase[];
  scenario_count: ScenarioCount;
  coverage_areas: string[];
  assumptions: string[];
}

export interface GeneratedTestCase {
  id: string;
  title: string;
  type: 'happy_path' | 'edge_case' | 'negative';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  preconditions: string[];
  steps: string[];
  expected_result: string;
  test_data: Record<string, string>;
}

export interface ScenarioCount {
  happy_path: number;
  edge_case: number;
  negative: number;
  total: number;
}

// ─── AGENT 04: Test Reviewer Output ─────────────────────
export interface TestReviewerOutput {
  coverage_score: number;
  coverage_breakdown: CoverageBreakdown;
  gaps: string[];
  quality_issues: QualityIssue[];
  duplicates: [string, string][];
  approved_ids: string[];
  review_summary: string;
}

export interface CoverageBreakdown {
  happy_path: number;
  edge_case: number;
  negative: number;
  security: number;
}

export interface QualityIssue {
  tc_id: string;
  code: QualityIssueCode;
  description: string;
}

export type QualityIssueCode =
  | 'VAGUE_STEP'
  | 'MISSING_PRECONDITION'
  | 'UNMEASURABLE_RESULT'
  | 'MISSING_TEST_DATA'
  | 'SCOPE_CREEP'
  | 'DEPENDENCY';

// ─── AGENT 05A: Playwright Scripter Output ──────────────
export interface PlaywrightScripterOutput {
  spec_file: GeneratedFile;
  pom_files: GeneratedFile[];
  env_variables_needed: string[];
}

export interface GeneratedFile {
  filename: string;
  content: string;
}

// ─── AGENT 05B: Postman Scripter Output ─────────────────
export interface PostmanScripterOutput {
  collection_json: string;
  environment_json: string;
  newman_command: string;
}

// ─── AGENT 06: Bug Analyst Output ───────────────────────
export interface BugAnalystOutput {
  bug_report: BugReport;
  root_cause: RootCauseAnalysis;
  affected_components: string[];
  regression_scope: string[];
}

export interface BugReport {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  severity_justification: string;
  environment: string;
  steps_to_reproduce: string[];
  expected_behavior: string;
  actual_behavior: string;
  error_details: string;
}

export interface RootCauseAnalysis {
  why_1: string;
  why_2: string;
  why_3: string;
  why_4: string;
  root_hypothesis: string;
  confidence: 'high' | 'medium' | 'low';
}

// ─── AGENT 07: Report Compiler Output ───────────────────
export interface ReportCompilerOutput {
  session_id: string;
  session_summary: string;
  test_cases: TestCaseWriterOutput;
  coverage: TestReviewerOutput;
  scripts: ScriptSummary[];
  bug_report: BugAnalystOutput | null;
  action_items: ActionItem[];
  download_artifacts: DownloadArtifact[];
}

export interface ScriptSummary {
  framework: string;
  filename: string;
  line_count: number;
  artifact_id: string;
}

export interface ActionItem {
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  assigned_to: 'QA Engineer' | 'Dev Team' | 'QA Lead';
}

export interface DownloadArtifact {
  artifact_id: string;
  filename: string;
  content: string;
}

// ─── Aggregate Session Outputs ──────────────────────────
export interface SessionAgentOutputs {
  sanitizer?: SanitizerOutput;
  orchestrator?: OrchestratorOutput;
  bug_analyst?: BugAnalystOutput;
  test_case_writer?: TestCaseWriterOutput;
  test_reviewer?: TestReviewerOutput;
  scripter_playwright?: PlaywrightScripterOutput;
  scripter_postman?: PostmanScripterOutput;
  report_compiler?: ReportCompilerOutput;
}
