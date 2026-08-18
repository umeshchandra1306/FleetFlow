import { Router } from 'express';
import {
  getShipments, getShipmentById, createShipment, updateShipment,
  allocateVehicle, optimizeShipmentRoute, assignVehicle,
  startTrip, deliverShipment, updateShipmentStatus,
  simulateShipmentDelay, getDriverShipment, controlSimulation,
} from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateBody';
import {
  assignVehicleSchema,
  controlSimulationSchema,
  createShipmentSchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
} from '../validation/schemas';

const router = Router();

router.get('/', authenticate, getShipments);
router.post('/', authenticate, validateBody(createShipmentSchema), createShipment);
router.post('/simulation/control', authenticate, validateBody(controlSimulationSchema), controlSimulation);
router.get('/driver/:driverId/active', authenticate, getDriverShipment);

router.get('/:id', authenticate, getShipmentById);
router.put('/:id', authenticate, validateBody(updateShipmentSchema), updateShipment);
router.post('/:id/allocate', authenticate, allocateVehicle);
router.post('/:id/optimize', authenticate, optimizeShipmentRoute);
router.post('/:id/assign', authenticate, validateBody(assignVehicleSchema), assignVehicle);
router.post('/:id/start', authenticate, startTrip);
router.post('/:id/deliver', authenticate, deliverShipment);
router.post('/:id/status', authenticate, validateBody(updateShipmentStatusSchema), updateShipmentStatus);
router.post('/:id/simulate-delay', authenticate, simulateShipmentDelay);

export default router;
