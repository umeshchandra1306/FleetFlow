import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle } from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getVehicles);
router.post('/', authenticate, createVehicle);
router.get('/:id', authenticate, getVehicleById);
router.put('/:id', authenticate, updateVehicle);
export default router;
