// ═══════════════════════════════════════════════════════════
// QA Forge — Project Routes
// CRUD /projects
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ProjectController } from '../controllers/projects.controller';

export const projectRoutes = Router();
const controller = new ProjectController();

projectRoutes.use(authMiddleware);

projectRoutes.get('/', controller.list);
projectRoutes.post('/', controller.create);
projectRoutes.get('/:id', controller.getById);
projectRoutes.put('/:id', controller.update);
projectRoutes.delete('/:id', controller.delete);
