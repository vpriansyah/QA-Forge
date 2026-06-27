// ═══════════════════════════════════════════════════════════
// QA Forge — TC Generator Validation Schemas
// ═══════════════════════════════════════════════════════════

import { z } from 'zod';

export const columnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional().default(''),
});

export const generateTcSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  columns: z.array(columnSchema).min(1, 'Minimal 1 kolom harus dipilih'),
  input_type: z.enum(['prompt', 'screenshot', 'har']),
  input_data: z.object({
    prompt: z.string().optional(),
    file_keys: z.array(z.string()).optional(),
  }),
});

export const exportTcSchema = z.object({
  format: z.enum(['xlsx']).default('xlsx'),
});
