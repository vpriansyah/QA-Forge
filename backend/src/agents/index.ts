// ═══════════════════════════════════════════════════════════
// QA Forge — Agent Registry & Factory
// Maps agent IDs to their implementations
// ═══════════════════════════════════════════════════════════

export { BaseAgent } from './base-agent';
export { runPipeline } from './pipeline-runner';
export type { PipelineContext, PipelineStep, PipelineProgress } from './pipeline-runner';

/**
 * Agent directory — each agent folder contains:
 * - index.ts     → Agent class extending BaseAgent
 * - prompt.ts    → System prompt (copy-paste from spec)
 * - schema.ts    → Zod output schema
 * - types.ts     → Input/output type definitions
 *
 * Agents:
 * - agent-01-sanitizer    → Input Sanitizer (code function, NOT AI)
 * - agent-02-orchestrator → Orchestrator (routing, temp: 0)
 * - agent-03-writer       → Test Case Writer (content, temp: 0.2)
 * - agent-04-reviewer     → Test Reviewer (validation, temp: 0)
 * - agent-05a-playwright  → Playwright Scripter (temp: 0.1)
 * - agent-05b-postman     → Postman Scripter (temp: 0)
 * - agent-05c-k6          → k6 Scripter (temp: 0.1)
 * - agent-05d-cypress     → Cypress Scripter (temp: 0.1)
 * - agent-06-bug-analyst  → Bug Analyst (temp: 0.1)
 * - agent-07-compiler     → Report Compiler (temp: 0)
 */

// Agent implementations will be imported here as they are built
// Example:
// export { InputSanitizer } from './agent-01-sanitizer';
// export { OrchestratorAgent } from './agent-02-orchestrator';
// export { TestCaseWriterAgent } from './agent-03-writer';
// etc.
