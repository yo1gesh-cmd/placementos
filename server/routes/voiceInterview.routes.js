
import { Router } from 'express';
import multer from 'multer';
import {
  startSession,
  submitAnswer,
  getSession,
  getAllSessions,
  speakText,
  skipQuestion,
  aiLimiter
} from '../controllers/voiceInterview.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.use(protect);
router.post('/speak',aiLimiter, speakText);

router.post('/start',aiLimiter, startSession);
router.post('/:sessionId/answer',aiLimiter, upload.single('audio'), submitAnswer);
router.get('/:sessionId', getSession);
router.post('/:sessionId/skip', protect, skipQuestion);
router.get('/', getAllSessions);

export default router;