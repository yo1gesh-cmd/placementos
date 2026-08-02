import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateProfile,
  getProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();


router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.post('/refresh', refreshAccessToken);

export default router;