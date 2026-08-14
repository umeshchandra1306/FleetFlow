/**
 * Haversine distance between two lat/lng points in kilometers
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Generate intermediate route points between two coordinates.
 * Adds realistic road curvature with slight jitter.
 */
export function generateRoutePoints(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  numPoints: number = 25
): { latitude: number; longitude: number }[] {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const jitterLat = i > 0 && i < numPoints ? (Math.random() - 0.5) * 0.015 : 0;
    const jitterLng = i > 0 && i < numPoints ? (Math.random() - 0.5) * 0.015 : 0;
    points.push({
      latitude: startLat + (endLat - startLat) * t + jitterLat,
      longitude: startLng + (endLng - startLng) * t + jitterLng,
    });
  }
  return points;
}

/**
 * Estimate travel duration in minutes based on distance in km.
 * Accounts for road conditions with a factor.
 */
export function estimateDuration(distanceKm: number, avgSpeedKmh: number = 55): number {
  const roadFactor = 1.15; // Roads are ~15% longer than straight line
  return Math.round((distanceKm * roadFactor / avgSpeedKmh) * 60);
}

/**
 * Generate a shipment number
 */
export function generateShipmentNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SH-${num}`;
}

/**
 * Distance from a point to a line segment (for route deviation detection)
 */
export function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    return haversineDistance(px, py, ax, ay);
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const nearestLat = ax + t * dx;
  const nearestLng = ay + t * dy;
  return haversineDistance(px, py, nearestLat, nearestLng);
}

/**
 * Find minimum distance from a point to any segment in a route
 */
export function distanceFromRoute(
  lat: number, lng: number,
  routePoints: { latitude: number; longitude: number }[]
): number {
  let minDist = Infinity;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const d = pointToSegmentDistance(
      lat, lng,
      routePoints[i].latitude, routePoints[i].longitude,
      routePoints[i + 1].latitude, routePoints[i + 1].longitude
    );
    minDist = Math.min(minDist, d);
  }
  return minDist;
}
