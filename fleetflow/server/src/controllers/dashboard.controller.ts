import { Request, Response } from 'express';
import { prisma } from '../server';

export async function getDashboard(req: Request, res: Response) {
  try {
    const [
      totalVehicles,
      availableVehicles,
      inTransitVehicles,
      maintenanceVehicles,
      totalShipments,
      activeShipments,
      delayedShipments,
      deliveredShipments,
      pendingShipments,
      recentAlerts,
      activeShipmentsList,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_TRANSIT' } }),
      prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING'] } } }),
      prisma.shipment.count({ where: { status: 'DELAYED' } }),
      prisma.shipment.count({ where: { status: 'DELIVERED' } }),
      prisma.shipment.count({ where: { status: 'PENDING' } }),
      prisma.alert.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { vehicle: true, shipment: true },
      }),
      prisma.shipment.findMany({
        where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'ARRIVING'] } },
        include: {
          vehicle: true,
          driver: true,
          route: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    // Fleet utilization
    const fleetUtilization = totalVehicles > 0
      ? Math.round(((inTransitVehicles + (totalVehicles - availableVehicles - maintenanceVehicles)) / totalVehicles) * 100)
      : 0;

    // On-time delivery rate
    const onTimeRate = deliveredShipments > 0
      ? Math.round((deliveredShipments / (deliveredShipments + delayedShipments)) * 100)
      : 100;

    // Get vehicles with positions for map
    const vehiclesForMap = await prisma.vehicle.findMany({
      where: { status: { not: 'OFFLINE' } },
      include: { driver: true },
    });

    res.json({
      success: true,
      data: {
        kpis: {
          activeVehicles: inTransitVehicles,
          availableVehicles,
          activeShipments,
          delayedShipments,
          fleetUtilization,
          onTimeRate,
          totalVehicles,
          totalShipments,
          pendingShipments,
          deliveredShipments,
          maintenanceVehicles,
        },
        activeShipments: activeShipmentsList,
        alerts: recentAlerts,
        vehicles: vehiclesForMap,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
