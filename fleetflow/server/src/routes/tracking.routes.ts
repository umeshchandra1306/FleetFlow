import { Router } from 'express';
import { startTracking, stopTracking, getTracking } from '../controllers/tracking.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.post('/start', authenticate, startTracking);
router.post('/stop', authenticate, stopTracking);
router.get('/:vehicleId', authenticate, getTracking);
export default router;
