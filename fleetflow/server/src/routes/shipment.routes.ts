import { Router } from 'express';
import {
  getShipments, getShipmentById, createShipment, updateShipment,
  allocateVehicle, optimizeShipmentRoute, assignVehicle,
  startTrip, deliverShipment, updateShipmentStatus,
  simulateShipmentDelay, getDriverShipment, controlSimulation,
} from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getShipments);
router.post('/', authenticate, createShipment);
router.get('/:id', authenticate, getShipmentById);
router.put('/:id', authenticate, updateShipment);

router.post('/:id/allocate', authenticate, allocateVehicle);
router.post('/:id/optimize', authenticate, optimizeShipmentRoute);
router.post('/:id/assign', authenticate, assignVehicle);
router.post('/:id/start', authenticate, startTrip);
router.post('/:id/deliver', authenticate, deliverShipment);
router.post('/:id/status', authenticate, updateShipmentStatus);
router.post('/:id/simulate-delay', authenticate, simulateShipmentDelay);
router.post('/simulation/control', authenticate, controlSimulation);
router.get('/driver/:driverId/active', authenticate, getDriverShipment);

export default router;
