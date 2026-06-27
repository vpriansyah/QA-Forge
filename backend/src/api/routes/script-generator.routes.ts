// ═══════════════════════════════════════════════════════════
// QA Forge — Script Generator Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { ScriptGeneratorController } from '../controllers/script-generator.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { generateScriptSchema } from '../schemas/script-generator.schema';

const router = Router();
const controller = new ScriptGeneratorController();

// All routes require authentication
router.use(authMiddleware);

router.post('/generate', validate(generateScriptSchema), controller.generate.bind(controller));
router.get('/history', controller.getHistory.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.delete('/:id', controller.deleteHistory.bind(controller));

export { router as scriptGeneratorRoutes };
