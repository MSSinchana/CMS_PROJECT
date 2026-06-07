import { Router } from 'express';
import { getActivityLogs, getRecentActivityLogs } from '../controllers/activityLog.controller.js';
import { auth } from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = Router();

// All activity log routes are admin-only
router.get('/recent', auth, roleCheck('admin'), getRecentActivityLogs);
router.get('/', auth, roleCheck('admin'), getActivityLogs);

export default router;
