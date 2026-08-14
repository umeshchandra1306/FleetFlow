import { prisma } from '../server';
import { haversineDistance } from '../utils/helpers';

interface AllocationScore {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  currentLoad: number;
  availableCapacity: number;
  distanceToPickup: number;
  driverName: string | null;
  driverId: string | null;
  totalScore: number;
  capacityScore: number;
  distanceScore: number;
  availabilityScore: number;
  deadlineScore: number;
  reasons: string[];
  eligible: boolean;
  disqualifyReason?: string;
}

/**
 * Smart Vehicle Allocation Service
 * Scores vehicles based on capacity, distance, availability, and deadline feasibility.
 */
export async function scoreVehiclesForShipment(shipmentId: string): Promise<AllocationScore[]> {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new Error('Shipment not found');

  const vehicles = await prisma.vehicle.findMany({
    include: { driver: true },
  });

  const scores: AllocationScore[] = [];

  for (const vehicle of vehicles) {
    const availableCapacity = vehicle.capacity - vehicle.currentLoad;
    const distanceToPickup = haversineDistance(
      vehicle.latitude, vehicle.longitude,
      shipment.pickupLatitude, shipment.pickupLongitude
    );

    // Disqualification checks
    let eligible = true;
    let disqualifyReason: string | undefined;

    if (vehicle.status === 'MAINTENANCE') {
      eligible = false;
      disqualifyReason = 'Vehicle is under maintenance';
    } else if (vehicle.status === 'OFFLINE') {
      eligible = false;
      disqualifyReason = 'Vehicle is offline';
    } else if (vehicle.status === 'IN_TRANSIT') {
      eligible = false;
      disqualifyReason = 'Vehicle is currently in transit';
    } else if (availableCapacity < shipment.weight) {
      eligible = false;
      disqualifyReason = `Insufficient capacity: ${availableCapacity.toFixed(1)}t available, ${shipment.weight}t needed`;
    } else if (!vehicle.driver) {
      eligible = false;
      disqualifyReason = 'No driver assigned to vehicle';
    } else if (vehicle.driver.status === 'DRIVING') {
      eligible = false;
      disqualifyReason = 'Driver is currently driving another shipment';
    } else if (vehicle.driver.status === 'OFFLINE') {
      eligible = false;
      disqualifyReason = 'Driver is offline';
    }

    // ── Capacity Score (0-30) ──
    let capacityScore = 0;
    if (eligible) {
      const utilization = shipment.weight / vehicle.capacity;
      if (utilization >= 0.7 && utilization <= 1.0) {
        capacityScore = 30; // Best fit
      } else if (utilization >= 0.5) {
        capacityScore = 25;
      } else if (utilization >= 0.3) {
        capacityScore = 18;
      } else {
        capacityScore = 10; // Oversized vehicle
      }
    }

    // ── Distance Score (0-25) ──
    let distanceScore = 0;
    if (eligible) {
      if (distanceToPickup < 50) distanceScore = 25;
      else if (distanceToPickup < 100) distanceScore = 22;
      else if (distanceToPickup < 200) distanceScore = 18;
      else if (distanceToPickup < 400) distanceScore = 12;
      else if (distanceToPickup < 600) distanceScore = 8;
      else distanceScore = 4;
    }

    // ── Availability Score (0-20) ──
    let availabilityScore = 0;
    if (eligible) {
      if (vehicle.status === 'AVAILABLE') availabilityScore = 20;
      else if (vehicle.status === 'IDLE') availabilityScore = 15;
      else if (vehicle.status === 'ASSIGNED') availabilityScore = 8;
    }

    // ── Deadline Score (0-25) ──
    let deadlineScore = 0;
    if (eligible) {
      const hoursToDeadline = (shipment.deadline.getTime() - Date.now()) / 3600000;
      const estimatedTravelHours = (distanceToPickup + haversineDistance(
        shipment.pickupLatitude, shipment.pickupLongitude,
        shipment.destinationLatitude, shipment.destinationLongitude
      )) / 55; // avg speed 55 km/h

      const timeBuffer = hoursToDeadline - estimatedTravelHours;
      if (timeBuffer > 3) deadlineScore = 25;
      else if (timeBuffer > 2) deadlineScore = 22;
      else if (timeBuffer > 1) deadlineScore = 18;
      else if (timeBuffer > 0.5) deadlineScore = 12;
      else if (timeBuffer > 0) deadlineScore = 5;
      else {
        deadlineScore = 0;
        eligible = false;
        disqualifyReason = 'Cannot meet delivery deadline';
      }
    }

    const totalScore = capacityScore + distanceScore + availabilityScore + deadlineScore;

    // Build reasons
    const reasons: string[] = [];
    if (eligible) {
      if (capacityScore >= 25) reasons.push('Excellent capacity match');
      else if (capacityScore >= 18) reasons.push('Good capacity match');
      else reasons.push('Sufficient capacity');

      if (distanceScore >= 22) reasons.push('Closest suitable vehicle');
      else if (distanceScore >= 18) reasons.push('Reasonably close to pickup');
      else reasons.push('Moderate distance to pickup');

      if (availabilityScore >= 20) reasons.push('Available now');
      else if (availabilityScore >= 15) reasons.push('Idle - can be dispatched');

      if (deadlineScore >= 22) reasons.push('Can comfortably meet deadline');
      else if (deadlineScore >= 12) reasons.push('Can meet deadline with buffer');
      else reasons.push('Tight deadline - feasible');
    }

    scores.push({
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      currentLoad: vehicle.currentLoad,
      availableCapacity,
      distanceToPickup: Math.round(distanceToPickup),
      driverName: vehicle.driver?.name || null,
      driverId: vehicle.driver?.id || null,
      totalScore: eligible ? totalScore : 0,
      capacityScore,
      distanceScore,
      availabilityScore,
      deadlineScore,
      reasons,
      eligible,
      disqualifyReason,
    });
  }

  // Sort: eligible first, then by score descending
  scores.sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return b.totalScore - a.totalScore;
  });

  return scores;
}
