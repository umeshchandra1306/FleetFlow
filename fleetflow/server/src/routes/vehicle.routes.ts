import { Router } from 'express';
import { getVehicles, getVehicleById, createVehicle, updateVehicle } from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateBody';
import { createVehicleSchema, updateVehicleSchema } from '../validation/schemas';

const router = Router();
router.get('/', authenticate, getVehicles);
router.post('/', authenticate, validateBody(createVehicleSchema), createVehicle);
router.get('/:id', authenticate, getVehicleById);
router.put('/:id', authenticate, validateBody(updateVehicleSchema), updateVehicle);
export default router;
