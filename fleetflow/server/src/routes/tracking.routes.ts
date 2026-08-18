import { Router } from 'express';
import { startTracking, stopTracking, getTracking } from '../controllers/tracking.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateBody';
import { startTrackingSchema, stopTrackingSchema } from '../validation/schemas';

const router = Router();
router.post('/start', authenticate, validateBody(startTrackingSchema), startTracking);
router.post('/stop', authenticate, validateBody(stopTrackingSchema), stopTracking);
router.get('/:vehicleId', authenticate, getTracking);
export default router;
