import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';
import type { VehicleLocation, Alert } from '../types';

export function useSocket() {
  const socket = getSocket();
  return socket;
}

export function useVehicleTracking(
  onLocationUpdate: (data: VehicleLocation) => void,
  onAlert?: (alert: Alert) => void
) {
  const socket = getSocket();
  const locationRef = useRef(onLocationUpdate);
  const alertRef = useRef(onAlert);

  locationRef.current = onLocationUpdate;
  if (onAlert) alertRef.current = onAlert;

  useEffect(() => {
    const handleLocation = (data: VehicleLocation) => locationRef.current(data);
    const handleAlert = (alert: Alert) => alertRef.current?.(alert);

    socket.on('vehicle:location', handleLocation);
    socket.on('alert:new', handleAlert);

    return () => {
      socket.off('vehicle:location', handleLocation);
      socket.off('alert:new', handleAlert);
    };
  }, [socket]);
}

export function useShipmentStatus(onStatusUpdate: (data: { shipmentId: string; status: string }) => void) {
  const socket = getSocket();
  const ref = useRef(onStatusUpdate);
  ref.current = onStatusUpdate;

  useEffect(() => {
    const handler = (data: { shipmentId: string; status: string }) => ref.current(data);
    socket.on('shipment:status', handler);
    return () => { socket.off('shipment:status', handler); };
  }, [socket]);
}

export function useNotificationSocket(onNotification: (data: any) => void) {
  const socket = getSocket();
  const ref = useRef(onNotification);
  ref.current = onNotification;

  useEffect(() => {
    const handler = (data: any) => ref.current(data);
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [socket]);
}

export function useRouteUpdate(onRouteUpdate: (data: any) => void) {
  const socket = getSocket();
  const ref = useRef(onRouteUpdate);
  ref.current = onRouteUpdate;

  useEffect(() => {
    const handler = (data: any) => ref.current(data);
    socket.on('route:updated', handler);
    return () => { socket.off('route:updated', handler); };
  }, [socket]);
}
