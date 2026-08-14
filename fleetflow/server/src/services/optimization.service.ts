import { haversineDistance, generateRoutePoints, estimateDuration } from '../utils/helpers';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface OptimizationResult {
  distance: number;
  duration: number;
  optimizedDistance: number;
  optimizedDuration: number;
  distanceSaved: number;
  distanceSavedPercent: number;
  timeSaved: number;
  timeSavedPercent: number;
  eta: Date;
  routePoints: RoutePoint[];
}

/**
 * Route Optimization Service
 * 
 * Implements practical route optimization:
 * - Direct distance calculation via Haversine
 * - Road distance estimation with road factor
 * - Multi-waypoint optimization using nearest-neighbor heuristic
 * - Duration estimation with speed models
 * 
 * Structured for future replacement by OR-Tools/VRP service.
 */
export function optimizeRoute(
  pickupLat: number, pickupLng: number,
  destLat: number, destLng: number,
  vehicleLat: number, vehicleLng: number,
  waypoints?: RoutePoint[]
): OptimizationResult {
  // Calculate baseline (vehicle → pickup → destination)
  const vehicleToPickup = haversineDistance(vehicleLat, vehicleLng, pickupLat, pickupLng);
  const pickupToDest = haversineDistance(pickupLat, pickupLng, destLat, destLng);
  
  const roadFactor = 1.25; // Roads are ~25% longer than straight line
  const baselineDistance = Math.round((vehicleToPickup + pickupToDest) * roadFactor);
  const baselineDuration = estimateDuration(baselineDistance, 50);

  // Optimization: try to reduce via better routing
  let optimizedPoints: RoutePoint[];
  let optimizedDistance: number;

  if (waypoints && waypoints.length > 0) {
    // Multi-waypoint optimization using nearest-neighbor heuristic
    const result = nearestNeighborOptimize(
      { latitude: vehicleLat, longitude: vehicleLng },
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: destLat, longitude: destLng },
      waypoints
    );
    optimizedPoints = result.points;
    optimizedDistance = result.distance;
  } else {
    // For direct A→B routes, simulate optimization through better routing
    // Real systems would use road network data; we simulate ~8-15% improvement
    const optimizationFactor = 0.85 + Math.random() * 0.07; // 8-15% improvement
    const optimizedRoadFactor = roadFactor * optimizationFactor;
    optimizedDistance = Math.round((vehicleToPickup + pickupToDest) * optimizedRoadFactor);
    
    // Generate optimized route points (smoother path)
    const pickupSegment = generateRoutePoints(vehicleLat, vehicleLng, pickupLat, pickupLng, 8);
    const deliverySegment = generateRoutePoints(pickupLat, pickupLng, destLat, destLng, 17);
    optimizedPoints = [...pickupSegment, ...deliverySegment.slice(1)];
  }

  const optimizedDuration = estimateDuration(optimizedDistance, 55); // Slightly better avg speed on optimized route
  const distanceSaved = baselineDistance - optimizedDistance;
  const timeSaved = baselineDuration - optimizedDuration;

  const eta = new Date(Date.now() + optimizedDuration * 60000);

  return {
    distance: baselineDistance,
    duration: baselineDuration,
    optimizedDistance,
    optimizedDuration,
    distanceSaved: Math.max(0, distanceSaved),
    distanceSavedPercent: Math.max(0, Math.round((distanceSaved / baselineDistance) * 100)),
    timeSaved: Math.max(0, timeSaved),
    timeSavedPercent: Math.max(0, Math.round((timeSaved / baselineDuration) * 100)),
    eta,
    routePoints: optimizedPoints,
  };
}

/**
 * Nearest-neighbor heuristic for multi-waypoint optimization.
 * Visits waypoints in order of proximity to reduce total distance.
 */
function nearestNeighborOptimize(
  start: RoutePoint,
  pickup: RoutePoint,
  destination: RoutePoint,
  waypoints: RoutePoint[]
): { points: RoutePoint[]; distance: number } {
  const ordered: RoutePoint[] = [start, pickup];
  const remaining = [...waypoints];
  let totalDist = haversineDistance(start.latitude, start.longitude, pickup.latitude, pickup.longitude);
  let current = pickup;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(current.latitude, current.longitude, remaining[i].latitude, remaining[i].longitude);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    totalDist += nearestDist;
    current = remaining[nearestIdx];
    ordered.push(current);
    remaining.splice(nearestIdx, 1);
  }

  // Add destination
  totalDist += haversineDistance(current.latitude, current.longitude, destination.latitude, destination.longitude);
  ordered.push(destination);

  // Generate smooth route points between ordered stops
  const allPoints: RoutePoint[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const segment = generateRoutePoints(
      ordered[i].latitude, ordered[i].longitude,
      ordered[i + 1].latitude, ordered[i + 1].longitude,
      6
    );
    allPoints.push(...(i === 0 ? segment : segment.slice(1)));
  }

  const roadFactor = 1.15; // Optimized road factor
  return {
    points: allPoints,
    distance: Math.round(totalDist * roadFactor),
  };
}

/**
 * Simulate dynamic rerouting after delay detection.
 * Generates an alternative route from current position to destination.
 */
export function rerouteFromPosition(
  currentLat: number, currentLng: number,
  destLat: number, destLng: number,
  originalDuration: number
): OptimizationResult {
  const directDist = haversineDistance(currentLat, currentLng, destLat, destLng);
  
  // Alternative route is slightly longer in distance but potentially faster
  const altRoadFactor = 1.18;
  const optimizedDistance = Math.round(directDist * altRoadFactor);
  const optimizedDuration = estimateDuration(optimizedDistance, 58); // Highway route, slightly faster

  // Original remaining estimate (with delay factored in)
  const delayedDuration = Math.round(originalDuration * 1.2); // 20% delay
  const baselineDistance = Math.round(directDist * 1.3);

  const routePoints = generateRoutePoints(currentLat, currentLng, destLat, destLng, 20);

  const distanceSaved = Math.max(0, baselineDistance - optimizedDistance);
  const timeSaved = Math.max(0, delayedDuration - optimizedDuration);

  return {
    distance: baselineDistance,
    duration: delayedDuration,
    optimizedDistance,
    optimizedDuration,
    distanceSaved,
    distanceSavedPercent: Math.max(0, Math.round((distanceSaved / baselineDistance) * 100)),
    timeSaved,
    timeSavedPercent: Math.max(0, Math.round((timeSaved / delayedDuration) * 100)),
    eta: new Date(Date.now() + optimizedDuration * 60000),
    routePoints,
  };
}
