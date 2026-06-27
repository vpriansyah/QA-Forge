// ═══════════════════════════════════════════════════════════
// QA Forge — Test Case Generator Controller
// ═══════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TcGeneratorService } from '../../services/tc-generator.service';
import { logger } from '../../config/logger';

const tcService = new TcGeneratorService();

export class TcGeneratorController {
  /**
   * POST /tc-generator/generate — Generate test cases
   */
  async generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, columns, input_type, input_data } = req.body;

      const { generation, stream } = await tcService.generate(
        req.user!.id,
        title,
        columns,
        input_type,
        input_data
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send initial metadata (like generation ID)
      res.write(`data: ${JSON.stringify({ type: 'metadata', data: { id: generation.id } })}\n\n`);

      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk.text })}\n\n`);
        }
      }

      // Generation complete
      let finalResult = null;
      try {
        finalResult = JSON.parse(fullText);
      } catch (e) {
        logger.error({ error: e, fullText }, 'Failed to parse AI output to JSON');
      }

      // Save to database
      const { prisma } = require('../../config/database');
      await prisma.tcGeneration.update({
        where: { id: generation.id },
        data: {
          result: finalResult,
          status: finalResult ? 'completed' : 'failed',
        },
      });

      res.write(`data: ${JSON.stringify({ type: 'done', data: finalResult })}\n\n`);
      res.end();
    } catch (error) {
      logger.error({ error }, 'TC generation failed');
      next(error);
    }
  }

  /**
   * GET /tc-generator/history — List generation history
   */
  async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await tcService.getHistory(req.user!.id);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tc-generator/:id — Get specific generation
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const generation = await tcService.getById(req.params.id as string, req.user!.id);
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
   * DELETE /tc-generator/:id — Delete specific generation history
   */
  async deleteHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await tcService.deleteHistory(req.params.id as string, req.user!.id);
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

  /**
   * POST /tc-generator/:id/export — Export to Excel
   */
  async exportExcel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const buffer = await tcService.exportExcel(req.params.id as string, req.user!.id);

      const generation = await tcService.getById(req.params.id as string, req.user!.id);
      const filename = `${generation?.title || 'test-cases'}.xlsx`.replace(/[^a-zA-Z0-9_\-. ]/g, '_');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
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
