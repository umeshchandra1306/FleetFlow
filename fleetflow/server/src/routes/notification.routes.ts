import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllRead } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markNotificationRead);
router.put('/read-all', authenticate, markAllRead);
export default router;
