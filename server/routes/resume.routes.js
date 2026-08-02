import express from 'express';
import { generateResume } from '../controllers/resume.controller.js';
import { protect} from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate/:jdId', aiLimiter, generateResume);

export default router;