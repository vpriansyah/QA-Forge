// ═══════════════════════════════════════════════════════════
// QA Forge — Parser Stubs
// Input file parsers for all 10 supported input types
// ═══════════════════════════════════════════════════════════

// Each parser will be implemented during its respective MVP phase:
// Phase 1: curl.parser.ts (cURL flag extractor)
// Phase 2: har.parser.ts, postman.parser.ts, swagger.parser.ts
// Phase 3: log.parser.ts, jira.parser.ts
// Phase 4: xml.parser.ts (Mobile UI XML dump)

export { sanitizeHAR, sanitizeCURL, sanitizeText } from '../agents/agent-01-sanitizer';

// Parser Registry
export const PARSERS = {
  har: 'har.parser',
  curl: 'curl.parser',
  postman: 'postman.parser',
  swagger: 'swagger.parser',
  log: 'log.parser',
  jira: 'jira.parser',
  xml: 'xml.parser',
  text: 'text.parser',    // Pass-through
  screenshot: 'screenshot.parser', // Base64 encode for multimodal
  figma: 'figma.parser',  // Figma API client
} as const;
