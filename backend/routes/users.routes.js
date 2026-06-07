import { Router } from 'express';
import { body } from 'express-validator';
import {
  createUser,
  deleteUser,
  followUser,
  getPeople,
  getUsers,
  unfollowUser,
  updateUser
} from '../controllers/users.controller.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', auth, roleCheck('admin'), getUsers);
router.get('/people', auth, getPeople);
router.post('/:id/follow', auth, followUser);
router.delete('/:id/follow', auth, unfollowUser);

router.post(
  '/',
  auth,
  roleCheck('admin'),
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email must be valid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user')
  ],
  validateRequest,
  createUser
);

router.put('/:id', auth, roleCheck('admin'), updateUser);
router.delete('/:id', auth, roleCheck('admin'), deleteUser);

export default router;
