export interface User {
  id: string;
  email: string;
  name: string;
  role: 'DISPATCHER' | 'DRIVER';
  driverId?: string | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'AVAILABLE' | 'DRIVING' | 'OFFLINE' | 'ON_BREAK';
  rating: number;
  tripsCompleted: number;
  userId?: string | null;
  vehicle?: Vehicle | null;
  shipments?: Shipment[];
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  currentLoad: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'IDLE' | 'MAINTENANCE' | 'OFFLINE';
  latitude: number;
  longitude: number;
  fuelType: string;
  driverId?: string | null;
  driver?: Driver | null;
  shipments?: Shipment[];
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  pickupLocation: string;
  destination: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  cargoType: string;
  weight: number;
  packageCount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELAYED' | 'ARRIVING' | 'DELIVERED' | 'CANCELLED';
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  driverId?: string | null;
  driver?: Driver | null;
  routeId?: string | null;
  route?: Route | null;
  trackingEvents?: TrackingEvent[];
  alerts?: Alert[];
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  shipment?: Shipment | null;
  distance: number;
  estimatedDuration: number;
  optimizedDistance?: number | null;
  optimizedDuration?: number | null;
  eta?: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'DEVIATED';
  routePoints: { latitude: number; longitude: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  vehicleId: string;
  shipmentId?: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  shipmentId?: string | null;
  shipment?: Shipment | null;
  type: 'ROUTE_DEVIATION' | 'DELAY_RISK' | 'LOW_PROGRESS' | 'VEHICLE_OFFLINE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  resolved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

export interface AllocationScore {
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

export interface OptimizationResult {
  distance: number;
  duration: number;
  optimizedDistance: number;
  optimizedDuration: number;
  distanceSaved: number;
  distanceSavedPercent: number;
  timeSaved: number;
  timeSavedPercent: number;
  eta: string;
  routePoints: { latitude: number; longitude: number }[];
}

export interface DashboardData {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    activeShipments: number;
    delayedShipments: number;
    fleetUtilization: number;
    onTimeRate: number;
    totalVehicles: number;
    totalShipments: number;
    pendingShipments: number;
    deliveredShipments: number;
    maintenanceVehicles: number;
  };
  activeShipments: Shipment[];
  alerts: Alert[];
  vehicles: Vehicle[];
}

export interface SearchResult {
  type: 'shipment' | 'vehicle' | 'driver' | 'route';
  id: string;
  title: string;
  subtitle: string;
  status: string;
}

export interface VehicleLocation {
  vehicleId: string;
  shipmentId: string;
  latitude: number;
  longitude: number;
  speed: number;
  progress: number;
  remainingDistance: number;
  eta: string;
  heading: number;
}
