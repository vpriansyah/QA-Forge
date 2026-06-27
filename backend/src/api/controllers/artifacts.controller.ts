import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import crypto from 'crypto';
import path from 'path';
import { minioClient } from '../../config/minio';
import config from '../../config';

async function uploadToMinio(file: Express.Multer.File, bucket: string): Promise<{ filename: string; storage_key: string; mime_type: string; size: number }> {
  const ext = path.extname(file.originalname);
  const storageKey = `${crypto.randomUUID()}${ext}`;
  
  await minioClient.putObject(
    bucket,
    storageKey,
    file.buffer,
    file.size,
    {
      'content-type': file.mimetype,
    }
  );

  return {
    filename: file.originalname,
    storage_key: storageKey,
    mime_type: file.mimetype,
    size: file.size,
  };
}

export class ArtifactController {
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async download(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
  async listBySession(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: [] }); } catch (e) { next(e); } }
}

export class UploadController {
  async uploadHar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'Tidak ada file yang diunggah' } });
        return;
      }
      const data = await uploadToMinio(req.file, config.MINIO_BUCKET_UPLOADS);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async uploadScreenshot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'Tidak ada file yang diunggah' } });
        return;
      }
      const data = await uploadToMinio(req.file, config.MINIO_BUCKET_UPLOADS);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'Tidak ada file yang diunggah' } });
        return;
      }
      const data = await uploadToMinio(req.file, config.MINIO_BUCKET_UPLOADS);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const stream = await minioClient.getObject(config.MINIO_BUCKET_UPLOADS, key);
      
      const stat = await minioClient.statObject(config.MINIO_BUCKET_UPLOADS, key);
      res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      
      stream.pipe(res);
    } catch (e) {
      next(e);
    }
  }
}

export class ReportController {
  async getBySession(req: AuthRequest, res: Response, next: NextFunction) { try { res.json({ success: true, data: null }); } catch (e) { next(e); } }
}
