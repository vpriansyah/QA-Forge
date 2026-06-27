// ═══════════════════════════════════════════════════════════
// QA Forge — API Route Aggregator
// All v1 API routes registered here
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { projectRoutes } from './projects.routes';
import { sessionRoutes } from './sessions.routes';
import { pipelineRoutes } from './pipeline.routes';
import { testCaseRoutes } from './testcases.routes';
import { artifactRoutes } from './artifacts.routes';
import { uploadRoutes } from './uploads.routes';
import { reportRoutes } from './reports.routes';
import { chatRoutes } from './chat.routes';
import { tcGeneratorRoutes } from './tc-generator.routes';
import { scriptGeneratorRoutes } from './script-generator.routes';

export const apiRouter = Router();

// Public routes
apiRouter.use('/auth', authRoutes);

// Protected routes (auth middleware applied in each route file)
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/pipeline', pipelineRoutes);
apiRouter.use('/test-cases', testCaseRoutes);
apiRouter.use('/artifacts', artifactRoutes);
apiRouter.use('/uploads', uploadRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/tc-generator', tcGeneratorRoutes);
apiRouter.use('/script-generator', scriptGeneratorRoutes);

