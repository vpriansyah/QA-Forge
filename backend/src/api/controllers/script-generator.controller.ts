// ═══════════════════════════════════════════════════════════
// QA Forge — Script Generator Controller
// ═══════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ScriptGeneratorService } from '../../services/script-generator.service';
import { logger } from '../../config/logger';

const scriptService = new ScriptGeneratorService();

export class ScriptGeneratorController {
  /**
   * POST /script-generator/generate — Stream script generation
   */
  async generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, framework, language, input_type, input_data } = req.body;

      const { generation, stream } = await scriptService.generate(
        req.user!.id,
        title,
        framework,
        language,
        input_type,
        input_data
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send initial metadata (generation ID)
      res.write(`data: ${JSON.stringify({ type: 'metadata', data: { id: generation.id } })}\n\n`);

      let fullText = '';
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            fullText += chunk.text;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.text })}\n\n`);
          }
        }
      } catch (streamError: any) {
        logger.error({ streamError }, 'Stream iteration failed');
        res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message || 'Stream generation failed' })}\n\n`);
        res.end();
        return;
      }

      // Save to database
      try {
        const { prisma } = require('../../config/database');
        await prisma.scriptGeneration.update({
          where: { id: generation.id },
          data: {
            result: fullText || null,
            status: fullText ? 'completed' : 'failed',
          },
        });
      } catch (dbError) {
        logger.warn({ dbError }, 'Skipping DB update for script generation (degraded mode)');
      }

      res.write(`data: ${JSON.stringify({ type: 'done', data: fullText })}\n\n`);
      res.end();
    } catch (error) {
      logger.error({ error }, 'Script generation failed');
      next(error);
    }
  }

  /**
   * GET /script-generator/history — List history
   */
  async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await scriptService.getHistory(req.user!.id);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /script-generator/:id — Get specific generation
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const generation = await scriptService.getById(req.params.id as string, req.user!.id);
      if (!generation) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Generation tidak ditemukan' },
        });
        return;
      }
      res.json({ success: true, data: generation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /script-generator/:id — Delete history item
   */
  async deleteHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await scriptService.deleteHistory(req.params.id as string, req.user!.id);
      res.json({ success: true, message: 'History berhasil dihapus' });
    } catch (error: any) {
      if (error.message === 'Generation not found') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Generation tidak ditemukan' },
        });
        return;
      }
      next(error);
    }
  }
}
