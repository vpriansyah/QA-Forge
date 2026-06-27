// ═══════════════════════════════════════════════════════════
// QA Forge — Script Generator Validation Schemas
// ═══════════════════════════════════════════════════════════

import { z } from 'zod';

export const generateScriptSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  framework: z.enum(['playwright', 'cypress', 'postman', 'k6', 'appium', 'locust', 'jmeter']),
  language: z.enum(['typescript', 'javascript', 'python']).default('typescript'),
  input_type: z.enum(['prompt', 'screenshot', 'har', 'tc_result']),
  input_data: z.object({
    prompt: z.string().optional(),
    file_keys: z.array(z.string()).optional(),
    tc_result: z.array(z.any()).optional(),
  }),
});
