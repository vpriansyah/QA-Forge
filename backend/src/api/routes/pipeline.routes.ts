// ═══════════════════════════════════════════════════════════
// QA Forge — Pipeline Routes
// POST /pipeline/run, GET /pipeline/:id/status
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { PipelineController } from '../controllers/pipeline.controller';

export const pipelineRoutes = Router();
const controller = new PipelineController();

pipelineRoutes.use(authMiddleware);

pipelineRoutes.post('/run', controller.run);
pipelineRoutes.get('/:id/status', controller.getStatus);
pipelineRoutes.post('/:id/cancel', controller.cancel);
pipelineRoutes.post('/:id/confirm-sanitization', controller.confirmSanitization);
pipelineRoutes.post('/:id/answer-clarification', controller.answerClarification);
