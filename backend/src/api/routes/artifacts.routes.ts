// ═══════════════════════════════════════════════════════════
// QA Forge — Artifact Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ArtifactController } from '../controllers/artifacts.controller';

export const artifactRoutes = Router();
const controller = new ArtifactController();

artifactRoutes.use(authMiddleware);

artifactRoutes.get('/:id', controller.getById);
artifactRoutes.get('/:id/download', controller.download);
artifactRoutes.get('/session/:sessionId', controller.listBySession);
