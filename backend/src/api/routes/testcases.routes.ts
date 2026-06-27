// ═══════════════════════════════════════════════════════════
// QA Forge — Test Case Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { TestCaseController } from '../controllers/testcases.controller';

export const testCaseRoutes = Router();
const controller = new TestCaseController();

testCaseRoutes.use(authMiddleware);

testCaseRoutes.get('/', controller.list);
testCaseRoutes.get('/:id', controller.getById);
testCaseRoutes.put('/:id', controller.update);
testCaseRoutes.post('/:id/approve', controller.approve);
testCaseRoutes.post('/:id/reject', controller.reject);
testCaseRoutes.delete('/:id', controller.archive);
