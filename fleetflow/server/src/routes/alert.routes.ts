import { Router } from 'express';
import { getAlerts, resolveAlert } from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getAlerts);
router.put('/:id/resolve', authenticate, resolveAlert);
export default router;
