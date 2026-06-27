// ═══════════════════════════════════════════════════════════
// QA Forge — Chat Service
// Handles conversation CRUD, AI streaming, and auto-titling
// ═══════════════════════════════════════════════════════════

import { prisma } from '../config/database';
import { ai, AI_MODEL } from '../config/gemini';
import { logger } from '../config/logger';
import { minioClient } from '../config/minio';
import { config } from '../config';

const QA_SYSTEM_PROMPT = `Kamu adalah QA Forge AI Assistant — asisten ahli Quality Assurance (QA) yang sangat berpengalaman.

Keahlianmu mencakup:
- **Test Strategy & Planning**: Merancang strategi testing, test plan, dan test approach
- **Test Case Design**: Menulis test case (functional, integration, E2E, edge case, negative testing)
- **Bug Analysis**: Menganalisis bug, root cause analysis, dan rekomendasi fix
- **Automation Testing**: Playwright, Cypress, Selenium, Postman, k6, Locust, Appium
- **API Testing**: REST, GraphQL, WebSocket — validasi request/response, status code, error handling
- **Performance Testing**: Load testing, stress testing, bottleneck analysis
- **Security Testing**: OWASP top 10, SQL injection, XSS, CSRF
- **Mobile Testing**: Android & iOS, responsive testing
- **CI/CD & DevOps**: Pipeline integration, test automation in CI
- **Test Reports**: Bug report writing, test summary, coverage analysis

Instruksi:
1. Jawab dalam Bahasa Indonesia kecuali user bertanya dalam bahasa Inggris
2. Berikan jawaban yang praktis, actionable, dan terstruktur
3. Gunakan contoh kode jika relevan (dengan code block dan bahasa yang tepat)
4. Jika user bertanya di luar topik QA/testing, arahkan kembali ke konteks QA dengan sopan
5. Gunakan format markdown untuk keterbacaan (heading, list, code block, table)
6. Jika diminta membuat test case, gunakan format terstruktur dengan ID, steps, expected result`;

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string) {
    return prisma.chatConversation.create({
      data: {
        user_id: userId,
        title: title || 'New Chat',
      },
    });
  }

  /**
   * List all conversations for a user
   */
  async listConversations(userId: string) {
    return prisma.chatConversation.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { content: true, role: true, created_at: true },
        },
      },
    });
  }

  /**
   * Get a conversation with all its messages
   */
  async getConversation(conversationId: string, userId: string) {
    return prisma.chatConversation.findFirst({
      where: { id: conversationId, user_id: userId },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    return prisma.chatConversation.deleteMany({
      where: { id: conversationId, user_id: userId },
    });
  }

  /**
   * Update a conversation's title
   */
  async updateConversation(conversationId: string, userId: string, title: string) {
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, user_id: userId },
    });

    if (!conversation) {
      throw new Error('Conversation tidak ditemukan atau tidak memiliki akses');
    }

    return prisma.chatConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Save a user message to a conversation
   */
  async saveUserMessage(conversationId: string, content: string, attachments?: any[]) {
    return prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        role: 'user',
        content,
        attachments: attachments || [],
      },
    });
  }

  /**
   * Save an assistant message to a conversation
   */
  async saveAssistantMessage(conversationId: string, content: string, tokenUsage?: object) {
    return prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        role: 'assistant',
        content,
        token_usage: tokenUsage || undefined,
      },
    });
  }

  /**
   * Edit a user message and delete all subsequent messages
   */
  async editUserMessage(messageId: string, userId: string, newContent: string): Promise<string> {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new Error('Pesan tidak ditemukan');
    }

    if (message.conversation.user_id !== userId) {
      throw new Error('Akses ditolak');
    }

    // Update the message content
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: newContent },
    });

    // Delete all messages in the conversation created after this message
    await prisma.chatMessage.deleteMany({
      where: {
        conversation_id: message.conversation_id,
        created_at: {
          gt: message.created_at,
        },
      },
    });

    return message.conversation_id;
  }

  /**
   * Prepare conversation for regeneration by deleting the last assistant message
   */
  async prepareRegenerate(conversationId: string, userId: string): Promise<string> {
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, user_id: userId },
      include: {
        messages: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation tidak ditemukan atau tidak memiliki akses');
    }

    const lastMessage = conversation.messages[0];
    if (lastMessage && lastMessage.role === 'assistant') {
      await prisma.chatMessage.delete({
        where: { id: lastMessage.id },
      });
    }

    return conversationId;
  }

  /**
   * Build the messages array for Gemini from conversation history
   */
  async buildChatHistory(conversationId: string) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      select: { role: true, content: true, attachments: true },
    });

    const chatHistory = [];
    for (const m of messages) {
      const role = m.role === 'user' ? ('user' as const) : ('model' as const);
      const parts: any[] = [{ text: m.content || '' }];

      if (m.role === 'user' && m.attachments) {
        const attachments = m.attachments as any[];
        for (const att of attachments) {
          try {
            // Fetch file from MinIO
            const stream = await minioClient.getObject(config.MINIO_BUCKET_UPLOADS, att.storage_key);
            const buffer = await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = [];
              stream.on('data', (chunk) => chunks.push(chunk));
              stream.on('end', () => resolve(Buffer.concat(chunks)));
              stream.on('error', (err) => reject(err));
            });

            const isImage = att.mime_type?.startsWith('image/');
            const isPdf = att.mime_type === 'application/pdf';

            if (isImage || isPdf) {
              parts.push({
                inlineData: {
                  mimeType: att.mime_type,
                  data: buffer.toString('base64'),
                },
              });
            } else {
              // Assume it's a text-based file (txt, log, har, json, csv, etc.)
              const textContent = buffer.toString('utf-8');
              parts[0].text += `\n\n--- LAMPIRAN FILE: ${att.filename} ---\n\`\`\`\n${textContent.substring(0, 100000)}\n\`\`\`\n`;
            }
          } catch (err) {
            logger.warn({ err, att }, 'Gagal memproses attachment untuk AI');
          }
        }
      }

      chatHistory.push({ role, parts });
    }
    return chatHistory;
  }

  /**
   * Stream AI response using Gemini generateContentStream
   */
  async *streamResponse(conversationId: string, localTime?: string): AsyncGenerator<string> {
    const history = await this.buildChatHistory(conversationId);

    logger.debug({ conversationId, messageCount: history.length }, 'Streaming chat response');

    const currentTime = localTime || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const systemPromptWithTime = `${QA_SYSTEM_PROMPT}\n\n[CONTEXT]\nWaktu lokal user saat ini: ${currentTime}`;

    const response = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents: history,
      config: {
        systemInstruction: systemPromptWithTime,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    let fullText = '';

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        yield text;
      }
    }

    // Save the complete assistant message after streaming finishes
    const usage = await (response as any).usageMetadata;
    await this.saveAssistantMessage(conversationId, fullText, {
      input_tokens: usage?.promptTokenCount || 0,
      output_tokens: usage?.candidatesTokenCount || 0,
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });
  }

  /**
   * Auto-generate a conversation title from the first user message
   */
  async autoGenerateTitle(conversationId: string, firstMessage: string) {
    try {
      let title = firstMessage.trim().split('\n')[0].substring(0, 35);
      if (firstMessage.length > 35) {
        title += '...';
      }
      if (!title) title = 'New Chat';

      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title },
      });

      return title;
    } catch (error) {
      logger.warn({ error }, 'Failed to auto-generate chat title');
      return 'New Chat';
    }
  }
}
