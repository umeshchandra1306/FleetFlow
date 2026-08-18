import { Request, Response } from 'express';
import { prisma } from '../server';
import { paramString } from '../utils/helpers';

export async function getRoutes(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const routes = await prisma.route.findMany({
      where,
      include: {
        vehicle: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: routes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRouteById(req: Request, res: Response) {
  try {
    const id = paramString(req.params.id);
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        vehicle: { include: { driver: true } },
        shipment: true,
      },
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({ success: true, data: route });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
