import { Router } from 'express';
import { body } from 'express-validator';
import {
  createContent,
  deleteContent,
  getContent,
  getContentById,
  getStats,
  updateContent,
  updateStatus
} from '../controllers/content.controller.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/stats', auth, getStats);
router.get('/', auth, getContent);
router.get('/:id', auth, getContentById);

router.post(
  '/',
  auth,
  [body('title').trim().notEmpty().withMessage('Title is required'), body('description').trim().notEmpty().withMessage('Description is required')],
  validateRequest,
  createContent
);

router.put('/:id', auth, updateContent);
router.delete('/:id', auth, deleteContent);
router.patch('/:id/status', auth, roleCheck('admin'), [body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status')], validateRequest, updateStatus);

export default router;
