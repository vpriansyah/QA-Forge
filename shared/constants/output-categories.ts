// ═══════════════════════════════════════════════════════════
// QA Forge — 7 Output Categories
// ═══════════════════════════════════════════════════════════

export type OutputCategory =
  | 'test_documentation'
  | 'automation_scripts'
  | 'test_data'
  | 'bug_issue'
  | 'ci_cd'
  | 'checklists'
  | 'analytics';

export interface OutputCategoryInfo {
  id: OutputCategory;
  name: string;
  label: string;
  description: string;
  icon: string;
  always_generated: boolean;
  artifacts: OutputArtifactInfo[];
}

export interface OutputArtifactInfo {
  name: string;
  format: string;
  description: string;
}

/**
 * Complete output category registry — 7 categories with their artifact types.
 */
export const OUTPUT_CATEGORIES: Record<OutputCategory, OutputCategoryInfo> = {
  test_documentation: {
    id: 'test_documentation',
    name: 'Category A',
    label: 'Test Documentation',
    description: 'Test cases, test plans, test reports, and release notes',
    icon: '📋',
    always_generated: true,
    artifacts: [
      { name: 'Test Case', format: 'Markdown/Gherkin', description: 'Structured scenarios: given/when/then' },
      { name: 'Test Plan', format: 'Markdown/DOCX', description: 'Sprint-level scope and approach' },
      { name: 'Test Report', format: 'Markdown/PDF', description: 'Post-execution summary with metrics' },
      { name: 'Release Note (QA)', format: 'Markdown', description: 'Tested features and known issues' },
      { name: 'Risk Matrix', format: 'Markdown/XLSX', description: 'Feature-level risk assessment' },
    ],
  },
  automation_scripts: {
    id: 'automation_scripts',
    name: 'Category B',
    label: 'Automation Scripts',
    description: 'Runnable test scripts for selected frameworks',
    icon: '💻',
    always_generated: false,
    artifacts: [
      { name: 'Playwright', format: '*.spec.ts', description: 'TypeScript E2E with Page Object Model' },
      { name: 'Cypress', format: '*.cy.js', description: 'JavaScript with custom commands' },
      { name: 'Postman', format: 'collection.json', description: 'Importable API collection v2.1' },
      { name: 'k6', format: 'script.js', description: 'Load test with VU ramp-up and thresholds' },
      { name: 'Locust', format: 'locustfile.py', description: 'Python load test with HttpUser' },
      { name: 'Appium', format: 'appium_test.py', description: 'Mobile automation script' },
    ],
  },
  test_data: {
    id: 'test_data',
    name: 'Category C',
    label: 'Test Data',
    description: 'Test datasets, mock responses, and boundary values',
    icon: '🗃️',
    always_generated: false,
    artifacts: [
      { name: 'Test Data Set', format: 'JSON/CSV', description: 'Realistic sample data matching API schema' },
      { name: 'Mock API Response', format: 'JSON', description: 'Stubbed responses for offline testing' },
      { name: 'Database Seed Script', format: 'SQL/JSON', description: 'Seed data inferred from traffic' },
      { name: 'Boundary Value Set', format: 'JSON', description: 'Edge values for numeric/string fields' },
    ],
  },
  bug_issue: {
    id: 'bug_issue',
    name: 'Category D',
    label: 'Bug & Issue Artifacts',
    description: 'Bug reports, root cause analysis, and regression maps',
    icon: '🐛',
    always_generated: true,
    artifacts: [
      { name: 'Bug Report', format: 'Markdown/JIRA', description: 'Structured steps to reproduce' },
      { name: 'Root Cause Analysis', format: 'Markdown', description: 'Five-why analysis with hypothesis' },
      { name: 'Regression Impact Map', format: 'Markdown', description: 'Affected test cases mapping' },
    ],
  },
  ci_cd: {
    id: 'ci_cd',
    name: 'Category E',
    label: 'CI/CD Artifacts',
    description: 'Pipeline configs for GitHub Actions, GitLab CI, Docker',
    icon: '🔄',
    always_generated: false,
    artifacts: [
      { name: 'GitHub Actions', format: 'YAML', description: 'Workflow for test execution on push/PR' },
      { name: 'GitLab CI', format: 'YAML', description: '.gitlab-ci.yml with test stages' },
      { name: 'Dockerfile', format: 'Dockerfile', description: 'Test runner container image' },
      { name: 'Jenkins Pipeline', format: 'Jenkinsfile', description: 'Declarative pipeline with test stages' },
    ],
  },
  checklists: {
    id: 'checklists',
    name: 'Category F',
    label: 'Checklists & Matrices',
    description: 'Manual test checklists, device matrices, accessibility',
    icon: '✅',
    always_generated: false,
    artifacts: [
      { name: 'Manual Test Checklist', format: 'Markdown/XLSX', description: 'Step-by-step exploratory guide' },
      { name: 'Device Test Matrix', format: 'XLSX', description: 'OS × screen size × browser combinations' },
      { name: 'Compatibility Matrix', format: 'XLSX', description: 'Browser/OS compatibility grid' },
      { name: 'Accessibility Checklist', format: 'Markdown', description: 'WCAG 2.1 AA compliance checks' },
    ],
  },
  analytics: {
    id: 'analytics',
    name: 'Category G',
    label: 'Analytics & Metrics',
    description: 'Coverage analysis, quality dashboard, and sprint summaries',
    icon: '📊',
    always_generated: true,
    artifacts: [
      { name: 'Coverage Analysis', format: 'Markdown', description: 'Gap analysis with coverage score' },
      { name: 'Quality Dashboard Data', format: 'JSON/XLSX', description: 'Defect density and trends' },
      { name: 'Sprint QA Summary', format: 'Markdown/PDF', description: 'Per-sprint activity summary' },
    ],
  },
} as const;
