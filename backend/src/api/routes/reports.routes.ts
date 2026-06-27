// ═══════════════════════════════════════════════════════════
// QA Forge — Report Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ReportController } from '../controllers/reports.controller';

export const reportRoutes = Router();
const controller = new ReportController();

reportRoutes.use(authMiddleware);

reportRoutes.get('/:sessionId', controller.getBySession);
