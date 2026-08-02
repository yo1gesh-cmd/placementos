import { Router } from 'express';
import {
  analyzeJD,
  getJDHistory,
  getJDById,
  
  getRecommendedSkills,
  aiLimiter
} from '../controllers/jd.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/analyze',aiLimiter,upload.fields([
    { name: 'jdPdf', maxCount: 1 },
    { name: 'resumePdf', maxCount: 1 },
  ]), analyzeJD);
router.get('/', getJDHistory);
router.get('/recommended-skills',aiLimiter, getRecommendedSkills);
router.get('/:id', getJDById);

export default router;
