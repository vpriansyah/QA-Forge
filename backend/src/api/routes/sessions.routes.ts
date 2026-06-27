// ═══════════════════════════════════════════════════════════
// QA Forge — Session Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { SessionController } from '../controllers/sessions.controller';

export const sessionRoutes = Router();
const controller = new SessionController();

sessionRoutes.use(authMiddleware);

sessionRoutes.get('/', controller.list);
sessionRoutes.post('/', controller.create);
sessionRoutes.get('/:id', controller.getById);
sessionRoutes.put('/:id', controller.update);
sessionRoutes.delete('/:id', controller.delete);
