import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../server';
import { haversineDistance, distanceFromRoute } from '../utils/helpers';

interface SimulationState {
  shipmentId: string;
  vehicleId: string;
  routePoints: { latitude: number; longitude: number }[];
  currentIndex: number;
  isPaused: boolean;
  intervalId: NodeJS.Timeout | null;
  speed: number;
  isMoving: boolean;
}

const activeSimulations = new Map<string, SimulationState>();

/**
 * Vehicle GPS Simulator Service
 * Simulates vehicle movement along route points, emitting Socket.IO events.
 */
export function startSimulation(
  io: SocketIOServer,
  shipmentId: string,
  vehicleId: string,
  routePoints: { latitude: number; longitude: number }[]
) {
  // Stop existing simulation for this vehicle
  stopSimulation(vehicleId);

  const state: SimulationState = {
    shipmentId,
    vehicleId,
    routePoints,
    currentIndex: 0,
    isPaused: false,
    intervalId: null,
    speed: 55 + Math.random() * 20,
    isMoving: false,
  };

  const moveVehicle = async () => {
    if (state.isMoving || activeSimulations.get(vehicleId) !== state) return;
    state.isMoving = true;
    if (state.isPaused || state.currentIndex >= state.routePoints.length) {
      if (state.currentIndex >= state.routePoints.length) {
        stopSimulation(vehicleId);
        io.emit('simulation:complete', { vehicleId, shipmentId });
      }
      state.isMoving = false;
      return;
    }

    const point = state.routePoints[state.currentIndex];
    state.speed = 40 + Math.random() * 35; // Vary speed between 40-75 km/h

    // Update vehicle position in database
    try {
      if (activeSimulations.get(vehicleId) !== state) return;
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          latitude: point.latitude,
          longitude: point.longitude,
        },
      });

      // Create tracking event (throttled - every 3rd point)
      if (state.currentIndex % 3 === 0) {
        await prisma.trackingEvent.create({
          data: {
            vehicleId,
            shipmentId,
            latitude: point.latitude,
            longitude: point.longitude,
            speed: state.speed,
          },
        });
      }

      // Calculate progress
      const progress = Math.round((state.currentIndex / (state.routePoints.length - 1)) * 100);
      const remainingPoints = state.routePoints.length - state.currentIndex - 1;
      let remainingDistance = 0;
      for (let i = state.currentIndex; i < state.routePoints.length - 1; i++) {
        remainingDistance += haversineDistance(
          state.routePoints[i].latitude, state.routePoints[i].longitude,
          state.routePoints[i + 1].latitude, state.routePoints[i + 1].longitude
        );
      }

      const etaMinutes = remainingDistance / (state.speed / 60);
      const eta = new Date(Date.now() + etaMinutes * 60000);

      // Emit location update
      io.emit('vehicle:location', {
        vehicleId,
        shipmentId,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: Math.round(state.speed),
        progress,
        remainingDistance: Math.round(remainingDistance),
        eta: eta.toISOString(),
        heading: state.currentIndex < state.routePoints.length - 1
          ? calculateHeading(point, state.routePoints[state.currentIndex + 1])
          : 0,
      });

      // Check for route deviation (compare with planned route)
      // Only check occasionally to avoid spam
      if (state.currentIndex % 5 === 0 && state.currentIndex > 0) {
        const shipment = await prisma.shipment.findUnique({
          where: { id: shipmentId },
          include: { route: true },
        });

        if (shipment?.route) {
          const routePts = shipment.route.routePoints as any[];
          if (Array.isArray(routePts) && routePts.length > 0) {
            const deviation = distanceFromRoute(point.latitude, point.longitude, routePts);
            if (deviation > 5) { // More than 5 km from route
              const alert = await prisma.alert.create({
                data: {
                  vehicleId,
                  shipmentId,
                  type: 'ROUTE_DEVIATION',
                  severity: deviation > 10 ? 'CRITICAL' : 'WARNING',
                  message: `Vehicle is ${Math.round(deviation)} km away from the planned route.`,
                },
              });
              io.emit('alert:new', alert);
            }
          }
        }

        // Check deadline
        if (shipment?.deadline) {
          if (eta > shipment.deadline) {
            const existingAlert = await prisma.alert.findFirst({
              where: {
                shipmentId,
                type: 'DELAY_RISK',
                resolved: false,
                createdAt: { gte: new Date(Date.now() - 300000) }, // within 5 min
              },
            });
            if (!existingAlert) {
              await prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: 'DELAYED' },
              });
              const alert = await prisma.alert.create({
                data: {
                  vehicleId,
                  shipmentId,
                  type: 'DELAY_RISK',
                  severity: 'WARNING',
                  message: `Delivery deadline at risk. Current ETA: ${eta.toLocaleTimeString()}, Deadline: ${shipment.deadline.toLocaleTimeString()}.`,
                },
              });
              io.emit('alert:new', alert);
              io.emit('shipment:status', { shipmentId, status: 'DELAYED' });
            }
          }
        }
      }

      state.currentIndex++;
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      state.isMoving = false;
    }
  };

  // Move every 2 seconds
  state.intervalId = setInterval(moveVehicle, 2000);
  activeSimulations.set(vehicleId, state);

  // Initial position emit
  moveVehicle();
}

export function pauseSimulation(vehicleId: string): boolean {
  const state = activeSimulations.get(vehicleId);
  if (state) {
    state.isPaused = true;
    return true;
  }
  return false;
}

export function resumeSimulation(vehicleId: string): boolean {
  const state = activeSimulations.get(vehicleId);
  if (state) {
    state.isPaused = false;
    return true;
  }
  return false;
}

export function stopSimulation(vehicleId: string): boolean {
  const state = activeSimulations.get(vehicleId);
  if (state) {
    if (state.intervalId) clearInterval(state.intervalId);
    activeSimulations.delete(vehicleId);
    return true;
  }
  return false;
}

export function stopAllSimulations(): void {
  for (const vehicleId of activeSimulations.keys()) {
    stopSimulation(vehicleId);
  }
}

export function getSimulationState(vehicleId: string): SimulationState | undefined {
  return activeSimulations.get(vehicleId);
}

export function simulateDelay(
  io: SocketIOServer,
  vehicleId: string
): { currentLat: number; currentLng: number; progress: number } | null {
  const state = activeSimulations.get(vehicleId);
  if (!state) return null;

  // Pause simulation briefly to simulate traffic/roadblock
  state.isPaused = true;
  state.speed = 10 + Math.random() * 15; // Slow down dramatically

  const currentPoint = state.routePoints[state.currentIndex] || state.routePoints[state.currentIndex - 1];
  const progress = Math.round((state.currentIndex / (state.routePoints.length - 1)) * 100);

  // Resume after 3 seconds with slower speed
  setTimeout(() => {
    if (activeSimulations.has(vehicleId)) {
      state.isPaused = false;
    }
  }, 3000);

  return {
    currentLat: currentPoint?.latitude || 0,
    currentLng: currentPoint?.longitude || 0,
    progress,
  };
}

function calculateHeading(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const dLng = (to.longitude - from.longitude) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(to.latitude * Math.PI / 180);
  const x = Math.cos(from.latitude * Math.PI / 180) * Math.sin(to.latitude * Math.PI / 180) -
    Math.sin(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}
