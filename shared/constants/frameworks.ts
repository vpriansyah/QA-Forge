// ═══════════════════════════════════════════════════════════
// QA Forge — Supported Frameworks & Application Types
// ═══════════════════════════════════════════════════════════

export type AppType = 'web' | 'api' | 'mobile' | 'desktop';

export type Framework =
  | 'playwright'
  | 'cypress'
  | 'postman'
  | 'k6'
  | 'locust'
  | 'appium'
  | 'detox'
  | 'winappdriver';

export interface FrameworkInfo {
  id: Framework;
  name: string;
  category: 'web_e2e' | 'api' | 'load' | 'mobile' | 'desktop';
  language: string;
  output_file: string;
  app_types: AppType[];
  description: string;
  icon: string;
}

/**
 * Complete framework registry — maps each framework to its metadata.
 * Used in both backend (agent routing) and frontend (framework selector UI).
 */
export const FRAMEWORKS: Record<Framework, FrameworkInfo> = {
  playwright: {
    id: 'playwright',
    name: 'Playwright',
    category: 'web_e2e',
    language: 'TypeScript',
    output_file: '*.spec.ts',
    app_types: ['web'],
    description: 'Web E2E testing with Page Object Model',
    icon: '🎭',
  },
  cypress: {
    id: 'cypress',
    name: 'Cypress',
    category: 'web_e2e',
    language: 'JavaScript',
    output_file: '*.cy.js',
    app_types: ['web'],
    description: 'Web E2E testing with custom commands',
    icon: '🌲',
  },
  postman: {
    id: 'postman',
    name: 'Postman / Newman',
    category: 'api',
    language: 'JSON',
    output_file: 'collection.json',
    app_types: ['api'],
    description: 'API testing with importable collections',
    icon: '📮',
  },
  k6: {
    id: 'k6',
    name: 'k6',
    category: 'load',
    language: 'JavaScript',
    output_file: 'script.js',
    app_types: ['api'],
    description: 'Load testing with VU scenarios and thresholds',
    icon: '⚡',
  },
  locust: {
    id: 'locust',
    name: 'Locust',
    category: 'load',
    language: 'Python',
    output_file: 'locustfile.py',
    app_types: ['api'],
    description: 'Load testing with Python TaskSets',
    icon: '🦗',
  },
  appium: {
    id: 'appium',
    name: 'Appium',
    category: 'mobile',
    language: 'Python/Java',
    output_file: 'appium_test.py',
    app_types: ['mobile'],
    description: 'Mobile automation with accessibility locators',
    icon: '📱',
  },
  detox: {
    id: 'detox',
    name: 'Detox',
    category: 'mobile',
    language: 'JavaScript',
    output_file: '*.test.js',
    app_types: ['mobile'],
    description: 'React Native E2E testing',
    icon: '⚛️',
  },
  winappdriver: {
    id: 'winappdriver',
    name: 'WinAppDriver',
    category: 'desktop',
    language: 'C#/Python',
    output_file: 'ui_test.py',
    app_types: ['desktop'],
    description: 'Windows desktop UI Automation',
    icon: '🖥️',
  },
} as const;

/**
 * Get frameworks available for a given app type
 */
export function getFrameworksForAppType(appType: AppType): FrameworkInfo[] {
  return Object.values(FRAMEWORKS).filter((fw) =>
    fw.app_types.includes(appType)
  );
}

/**
 * App type display info
 */
export const APP_TYPES: Record<AppType, { name: string; icon: string; description: string }> = {
  web: {
    name: 'Web Application',
    icon: '🌐',
    description: 'Browser-based UIs — HAR file + description',
  },
  api: {
    name: 'REST API',
    icon: '🔌',
    description: 'HTTP endpoints — HAR file or Swagger/OpenAPI',
  },
  mobile: {
    name: 'Mobile App',
    icon: '📱',
    description: 'iOS and Android — UI XML dump or screenshot',
  },
  desktop: {
    name: 'Desktop App',
    icon: '🖥️',
    description: 'Windows/macOS apps — description or screen capture',
  },
} as const;
