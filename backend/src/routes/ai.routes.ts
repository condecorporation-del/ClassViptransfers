import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { aiChatSchema } from '../lib/validation';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiController = new AIController();

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Rate limiting
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/ai/transcribe - Transcribe audio
router.post(
  '/transcribe',
  aiRateLimit,
  upload.single('audio'),
  asyncHandler((req, res) => aiController.transcribe(req, res))
);

// POST /api/ai/chat - Chat with AI
router.post(
  '/chat',
  aiRateLimit,
  validate(aiChatSchema, 'body'),
  asyncHandler((req, res) => aiController.chat(req, res))
);

export default router;

