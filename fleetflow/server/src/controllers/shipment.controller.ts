import { Request, Response } from 'express';
import { prisma } from '../server';
import { io } from '../server';
import { scoreVehiclesForShipment } from '../services/allocation.service';
import { optimizeRoute, rerouteFromPosition } from '../services/optimization.service';
import { startSimulation, simulateDelay, stopSimulation, pauseSimulation, resumeSimulation } from '../services/simulator.service';
import { generateShipmentNumber } from '../utils/helpers';

export async function getShipments(req: Request, res: Response) {
  try {
    const { status, priority, search } = req.query;
    const where: any = {};

    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search as string, mode: 'insensitive' } },
        { pickupLocation: { contains: search as string, mode: 'insensitive' } },
        { destination: { contains: search as string, mode: 'insensitive' } },
        { cargoType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        vehicle: true,
        driver: true,
        route: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: shipments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getShipmentById(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: { include: { driver: true } },
        driver: true,
        route: true,
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, data: shipment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createShipment(req: Request, res: Response) {
  try {
    const {
      pickupLocation, destination,
      pickupLatitude, pickupLongitude,
      destinationLatitude, destinationLongitude,
      cargoType, weight, packageCount,
      priority, deadline,
    } = req.body;

    // Validation
    if (!pickupLocation || !destination) {
      return res.status(400).json({ success: false, message: 'Pickup and destination locations are required' });
    }
    if (!pickupLatitude || !pickupLongitude || !destinationLatitude || !destinationLongitude) {
      return res.status(400).json({ success: false, message: 'Coordinates are required for both locations' });
    }
    if (!weight || parseFloat(weight) <= 0) {
      return res.status(400).json({ success: false, message: 'Weight must be greater than 0' });
    }
    if (!packageCount || parseInt(packageCount) <= 0) {
      return res.status(400).json({ success: false, message: 'Package count must be greater than 0' });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, message: 'Delivery deadline is required' });
    }
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Deadline must be in the future' });
    }

    const shipmentNumber = req.body.shipmentNumber || generateShipmentNumber();

    // Check for duplicate shipment number
    const existing = await prisma.shipment.findUnique({ where: { shipmentNumber } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Shipment number already exists' });
    }

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        pickupLocation,
        destination,
        pickupLatitude: parseFloat(pickupLatitude),
        pickupLongitude: parseFloat(pickupLongitude),
        destinationLatitude: parseFloat(destinationLatitude),
        destinationLongitude: parseFloat(destinationLongitude),
        cargoType: cargoType || 'General',
        weight: parseFloat(weight),
        packageCount: parseInt(packageCount),
        priority: priority || 'MEDIUM',
        deadline: deadlineDate,
      },
    });

    // Create notification
    const dispatchers = await prisma.user.findMany({ where: { role: 'DISPATCHER' } });
    for (const d of dispatchers) {
      await prisma.notification.create({
        data: {
          userId: d.id,
          title: 'Shipment Created',
          message: `${shipment.shipmentNumber} created: ${shipment.pickupLocation} → ${shipment.destination}`,
          type: 'shipment',
          metadata: { shipmentId: shipment.id },
        },
      });
    }

    io.emit('notification:new', {
      title: 'Shipment Created',
      message: `${shipment.shipmentNumber} created`,
      type: 'shipment',
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateShipment(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    if (shipment.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Cannot update a delivered shipment' });
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: req.body,
      include: { vehicle: true, driver: true, route: true },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function allocateVehicle(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const scores = await scoreVehiclesForShipment(shipment.id);
    const eligible = scores.filter(s => s.eligible);

    if (eligible.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable vehicle available for this shipment',
        data: { scores },
      });
    }

    res.json({
      success: true,
      data: {
        recommended: eligible[0],
        alternatives: eligible.slice(1),
        disqualified: scores.filter(s => !s.eligible),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function optimizeShipmentRoute(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (!shipment.vehicle) {
      return res.status(400).json({ success: false, message: 'No vehicle assigned to this shipment' });
    }

    const result = optimizeRoute(
      shipment.pickupLatitude, shipment.pickupLongitude,
      shipment.destinationLatitude, shipment.destinationLongitude,
      shipment.vehicle.latitude, shipment.vehicle.longitude
    );

    // Create or update route
    let route;
    if (shipment.routeId) {
      route = await prisma.route.update({
        where: { id: shipment.routeId },
        data: {
          vehicleId: shipment.vehicleId,
          distance: result.distance,
          estimatedDuration: result.duration,
          optimizedDistance: result.optimizedDistance,
          optimizedDuration: result.optimizedDuration,
          eta: result.eta,
          routePoints: result.routePoints,
          status: 'PLANNED',
        },
      });
    } else {
      route = await prisma.route.create({
        data: {
          vehicleId: shipment.vehicleId,
          distance: result.distance,
          estimatedDuration: result.duration,
          optimizedDistance: result.optimizedDistance,
          optimizedDuration: result.optimizedDuration,
          eta: result.eta,
          routePoints: result.routePoints,
          status: 'PLANNED',
        },
      });

      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { routeId: route.id },
      });
    }

    // Notification
    io.emit('notification:new', {
      title: 'Route Optimized',
      message: `Route for ${shipment.shipmentNumber} optimized. Saved ${result.distanceSaved} km (${result.distanceSavedPercent}%).`,
      type: 'optimization',
    });

    res.json({
      success: true,
      data: {
        route,
        optimization: result,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function assignVehicle(req: Request, res: Response) {
  try {
    const { vehicleId, driverId } = req.body;
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { driver: true },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    if (vehicle.status === 'MAINTENANCE') {
      return res.status(400).json({ success: false, message: 'Vehicle is under maintenance' });
    }
    if (vehicle.capacity - vehicle.currentLoad < shipment.weight) {
      return res.status(400).json({ success: false, message: 'Insufficient vehicle capacity' });
    }

    const assignedDriverId = driverId || vehicle.driverId;

    // Update shipment
    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        vehicleId,
        driverId: assignedDriverId,
        status: 'ASSIGNED',
      },
      include: { vehicle: true, driver: true, route: true },
    });

    // Update vehicle
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: 'ASSIGNED',
        currentLoad: vehicle.currentLoad + shipment.weight,
      },
    });

    // Notifications
    io.emit('shipment:status', { shipmentId: shipment.id, status: 'ASSIGNED' });
    io.emit('notification:new', {
      title: 'Vehicle Assigned',
      message: `${vehicle.vehicleNumber} assigned to ${shipment.shipmentNumber}`,
      type: 'assignment',
    });

    // Notify driver
    if (assignedDriverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: assignedDriverId },
        include: { user: true },
      });
      if (driver?.userId) {
        await prisma.notification.create({
          data: {
            userId: driver.userId,
            title: 'New Assignment',
            message: `You have been assigned shipment ${shipment.shipmentNumber}`,
            type: 'assignment',
            metadata: { shipmentId: shipment.id },
          },
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function startTrip(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true, route: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (!shipment.vehicleId || !shipment.vehicle) {
      return res.status(400).json({ success: false, message: 'No vehicle assigned' });
    }
    if (!shipment.route) {
      return res.status(400).json({ success: false, message: 'No route optimized for this shipment' });
    }

    // Update statuses
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'IN_TRANSIT' },
    });

    await prisma.vehicle.update({
      where: { id: shipment.vehicleId },
      data: { status: 'IN_TRANSIT' },
    });

    if (shipment.driverId) {
      await prisma.driver.update({
        where: { id: shipment.driverId },
        data: { status: 'DRIVING' },
      });
    }

    await prisma.route.update({
      where: { id: shipment.route.id },
      data: { status: 'ACTIVE' },
    });

    // Start GPS simulation
    const routePoints = shipment.route.routePoints as any[];
    if (Array.isArray(routePoints) && routePoints.length > 0) {
      startSimulation(io, shipment.id, shipment.vehicleId, routePoints);
    }

    io.emit('shipment:status', { shipmentId: shipment.id, status: 'IN_TRANSIT' });
    io.emit('vehicle:status', { vehicleId: shipment.vehicleId, status: 'IN_TRANSIT' });
    io.emit('notification:new', {
      title: 'Trip Started',
      message: `${shipment.vehicle.vehicleNumber} started trip for ${shipment.shipmentNumber}`,
      type: 'tracking',
    });

    res.json({ success: true, data: { message: 'Trip started successfully' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deliverShipment(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true, route: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (shipment.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Shipment already delivered' });
    }

    // Stop simulation
    if (shipment.vehicleId) {
      stopSimulation(shipment.vehicleId);
    }

    // Update shipment
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'DELIVERED' },
    });

    // Update vehicle
    if (shipment.vehicleId) {
      await prisma.vehicle.update({
        where: { id: shipment.vehicleId },
        data: {
          status: 'AVAILABLE',
          currentLoad: Math.max(0, (shipment.vehicle?.currentLoad || 0) - shipment.weight),
          latitude: shipment.destinationLatitude,
          longitude: shipment.destinationLongitude,
        },
      });
    }

    // Update driver
    if (shipment.driverId) {
      await prisma.driver.update({
        where: { id: shipment.driverId },
        data: {
          status: 'AVAILABLE',
          tripsCompleted: { increment: 1 },
        },
      });
    }

    // Update route
    if (shipment.routeId) {
      await prisma.route.update({
        where: { id: shipment.routeId },
        data: { status: 'COMPLETED' },
      });
    }

    // Resolve related alerts
    await prisma.alert.updateMany({
      where: { shipmentId: shipment.id, resolved: false },
      data: { resolved: true },
    });

    io.emit('shipment:status', { shipmentId: shipment.id, status: 'DELIVERED' });
    if (shipment.vehicleId) {
      io.emit('vehicle:status', { vehicleId: shipment.vehicleId, status: 'AVAILABLE' });
    }
    io.emit('notification:new', {
      title: 'Shipment Delivered',
      message: `${shipment.shipmentNumber} delivered successfully!`,
      type: 'delivery',
    });

    res.json({ success: true, data: { message: 'Shipment delivered successfully' } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateShipmentStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status },
      include: { vehicle: true, driver: true, route: true },
    });

    io.emit('shipment:status', { shipmentId: shipment.id, status });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function simulateShipmentDelay(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, route: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }
    if (!shipment.vehicleId || !shipment.vehicle) {
      return res.status(400).json({ success: false, message: 'No vehicle assigned' });
    }

    // Simulate delay in the GPS simulator
    const delayResult = simulateDelay(io, shipment.vehicleId);
    const currentLat = delayResult?.currentLat || shipment.vehicle.latitude;
    const currentLng = delayResult?.currentLng || shipment.vehicle.longitude;

    // Mark shipment as delayed
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'DELAYED' },
    });

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        vehicleId: shipment.vehicleId,
        shipmentId: shipment.id,
        type: 'DELAY_RISK',
        severity: 'WARNING',
        message: `Traffic/roadblock detected. ${shipment.shipmentNumber} experiencing delay.`,
      },
    });

    io.emit('alert:new', alert);
    io.emit('shipment:status', { shipmentId: shipment.id, status: 'DELAYED' });

    // Run rerouting
    const remainingDuration = shipment.route?.optimizedDuration || shipment.route?.estimatedDuration || 300;
    const reroute = rerouteFromPosition(
      currentLat, currentLng,
      shipment.destinationLatitude, shipment.destinationLongitude,
      remainingDuration
    );

    // Update route with rerouted data
    if (shipment.routeId) {
      await prisma.route.update({
        where: { id: shipment.routeId },
        data: {
          optimizedDistance: reroute.optimizedDistance,
          optimizedDuration: reroute.optimizedDuration,
          eta: reroute.eta,
          routePoints: reroute.routePoints,
          status: 'DEVIATED',
        },
      });
    }

    // Resume shipment as in-transit with new route
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'IN_TRANSIT' },
    });

    io.emit('route:updated', {
      shipmentId: shipment.id,
      routePoints: reroute.routePoints,
    });
    io.emit('shipment:status', { shipmentId: shipment.id, status: 'IN_TRANSIT' });

    // Restart simulation with new route
    if (shipment.vehicleId && reroute.routePoints.length > 0) {
      startSimulation(io, shipment.id, shipment.vehicleId, reroute.routePoints);
    }

    res.json({
      success: true,
      data: {
        alert,
        reroute: {
          originalEta: new Date(Date.now() + remainingDuration * 60000 * 1.2).toISOString(),
          newEta: reroute.eta.toISOString(),
          distanceSaved: reroute.distanceSaved,
          timeSaved: reroute.timeSaved,
          distanceSavedPercent: reroute.distanceSavedPercent,
          timeSavedPercent: reroute.timeSavedPercent,
        },
        routePoints: reroute.routePoints,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDriverShipment(req: Request, res: Response) {
  try {
    const { driverId } = req.params;

    const shipment = await prisma.shipment.findFirst({
      where: {
        driverId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'ARRIVING'] },
      },
      include: {
        vehicle: true,
        driver: true,
        route: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'No active shipment found for this driver' });
    }

    res.json({ success: true, data: shipment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function controlSimulation(req: Request, res: Response) {
  try {
    const { action, vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    let result = false;
    switch (action) {
      case 'pause':
        result = pauseSimulation(vehicleId);
        break;
      case 'resume':
        result = resumeSimulation(vehicleId);
        break;
      case 'stop':
        result = stopSimulation(vehicleId);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action. Use: pause, resume, stop' });
    }

    res.json({ success: true, data: { action, vehicleId, result } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
