// ═══════════════════════════════════════════════════════════
// QA Forge — Chat Controller
// Handles HTTP endpoints for QA Chat feature
// ═══════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ChatService } from '../../services/chat.service';
import { logger } from '../../config/logger';

const chatService = new ChatService();

export class ChatController {
  /**
   * GET /chat/conversations — List all user's conversations
   */
  async listConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await chatService.listConversations(req.user!.id);
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /chat/conversations — Create a new conversation
   */
  async createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await chatService.createConversation(req.user!.id, req.body.title);
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /chat/conversations/:id — Get conversation with messages
   */
  async getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await chatService.getConversation(req.params.id as string, req.user!.id);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Conversation tidak ditemukan' },
        });
        return;
      }
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /chat/conversations/:id — Delete a conversation
   */
  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await chatService.deleteConversation(req.params.id as string, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /chat/conversations/:id — Update a conversation's title
   */
  async updateConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      const conversation = await chatService.updateConversation(req.params.id as string, req.user!.id, title);
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /chat/conversations/:id/messages — Send message and stream AI response via SSE
   */
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversationId = req.params.id as string;
      const { content, attachments, localTime } = req.body;

      // Verify conversation belongs to user
      const conversation = await chatService.getConversation(conversationId, req.user!.id);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Conversation tidak ditemukan' },
        });
        return;
      }

      // Save user message
      await chatService.saveUserMessage(conversationId, content, attachments);

      // Auto-generate title on first message
      const isFirstMessage = conversation.messages.length === 0;

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Stream AI response and generate title concurrently
      try {
        const streamGenerator = chatService.streamResponse(conversationId, localTime);
        
        let titlePromise = null;
        if (isFirstMessage) {
          titlePromise = chatService.autoGenerateTitle(conversationId, content)
            .then(titleGenerated => {
              res.write(`data: ${JSON.stringify({ type: 'title', content: titleGenerated })}\n\n`);
            })
            .catch(err => {
              logger.warn({ err }, 'Gagal generate title');
            });
        }

        for await (const chunk of streamGenerator) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        // Tunggu title generation selesai jika masih berjalan agar tidak terputus saat res.end()
        if (titlePromise) {
          await titlePromise;
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      } catch (streamError) {
        logger.error({ streamError, conversationId }, 'Error streaming chat response');
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Gagal mendapatkan response dari AI' })}\n\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /chat/messages/:messageId — Edit a message and stream new AI response
   */
  async editMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const messageId = req.params.messageId as string;
      const { content, localTime } = req.body;

      // Edit message and get conversation ID
      const conversationId = await chatService.editUserMessage(messageId, req.user!.id, content);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Stream AI response
      try {
        for await (const chunk of chatService.streamResponse(conversationId, localTime)) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      } catch (streamError) {
        logger.error({ streamError, conversationId }, 'Error streaming chat response during edit');
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Gagal mendapatkan response dari AI' })}\n\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /chat/conversations/:id/regenerate — Regenerate the last assistant response
   */
  async regenerate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversationId = req.params.id as string;
      const { localTime } = req.body || {};

      // Prepare conversation for regeneration
      await chatService.prepareRegenerate(conversationId, req.user!.id);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      // Stream AI response
      try {
        for await (const chunk of chatService.streamResponse(conversationId, localTime)) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      } catch (streamError) {
        logger.error({ streamError, conversationId }, 'Error streaming chat response during regeneration');
        res.write(`data: ${JSON.stringify({ type: 'error', content: 'Gagal mendapatkan response dari AI' })}\n\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  }
}
