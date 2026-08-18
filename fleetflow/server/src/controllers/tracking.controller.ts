import { Request, Response } from 'express';
import { prisma } from '../server';
import { io } from '../server';
import { startSimulation, stopSimulation } from '../services/simulator.service';
import { paramString } from '../utils/helpers';

export async function startTracking(req: Request, res: Response) {
  try {
    const { shipmentId } = req.body;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { vehicle: true, route: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (!shipment.vehicleId) {
      return res.status(400).json({ success: false, message: 'No vehicle assigned' });
    }
    if (!shipment.route) {
      return res.status(400).json({ success: false, message: 'No route available' });
    }

    const routePoints = shipment.route.routePoints as any[];
    if (!Array.isArray(routePoints) || routePoints.length === 0) {
      return res.status(400).json({ success: false, message: 'No route points available' });
    }

    startSimulation(io, shipmentId, shipment.vehicleId, routePoints);

    res.json({ success: true, data: { message: 'Tracking started' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function stopTracking(req: Request, res: Response) {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    stopSimulation(vehicleId);
    res.json({ success: true, data: { message: 'Tracking stopped' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTracking(req: Request, res: Response) {
  try {
    const vehicleId = paramString(req.params.vehicleId);

    const events = await prisma.trackingEvent.findMany({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    res.json({
      success: true,
      data: {
        currentPosition: vehicle ? { latitude: vehicle.latitude, longitude: vehicle.longitude } : null,
        events,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
