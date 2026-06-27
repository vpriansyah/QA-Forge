// ═══════════════════════════════════════════════════════════
// QA Forge — Chat Routes
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createConversationSchema, sendMessageSchema, updateConversationSchema, editMessageSchema } from '../schemas/chat.schema';

const router = Router();
const controller = new ChatController();

// All chat routes require authentication
router.use(authMiddleware);

router.get('/conversations', controller.listConversations.bind(controller));
router.post('/conversations', validate(createConversationSchema), controller.createConversation.bind(controller));
router.get('/conversations/:id', controller.getConversation.bind(controller));
router.patch('/conversations/:id', validate(updateConversationSchema), controller.updateConversation.bind(controller));
router.delete('/conversations/:id', controller.deleteConversation.bind(controller));
router.post('/conversations/:id/messages', validate(sendMessageSchema), controller.sendMessage.bind(controller));
router.put('/messages/:messageId', validate(editMessageSchema), controller.editMessage.bind(controller));
router.post('/conversations/:id/regenerate', controller.regenerate.bind(controller));

export { router as chatRoutes };
