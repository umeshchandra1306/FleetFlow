import { Router } from 'express';
import { getDrivers, getDriverById, createDriver, updateDriver } from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getDrivers);
router.post('/', authenticate, createDriver);
router.get('/:id', authenticate, getDriverById);
router.put('/:id', authenticate, updateDriver);
export default router;
