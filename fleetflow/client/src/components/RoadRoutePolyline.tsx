import { useEffect, useState } from 'react';
import { Polyline } from 'react-leaflet';
import { fetchRoadRoute, type LatLng } from '../utils/routing';

interface RoadRoutePolylineProps {
  start: LatLng;
  end: LatLng;
  color?: string;
  weight?: number;
  opacity?: number;
}

export default function RoadRoutePolyline({
  start,
  end,
  color = '#4f46e5',
  weight = 4,
  opacity = 0.8,
}: RoadRoutePolylineProps) {
  const [positions, setPositions] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchRoadRoute(start, end)
      .then((route) => {
        if (!cancelled) setPositions(route);
      })
      .catch(() => {
        if (!cancelled) {
          setPositions([
            [start.lat, start.lng],
            [end.lat, end.lng],
          ]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [start.lat, start.lng, end.lat, end.lng]);

  if (positions.length === 0) return null;

  return <Polyline positions={positions} color={color} weight={weight} opacity={opacity} />;
}
