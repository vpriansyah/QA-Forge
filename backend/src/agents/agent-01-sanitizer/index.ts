// ═══════════════════════════════════════════════════════════
// QA Forge — Input Sanitizer (Agent 01)
// DETERMINISTIC CODE FUNCTION — NOT an AI call
// Must run before any data reaches AI agents
// ═══════════════════════════════════════════════════════════

import { logger } from '../../config/logger';

const BLOCKED_HEADERS = [
  'authorization', 'cookie', 'set-cookie', 'x-auth-token',
  'x-api-key', 'proxy-authorization', 'x-access-token',
  'x-session-token', 'x-csrf-token', 'x-requested-with',
];

const SENSITIVE_BODY_REGEX =
  /\b(token|key|secret|password|passwd|auth|bearer|jwt|credential|session|apikey|api_key|access_token|refresh_token|client_secret)\b/i;

const KEEP_RESOURCE_TYPES = ['xmlhttprequest', 'fetch'];

export interface SanitizationResult {
  input_type: string;
  sanitized_input: Record<string, unknown>;
  sanitization_log: string[];
  request_count?: number;
  confirmed: boolean;
}

/**
 * Sanitize HAR file — strip credentials, filter to XHR/Fetch only
 */
export function sanitizeHAR(har: Record<string, unknown>, targetDomain?: string): SanitizationResult {
  const removed: string[] = [];
  const log = har?.log as Record<string, unknown> | undefined;
  const entries = (log?.entries as Array<Record<string, unknown>>) || [];

  const filtered = entries
    .filter((entry) => {
      const resourceType = (entry as any)?._resourceType;
      return !resourceType || KEEP_RESOURCE_TYPES.includes(resourceType);
    })
    .filter((entry) => {
      if (!targetDomain) return true;
      const url = (entry as any)?.request?.url || '';
      try { return new URL(url).hostname.includes(targetDomain); } catch { return true; }
    })
    .slice(0, 200)
    .map((entry) => {
      const request = (entry as any)?.request;
      const response = (entry as any)?.response;

      // Strip request headers
      if (request?.headers) {
        request.headers = request.headers.filter((h: any) => {
          if (BLOCKED_HEADERS.includes(h.name.toLowerCase())) {
            removed.push(`Request header: ${h.name}`);
            return false;
          }
          return true;
        });
      }

      // Redact sensitive body fields
      if (request?.postData?.text) {
        try {
          const body = JSON.parse(request.postData.text);
          redactFields(body, removed);
          request.postData.text = JSON.stringify(body);
        } catch { /* not JSON, skip */ }
      }

      // Strip response cookies
      if (response?.headers) {
        response.headers = response.headers.filter((h: any) => {
          if (['set-cookie', 'authorization'].includes(h.name.toLowerCase())) {
            removed.push(`Response header: ${h.name}`);
            return false;
          }
          return true;
        });
      }

      // Truncate large response bodies
      if (response?.content?.text?.length > 10000) {
        response.content.text = '[TRUNCATED — body > 10KB]';
      }

      return entry;
    });

  logger.info({ requestCount: filtered.length, fieldsRemoved: removed.length }, 'HAR sanitized');

  return {
    input_type: 'har',
    sanitized_input: { ...har, log: { entries: filtered } },
    sanitization_log: removed,
    request_count: filtered.length,
    confirmed: false,
  };
}

/**
 * Sanitize cURL command — strip auth flags
 */
export function sanitizeCURL(command: string): SanitizationResult {
  const removed: string[] = [];
  let result = command
    .replace(/(-u|--user)\s+[^\s]+/g, () => { removed.push('Basic auth (-u)'); return '-u [REDACTED]'; })
    .replace(/(-H|--header)\s+['"]?Authorization:[^'"\\n]+['"]?/gi, () => { removed.push('Authorization header'); return '-H "Authorization: [REDACTED]"'; })
    .replace(/(-b|--cookie)\s+[^\s]+/g, () => { removed.push('Cookie (-b)'); return '-b [REDACTED]'; })
    .replace(/--oauth2-bearer\s+[^\s]+/g, () => { removed.push('OAuth bearer'); return '--oauth2-bearer [REDACTED]'; });

  return {
    input_type: 'curl',
    sanitized_input: { command: result },
    sanitization_log: removed,
    confirmed: false,
  };
}

/**
 * Pass-through for text input (no credentials expected)
 */
export function sanitizeText(text: string): SanitizationResult {
  const warnings: string[] = [];
  if (SENSITIVE_BODY_REGEX.test(text)) {
    warnings.push('⚠️ Text may contain sensitive keywords — please review before proceeding');
  }

  return {
    input_type: 'text',
    sanitized_input: { content: text },
    sanitization_log: warnings,
    confirmed: false,
  };
}

/** Recursively redact sensitive fields in a JSON object */
function redactFields(obj: Record<string, unknown>, removed: string[]): void {
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_BODY_REGEX.test(key)) {
      removed.push(`Body field: ${key}`);
      obj[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redactFields(obj[key] as Record<string, unknown>, removed);
    }
  }
}
