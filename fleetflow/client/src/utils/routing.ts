export interface LatLng {
  lat: number;
  lng: number;
}

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

/**
 * Fetches a driving route from the OSRM public API and returns Leaflet-ready [lat, lng] pairs.
 */
export async function fetchRoadRoute(
  start: LatLng,
  end: LatLng,
): Promise<[number, number][]> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM routing failed: ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const coordinates = data.routes?.[0]?.geometry?.coordinates;

  if (data.code !== 'Ok' || !coordinates?.length) {
    return [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ];
  }

  return coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
}
