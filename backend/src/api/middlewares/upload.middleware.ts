// ═══════════════════════════════════════════════════════════
// QA Forge — File Upload Middleware (Multer)
// Handles HAR, screenshots, and other file uploads
// ═══════════════════════════════════════════════════════════

import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (HAR files can be large)

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/json',          // HAR, Postman, Swagger JSON
    'application/x-yaml',       // Swagger YAML
    'text/yaml',                // Swagger YAML
    'text/plain',               // cURL, logs, text
    'text/xml',                 // Mobile XML dump
    'application/xml',          // Mobile XML dump
    'image/png',                // Screenshots
    'image/jpeg',               // Screenshots
    'image/webp',               // Screenshots
    'video/mp4',                // Screen recordings
    'video/quicktime',          // Screen recordings (.mov)
    'application/pdf',          // PDF documents
    'application/msword',       // Word documents (.doc)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word documents (.docx)
    'text/csv',                 // CSV files
    'application/vnd.ms-excel', // Excel documents (.xls)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel documents (.xlsx)
    'application/octet-stream', // Fallback for unknown types
  ];

  const allowedExtensions = [
    '.har', '.json', '.yaml', '.yml',
    '.txt', '.log', '.xml',
    '.png', '.jpg', '.jpeg', '.webp',
    '.mp4', '.mov',
    '.curl',
    '.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx',
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExt = allowedExtensions.includes(ext);

  if (isValidMime || isValidExt) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype} (${ext})`));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export default uploadMiddleware;
