import { Request, Response } from 'express';
import { prisma } from '../server';

export async function getAlerts(req: Request, res: Response) {
  try {
    const { resolved, type, severity } = req.query;
    const where: any = {};

    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        vehicle: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function resolveAlert(req: Request, res: Response) {
  try {
    const alert = await prisma.alert.findUnique({ where: { id: req.params.id } });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id: req.params.id },
      data: { resolved: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
