import { Router } from 'express';
import { body } from 'express-validator';
import { changePassword, deleteAccount, login, logout, me, register } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post(
  '/login',
  [body('username').trim().notEmpty().withMessage('Username is required'), body('password').notEmpty().withMessage('Password is required')],
  validateRequest,
  login
);

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  validateRequest,
  register
);

router.post('/logout', auth, logout);
router.get('/me', auth, me);
router.put(
  '/me/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  validateRequest,
  changePassword
);
router.delete('/me', auth, deleteAccount);

export default router;
