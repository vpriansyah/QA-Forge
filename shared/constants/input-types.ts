// ═══════════════════════════════════════════════════════════
// QA Forge — 10 Supported Input Types
// ═══════════════════════════════════════════════════════════

import type { AppType } from './frameworks';

export type InputType =
  | 'free_text'
  | 'curl'
  | 'har'
  | 'postman'
  | 'swagger'
  | 'screenshot'
  | 'jira'
  | 'log'
  | 'figma'
  | 'mobile_xml';

export type InputFamily = 'network_capture' | 'api_specification' | 'visual_ui' | 'contextual_text';

export interface InputTypeInfo {
  id: InputType;
  name: string;
  family: InputFamily;
  accepted_formats: string[];
  app_types: AppType[];
  mvp_phase: number;
  description: string;
  icon: string;
  requires_parser: boolean;
  has_credential_risk: boolean;
}

/**
 * Complete input type registry — ordered by MVP phase priority.
 */
export const INPUT_TYPES: Record<InputType, InputTypeInfo> = {
  // ─── Phase 1 (Weeks 1-2): No parser required ─────────
  free_text: {
    id: 'free_text',
    name: 'Free-Text Description',
    family: 'contextual_text',
    accepted_formats: ['text'],
    app_types: ['web', 'api', 'mobile', 'desktop'],
    mvp_phase: 1,
    description: 'Feature description, user story, or bug report in natural language',
    icon: '📝',
    requires_parser: false,
    has_credential_risk: false,
  },
  curl: {
    id: 'curl',
    name: 'cURL Command',
    family: 'api_specification',
    accepted_formats: ['text'],
    app_types: ['api'],
    mvp_phase: 1,
    description: 'Single cURL command for API endpoint testing',
    icon: '🔗',
    requires_parser: true,
    has_credential_risk: true,
  },

  // ─── Phase 2 (Weeks 3-4): Parser layer ────────────────
  har: {
    id: 'har',
    name: 'HAR File',
    family: 'network_capture',
    accepted_formats: ['.har'],
    app_types: ['web', 'api'],
    mvp_phase: 2,
    description: 'HTTP Archive from browser DevTools — real API traffic',
    icon: '📦',
    requires_parser: true,
    has_credential_risk: true,
  },
  postman: {
    id: 'postman',
    name: 'Postman Collection',
    family: 'api_specification',
    accepted_formats: ['.json'],
    app_types: ['api'],
    mvp_phase: 2,
    description: 'Postman Collection v2.1 with requests and tests',
    icon: '📮',
    requires_parser: true,
    has_credential_risk: true,
  },
  swagger: {
    id: 'swagger',
    name: 'Swagger / OpenAPI',
    family: 'api_specification',
    accepted_formats: ['.yaml', '.yml', '.json'],
    app_types: ['api'],
    mvp_phase: 2,
    description: 'OpenAPI 2.0/3.0/3.1 specification',
    icon: '📋',
    requires_parser: true,
    has_credential_risk: false,
  },

  // ─── Phase 3 (Weeks 5-6): Advanced parsers ────────────
  screenshot: {
    id: 'screenshot',
    name: 'Screenshot / Video',
    family: 'visual_ui',
    accepted_formats: ['.png', '.jpg', '.webp', '.mp4', '.mov'],
    app_types: ['web', 'mobile'],
    mvp_phase: 3,
    description: 'UI screenshot or screen recording for visual analysis',
    icon: '📸',
    requires_parser: false,
    has_credential_risk: false,
  },
  jira: {
    id: 'jira',
    name: 'Jira / Linear Ticket',
    family: 'contextual_text',
    accepted_formats: ['url', 'text'],
    app_types: ['web', 'api', 'mobile', 'desktop'],
    mvp_phase: 3,
    description: 'Ticket with acceptance criteria and requirements',
    icon: '🎫',
    requires_parser: true,
    has_credential_risk: false,
  },
  log: {
    id: 'log',
    name: 'Log File / Error Log',
    family: 'contextual_text',
    accepted_formats: ['.log', '.txt'],
    app_types: ['web', 'api', 'mobile', 'desktop'],
    mvp_phase: 3,
    description: 'Application log, stack trace, or crash report',
    icon: '📄',
    requires_parser: true,
    has_credential_risk: true,
  },

  // ─── Phase 4 (Week 7): External integrations ──────────
  figma: {
    id: 'figma',
    name: 'Figma Design File',
    family: 'visual_ui',
    accepted_formats: ['url', '.json'],
    app_types: ['web', 'mobile'],
    mvp_phase: 4,
    description: 'Figma design file for design-to-test workflow',
    icon: '🎨',
    requires_parser: true,
    has_credential_risk: false,
  },
  mobile_xml: {
    id: 'mobile_xml',
    name: 'Mobile UI XML Dump',
    family: 'visual_ui',
    accepted_formats: ['.xml'],
    app_types: ['mobile'],
    mvp_phase: 4,
    description: 'UIAutomator2 / XCUITest page source XML',
    icon: '📱',
    requires_parser: true,
    has_credential_risk: false,
  },
} as const;

/**
 * Get input types available for a specific MVP phase
 */
export function getInputTypesForPhase(phase: number): InputTypeInfo[] {
  return Object.values(INPUT_TYPES).filter((it) => it.mvp_phase <= phase);
}

/**
 * Get input types grouped by family
 */
export function getInputTypesByFamily(): Record<InputFamily, InputTypeInfo[]> {
  const grouped: Record<InputFamily, InputTypeInfo[]> = {
    network_capture: [],
    api_specification: [],
    visual_ui: [],
    contextual_text: [],
  };
  for (const it of Object.values(INPUT_TYPES)) {
    grouped[it.family].push(it);
  }
  return grouped;
}
