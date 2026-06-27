// ═══════════════════════════════════════════════════════════
// QA Forge — Chat Validation Schemas
// ═══════════════════════════════════════════════════════════

import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(20000),
  attachments: z.array(z.object({
    filename: z.string(),
    storage_key: z.string(),
    mime_type: z.string(),
    size: z.number(),
  })).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').max(200),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Pesan tidak boleh kosong').max(20000),
});

