import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { getAiCheckinById, uploadAiCheckin } from '../controllers/aiCheckin.controller';
import { createInMemoryRateLimit } from '../middlewares/rateLimit';

const router = express.Router();

const maxMb = Number(process.env.AI_CHECKIN_MAX_UPLOAD_MB || 10);
const uploadDir = path.resolve(process.cwd(), 'uploads', 'ai-checkins');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

const aiUploadLimiter = createInMemoryRateLimit(10, 15 * 60 * 1000);

router.post('/upload', aiUploadLimiter, upload.single('image'), uploadAiCheckin);
router.get('/:id', getAiCheckinById);

export default router;
