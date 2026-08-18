import { Router } from 'express';
import { getDrivers, getDriverById, createDriver, updateDriver } from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateBody';
import { createDriverSchema, updateDriverSchema } from '../validation/schemas';

const router = Router();
router.get('/', authenticate, getDrivers);
router.post('/', authenticate, validateBody(createDriverSchema), createDriver);
router.get('/:id', authenticate, getDriverById);
router.put('/:id', authenticate, validateBody(updateDriverSchema), updateDriver);
export default router;
