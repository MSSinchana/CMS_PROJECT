import { Router } from 'express';
import { body } from 'express-validator';
import {
  addComment,
  addReaction,
  getBlogById,
  getBlogComments,
  getBlogs
} from '../controllers/blogs.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.get('/:id/comments', getBlogComments);

router.post(
  '/:id/comments',
  auth,
  [
    body('body').trim().notEmpty().withMessage('Comment is required'),
    body('parentCommentId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid parent comment')
  ],
  validateRequest,
  addComment
);

router.post(
  '/:id/reactions',
  auth,
  [body('reactionType').isIn(['like', 'love', 'insightful', 'celebrate']).withMessage('Invalid reaction type')],
  validateRequest,
  addReaction
);

export default router;
