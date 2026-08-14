import { Router } from 'express';
import { getRoutes, getRouteById } from '../controllers/route.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, getRoutes);
router.get('/:id', authenticate, getRouteById);
export default router;
