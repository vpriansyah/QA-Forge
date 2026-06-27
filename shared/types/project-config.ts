// ═══════════════════════════════════════════════════════════
// QA Forge — Project Configuration Types
// ═══════════════════════════════════════════════════════════

import type { AppType } from '../constants/frameworks';
import type { Framework } from '../constants/frameworks';
import type { OutputCategory } from '../constants/output-categories';

/**
 * Project configuration — passed to every AI agent as shared context.
 * Defines the testing scope, selected frameworks, and desired outputs.
 */
export interface ProjectConfig {
  /** Unique project identifier */
  id: string;
  /** Human-readable project name */
  name: string;
  /** Application types being tested */
  app_types: AppType[];
  /** Selected testing frameworks */
  frameworks: Framework[];
  /** Enabled output categories */
  enabled_outputs: OutputCategory[];
  /** Additional project-level settings */
  settings: ProjectSettings;
  /** Project owner user ID */
  user_id: string;
  /** ISO timestamp */
  created_at: string;
  /** ISO timestamp */
  updated_at: string;
}

export interface ProjectSettings {
  /** Base URL of the application under test */
  base_url?: string;
  /** Default authentication method observed */
  auth_method?: 'bearer' | 'basic' | 'api_key' | 'oauth2' | 'none';
  /** Maximum test cases per session */
  max_test_cases?: number;
  /** Target domain for HAR filtering */
  target_domain?: string;
  /** Custom environment variable names */
  env_variables?: Record<string, string>;
}

export interface CreateProjectInput {
  name: string;
  app_types: AppType[];
  frameworks: Framework[];
  enabled_outputs: OutputCategory[];
  settings?: Partial<ProjectSettings>;
}

export interface UpdateProjectInput {
  name?: string;
  app_types?: AppType[];
  frameworks?: Framework[];
  enabled_outputs?: OutputCategory[];
  settings?: Partial<ProjectSettings>;
}
