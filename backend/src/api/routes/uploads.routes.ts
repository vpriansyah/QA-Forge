// ═══════════════════════════════════════════════════════════
// QA Forge — Upload Routes
// File upload endpoints for HAR, screenshots, etc.
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { UploadController } from '../controllers/uploads.controller';

export const uploadRoutes = Router();
const controller = new UploadController();

uploadRoutes.get('/file/:key', controller.downloadFile.bind(controller));

uploadRoutes.use(authMiddleware);

uploadRoutes.post('/har', uploadMiddleware.single('file'), controller.uploadHar);
uploadRoutes.post('/screenshot', uploadMiddleware.single('file'), controller.uploadScreenshot);
uploadRoutes.post('/file', uploadMiddleware.single('file'), controller.uploadFile);
