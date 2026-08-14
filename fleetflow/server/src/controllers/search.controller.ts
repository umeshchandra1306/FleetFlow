import { Request, Response } from 'express';
import { prisma } from '../server';

export async function globalSearch(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ success: true, data: { results: [] } });
    }

    const query = q.trim();

    const [shipments, vehicles, drivers, routes] = await Promise.all([
      prisma.shipment.findMany({
        where: {
          OR: [
            { shipmentNumber: { contains: query, mode: 'insensitive' } },
            { pickupLocation: { contains: query, mode: 'insensitive' } },
            { destination: { contains: query, mode: 'insensitive' } },
            { cargoType: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          shipmentNumber: true,
          pickupLocation: true,
          destination: true,
          status: true,
        },
      }),
      prisma.vehicle.findMany({
        where: {
          OR: [
            { vehicleNumber: { contains: query, mode: 'insensitive' } },
            { vehicleType: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          status: true,
        },
      }),
      prisma.driver.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { licenseNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
        },
      }),
      prisma.route.findMany({
        where: {
          id: { contains: query, mode: 'insensitive' },
        },
        take: 3,
        select: {
          id: true,
          status: true,
          distance: true,
        },
      }),
    ]);

    const results = [
      ...shipments.map(s => ({ type: 'shipment' as const, id: s.id, title: s.shipmentNumber, subtitle: `${s.pickupLocation} → ${s.destination}`, status: s.status })),
      ...vehicles.map(v => ({ type: 'vehicle' as const, id: v.id, title: v.vehicleNumber, subtitle: v.vehicleType, status: v.status })),
      ...drivers.map(d => ({ type: 'driver' as const, id: d.id, title: d.name, subtitle: d.phone, status: d.status })),
      ...routes.map(r => ({ type: 'route' as const, id: r.id, title: `Route ${r.id.slice(0, 8)}`, subtitle: `${r.distance} km`, status: r.status })),
    ];

    res.json({ success: true, data: { results } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
