import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../server';
import { paramString } from '../utils/helpers';

export async function getVehicles(req: Request, res: Response) {
  try {
    const { status, type, search } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status;
    if (type) where.vehicleType = type;
    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search as string, mode: 'insensitive' } },
        { vehicleType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        driver: true,
        shipments: {
          where: { status: { in: ['ASSIGNED', 'IN_TRANSIT', 'PICKED_UP', 'DELAYED'] } },
          take: 1,
        },
      },
      orderBy: { vehicleNumber: 'asc' },
    });

    res.json({ success: true, data: vehicles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
        shipments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { route: true },
        },
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Calculate utilization
    const totalShipments = await prisma.shipment.count({ where: { vehicleId: vehicle.id } });
    const completedShipments = await prisma.shipment.count({
      where: { vehicleId: vehicle.id, status: 'DELIVERED' },
    });

    res.json({
      success: true,
      data: {
        ...vehicle,
        totalShipments,
        completedShipments,
        utilization: totalShipments > 0 ? Math.round((completedShipments / totalShipments) * 100) : 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createVehicle(req: Request, res: Response) {
  try {
    const { vehicleNumber, vehicleType, capacity, fuelType, latitude, longitude } = req.body;

    if (!vehicleNumber || !vehicleType || !capacity) {
      return res.status(400).json({ success: false, message: 'Vehicle number, type, and capacity are required' });
    }

    const existing = await prisma.vehicle.findUnique({ where: { vehicleNumber } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vehicle number already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber,
        vehicleType,
        capacity: parseFloat(capacity),
        fuelType: fuelType || 'Diesel',
        latitude: latitude ? parseFloat(latitude) : 28.6139,
        longitude: longitude ? parseFloat(longitude) : 77.2090,
      },
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const {
      vehicleNumber, vehicleType, capacity, fuelType,
      latitude, longitude, status, currentLoad, driverId,
    } = req.body;

    const data: Prisma.VehicleUpdateInput = {};
    if (vehicleNumber !== undefined) data.vehicleNumber = vehicleNumber;
    if (vehicleType !== undefined) data.vehicleType = vehicleType;
    if (capacity !== undefined) data.capacity = parseFloat(capacity);
    if (fuelType !== undefined) data.fuelType = fuelType;
    if (latitude !== undefined) data.latitude = parseFloat(latitude);
    if (longitude !== undefined) data.longitude = parseFloat(longitude);
    if (status !== undefined) data.status = status;
    if (currentLoad !== undefined) data.currentLoad = parseFloat(currentLoad);
    if (driverId !== undefined) {
      data.driver = driverId
        ? { connect: { id: driverId } }
        : { disconnect: true };
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data,
      include: { driver: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
