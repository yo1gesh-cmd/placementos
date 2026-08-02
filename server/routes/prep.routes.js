import { Router } from 'express';
import {
  addSkill,
  getSkill,
  updateSkill,
  deleteSkill,
  addProject,
  getProjects,
  updateProject,
  deleteProject,
} from '../controllers/prep.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// skill routes
router.post('/skills', addSkill);
router.get('/skills', getSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

// project routes
router.post('/projects', addProject);
router.get('/projects', getProjects);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

export default router;