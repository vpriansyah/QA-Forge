// ═══════════════════════════════════════════════════════════
// QA Forge — TC Generator Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { TcGeneratorController } from '../controllers/tc-generator.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { generateTcSchema } from '../schemas/tc-generator.schema';

const router = Router();
const controller = new TcGeneratorController();

// All routes require authentication
router.use(authMiddleware);

router.post('/generate', validate(generateTcSchema), controller.generate.bind(controller));
router.get('/history', controller.getHistory.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.delete('/:id', controller.deleteHistory.bind(controller));
router.post('/:id/export', controller.exportExcel.bind(controller));

export { router as tcGeneratorRoutes };
