import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { routeAPI } from '../services/api';
import type { Route } from '../types';
import {
  ArrowLeft,
  Route as RouteIcon,
  Truck,
  Package,
  Clock,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  TrendingDown,
  Timer,
  Milestone,
  Info,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DEVIATED: 'bg-red-100 text-red-700',
};

const shipmentStatusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  PICKED_UP: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  DELAYED: 'bg-red-100 text-red-700',
  ARRIVING: 'bg-violet-100 text-violet-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['route', id],
    queryFn: () => routeAPI.get(id!),
    enabled: !!id,
  });

  const route: Route | undefined = data?.data?.data;

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="shimmer h-10 w-10 rounded-lg"></div>
          <div className="shimmer h-8 w-48 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="shimmer h-64 rounded-xl"></div>
          <div className="shimmer h-64 rounded-xl"></div>
          <div className="shimmer h-80 rounded-xl lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 mb-2">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Route Not Found</h2>
          <p className="text-gray-500">The route you are looking for does not exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/routes')}
            className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Routes
          </button>
        </div>
      </div>
    );
  }

  const shipment = route.shipment;
  const vehicle = route.vehicle;
  const driver = vehicle?.driver;
  const routePoints = Array.isArray(route.routePoints) ? route.routePoints : [];
  const hasOptimization = route.optimizedDistance != null && route.optimizedDuration != null;
  const distanceSaved = hasOptimization ? route.distance - route.optimizedDistance! : 0;
  const distanceSavedPercent = hasOptimization && route.distance > 0 ? (distanceSaved / route.distance) * 100 : 0;
  const timeSaved = hasOptimization ? route.estimatedDuration - route.optimizedDuration! : 0;
  const timeSavedPercent = hasOptimization && route.estimatedDuration > 0 ? (timeSaved / route.estimatedDuration) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/routes')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Route Details</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[route.status] || 'bg-gray-100 text-gray-700'}`}>
              {route.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {shipment ? `Shipment ${shipment.shipmentNumber}` : 'No shipment linked'}
            {' • '}
            Created {new Date(route.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <MapPin size={16} />
            <span className="text-xs font-medium uppercase">Distance</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatDistance(route.distance)}</p>
          {hasOptimization && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Optimized: {formatDistance(route.optimizedDistance!)}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Timer size={16} />
            <span className="text-xs font-medium uppercase">Duration</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatDuration(route.estimatedDuration)}</p>
          {hasOptimization && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Optimized: {formatDuration(route.optimizedDuration!)}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Clock size={16} />
            <span className="text-xs font-medium uppercase">ETA</span>
          </div>
          {route.eta ? (
            <div>
              <p className="text-xl font-bold text-gray-900">
                {new Date(route.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500 mt-1">{new Date(route.eta).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-gray-400">—</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Milestone size={16} />
            <span className="text-xs font-medium uppercase">Route Points</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{routePoints.length}</p>
          <p className="text-xs text-gray-500 mt-1">waypoints</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Package size={20} className="mr-2 text-primary-500" />
            Shipment
          </h2>

          {shipment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{shipment.shipmentNumber}</h3>
                  <p className="text-sm text-gray-500 capitalize mt-0.5">{shipment.cargoType?.toLowerCase()}, {shipment.weight} kg</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[shipment.priority] || 'bg-gray-100 text-gray-600'}`}>
                    {shipment.priority}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${shipmentStatusColors[shipment.status] || 'bg-gray-100 text-gray-700'}`}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-emerald-100 p-1 rounded-full">
                    <MapPin size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm text-gray-900 font-medium">{shipment.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 bg-red-100 p-1 rounded-full">
                    <MapPin size={12} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="text-sm text-gray-900 font-medium">{shipment.destination}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/shipments/${shipment.id}`)}
                className="w-full py-2 text-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
              >
                View Shipment Details
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="bg-gray-50 p-4 rounded-full">
                <Package size={32} className="text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">No Shipment Linked</p>
                <p className="text-sm text-gray-500">This route is not associated with any shipment.</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle & Driver Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Truck size={20} className="mr-2 text-primary-500" />
            Vehicle & Driver
          </h2>

          {vehicle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{vehicle.vehicleNumber}</h3>
                  <p className="text-sm text-gray-500 capitalize mt-0.5">{vehicle.vehicleType.toLowerCase().replace('_', ' ')}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  vehicle.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                  vehicle.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                  vehicle.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {vehicle.status.replace('_', ' ')}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100">
                {driver ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned Driver</p>
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{driver.phone}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      driver.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                      driver.status === 'DRIVING' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {driver.status.replace('_', ' ')}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No driver assigned to this vehicle</p>
                )}
              </div>

              <button
                onClick={() => navigate(`/fleet/${vehicle.id}`)}
                className="w-full py-2 text-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
              >
                View Vehicle Details
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="bg-gray-50 p-4 rounded-full">
                <Truck size={32} className="text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">No Vehicle Assigned</p>
                <p className="text-sm text-gray-500">This route does not have a vehicle assigned.</p>
              </div>
            </div>
          )}
        </div>

        {/* Optimization Results */}
        {hasOptimization && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <TrendingDown size={20} className="mr-2 text-emerald-500" />
              Route Optimization Results
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Original Distance</p>
                <p className="text-lg font-bold text-gray-900">{formatDistance(route.distance)}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-emerald-600 mb-1">Optimized Distance</p>
                <p className="text-lg font-bold text-emerald-700">{formatDistance(route.optimizedDistance!)}</p>
                {distanceSaved > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">Saved {distanceSavedPercent.toFixed(1)}%</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Original Duration</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(route.estimatedDuration)}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-emerald-600 mb-1">Optimized Duration</p>
                <p className="text-lg font-bold text-emerald-700">{formatDuration(route.optimizedDuration!)}</p>
                {timeSaved > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">Saved {timeSavedPercent.toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Route Deviation Info */}
        {route.status === 'DEVIATED' && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 space-y-3 lg:col-span-2">
            <h2 className="text-lg font-bold text-red-700 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Route Deviation Detected
            </h2>
            <p className="text-sm text-gray-600">
              This route has deviated from the planned path. The vehicle may have taken an alternate route or encountered an unexpected situation.
            </p>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                DEVIATED
              </span>
              <span className="text-xs text-gray-500">
                Last updated: {new Date(route.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Route Points */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Navigation size={20} className="mr-2 text-primary-500" />
              Route Points ({routePoints.length})
            </h2>
          </div>

          {routePoints.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Route Points</h3>
              <p className="text-sm text-gray-500">Route points will appear here once the route is optimized.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">#</th>
                    <th className="px-5 py-3.5 font-medium">Latitude</th>
                    <th className="px-5 py-3.5 font-medium">Longitude</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routePoints.slice(0, 20).map((point: { latitude: number; longitude: number }, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3 text-gray-900 font-mono text-xs">{point.latitude.toFixed(6)}</td>
                      <td className="px-5 py-3 text-gray-900 font-mono text-xs">{point.longitude.toFixed(6)}</td>
                    </tr>
                  ))}
                  {routePoints.length > 20 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-center text-gray-500 text-sm italic">
                        ... and {routePoints.length - 20} more points
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
