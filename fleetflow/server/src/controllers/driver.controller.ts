import { Request, Response } from 'express';
import { prisma } from '../server';

export async function getDrivers(req: Request, res: Response) {
  try {
    const { status, search } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { licenseNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        vehicle: true,
        shipments: {
          where: { status: { in: ['ASSIGNED', 'IN_TRANSIT', 'PICKED_UP', 'DELAYED'] } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDriverById(req: Request, res: Response) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        shipments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { route: true, vehicle: true },
        },
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDriver(req: Request, res: Response) {
  try {
    const { name, phone, licenseNumber } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'Name, phone, and license number are required' });
    }

    const existing = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'License number already exists' });
    }

    const driver = await prisma.driver.create({
      data: { name, phone, licenseNumber },
    });

    res.status(201).json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateDriver(req: Request, res: Response) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: req.body,
      include: { vehicle: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
