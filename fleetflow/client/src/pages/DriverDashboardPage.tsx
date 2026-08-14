import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { shipmentAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useVehicleTracking, useShipmentStatus } from '../hooks/useSocket';
import {
  Truck, Package, MapPin, Clock, AlertTriangle,
  Play, CheckCircle, Navigation, Gauge, ArrowRight,
  Inbox, User,
} from 'lucide-react';
import type { Shipment, VehicleLocation } from '../types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  PICKED_UP: 'bg-cyan-100 text-cyan-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  DELAYED: 'bg-red-100 text-red-700',
  ARRIVING: 'bg-violet-100 text-violet-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
};

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const driverId = user?.driverId;
  const [liveLocation, setLiveLocation] = useState<VehicleLocation | null>(null);

  const { data: shipment, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['driver-active-shipment', driverId],
    queryFn: async () => {
      if (!driverId) return null;
      try {
        const res = await shipmentAPI.getDriverActive(driverId);
        return (res.data.data ?? null) as Shipment | null;
      } catch (err) {
        // Backend returns 404 when no active shipment exists — treat as "no data"
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!driverId,
    refetchInterval: 30000,
  });

  // Live vehicle tracking
  useVehicleTracking(
    useCallback((loc: VehicleLocation) => {
      if (shipment?.vehicleId && loc.vehicleId === shipment.vehicleId) {
        setLiveLocation(loc);
      }
    }, [shipment?.vehicleId])
  );

  // Shipment status updates trigger refetch
  useShipmentStatus(
    useCallback((data: { shipmentId: string }) => {
      if (shipment && data.shipmentId === shipment.id) {
        refetch();
      }
    }, [shipment, refetch])
  );

  const startMutation = useMutation({
    mutationFn: (id: string) => shipmentAPI.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-shipment'] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (id: string) => shipmentAPI.deliver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-active-shipment'] });
    },
  });

  /* ---------- No driverId ---------- */
  if (!driverId) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your assigned shipments and routes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No driver profile linked</h2>
          <p className="text-sm text-gray-500 mb-4">Your account is not associated with a driver profile.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your assigned shipments and routes</p>
          </div>
        </div>
        <div className="shimmer h-28 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="shimmer h-48 rounded-xl" />
          <div className="shimmer h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (isError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your assigned shipments and routes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Failed to load active shipment</h2>
          <p className="text-sm text-gray-500 mb-4">
            {(error as Error)?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------- No Active Shipment ---------- */
  if (!shipment) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.name}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No active shipment</h2>
          <p className="text-sm text-gray-500 mb-4">You don't have any active shipments assigned right now.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Active Shipment ---------- */
  const canStart = shipment.status === 'ASSIGNED' || shipment.status === 'PICKED_UP';
  const canDeliver = shipment.status === 'IN_TRANSIT' || shipment.status === 'ARRIVING';
  const progress = liveLocation?.progress ?? 0;
  const speed = liveLocation?.speed ?? 0;
  const eta = liveLocation?.eta || (shipment.route?.eta ?? null);
  const remainingDist = liveLocation?.remainingDistance ?? null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome, {user?.name}</p>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[shipment.status] || 'bg-gray-100 text-gray-700'}`}>
          {shipment.status.replace('_', ' ')}
        </span>
      </div>

      {/* Shipment Overview Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900">{shipment.shipmentNumber}</h2>
          </div>
          <button
            onClick={() => navigate(`/shipments/${shipment.id}`)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5">
          {/* Route */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
              <div className="w-0.5 h-8 bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{shipment.pickupLocation}</p>
              <div className="h-6" />
              <p className="text-sm font-medium text-gray-800">{shipment.destination}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Cargo</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.cargoType}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Weight</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.weight} kg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Packages</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.packageCount}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Priority</p>
              <p className="text-sm font-semibold text-gray-800">{shipment.priority}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vehicle Info */}
        {shipment.vehicle && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-gray-900">Vehicle</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Number</span>
                <span className="text-sm font-medium text-gray-800">{shipment.vehicle.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium text-gray-800">{shipment.vehicle.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Capacity</span>
                <span className="text-sm font-medium text-gray-800">{shipment.vehicle.capacity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="text-sm font-medium text-gray-800">{shipment.vehicle.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Progress */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Trip Progress</h2>
            {liveLocation && <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />}
          </div>
          <div className="p-5 space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Speed</p>
                  <p className="text-sm font-semibold text-gray-800">{speed.toFixed(0)} km/h</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {remainingDist !== null ? `${remainingDist.toFixed(1)} km` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {eta && (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(eta).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            )}

            {shipment.route && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Route distance</span>
                <span className="font-medium text-gray-800">
                  {(shipment.route.optimizedDistance ?? shipment.route.distance).toFixed(1)} km
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {(canStart || canDeliver) && (
        <div className="flex flex-wrap gap-3">
          {canStart && (
            <button
              onClick={() => startMutation.mutate(shipment.id)}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {startMutation.isPending ? 'Starting…' : 'Start Trip'}
            </button>
          )}
          {canDeliver && (
            <button
              onClick={() => deliverMutation.mutate(shipment.id)}
              disabled={deliverMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {deliverMutation.isPending ? 'Delivering…' : 'Mark Delivered'}
            </button>
          )}
        </div>
      )}

      {/* Alerts */}
      {shipment.alerts && shipment.alerts.filter(a => !a.resolved).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Active Alerts</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {shipment.alerts.filter(a => !a.resolved).map(alert => (
              <div key={alert.id} className="px-5 py-3 flex items-start gap-2">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>{alert.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
