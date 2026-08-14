import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { shipmentAPI } from '../services/api';
import {
  Package, MapPin, Truck, User, Clock, ArrowLeft,
  AlertTriangle, CheckCircle, Navigation, Route as RouteIcon,
  Weight, Boxes, CalendarClock, ArrowRight, Play,
  Loader2, Info, XCircle, ChevronRight, Zap, BarChart3,
} from 'lucide-react';
import type { Shipment, Alert, TrackingEvent } from '../types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  ASSIGNED: 'bg-amber-100 text-amber-700 border-amber-200',
  PICKED_UP: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  IN_TRANSIT: 'bg-blue-100 text-blue-700 border-blue-200',
  DELAYED: 'bg-red-100 text-red-700 border-red-200',
  ARRIVING: 'bg-violet-100 text-violet-700 border-violet-200',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-gray-200 text-gray-500 border-gray-300',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const alertSeverityColors: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const alertSeverityDots: Record<string, string> = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};

// Status timeline steps in order
const STATUS_FLOW = [
  'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED',
] as const;

function getStatusIndex(status: string): number {
  const idx = STATUS_FLOW.indexOf(status as typeof STATUS_FLOW[number]);
  return idx >= 0 ? idx : -1;
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';
  const isDelayed = currentStatus === 'DELAYED';

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {STATUS_FLOW.map((step, i) => {
        const isCompleted = !isCancelled && currentIdx >= 0 && i <= currentIdx;
        const isCurrent = !isCancelled && step === currentStatus;

        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center min-w-[60px]">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${
                isCurrent ? 'font-semibold text-primary-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                {step.replace('_', ' ')}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 w-6 flex-shrink-0 ${
                !isCancelled && currentIdx >= 0 && i < currentIdx
                  ? 'bg-emerald-400'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
      {/* Cancelled / Delayed indicators */}
      {isCancelled && (
        <div className="flex items-center gap-1 ml-2">
          <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center">
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-gray-500">CANCELLED</span>
        </div>
      )}
      {isDelayed && (
        <div className="flex items-center gap-1 ml-2">
          <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center ring-4 ring-red-100">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-red-600">DELAYED</span>
        </div>
      )}
    </div>
  );
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: shipment, isLoading, isError, error } = useQuery<Shipment>({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const res = await shipmentAPI.get(id!);
      return res.data.data as Shipment;
    },
    enabled: !!id,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shipment', id] });

  const handleAction = async (action: string, label: string) => {
    if (!id) return;
    setActionLoading(action);
    setActionError('');
    try {
      switch (action) {
        case 'start':
          await shipmentAPI.start(id);
          break;
        case 'deliver':
          await shipmentAPI.deliver(id);
          break;
        case 'cancel':
          await shipmentAPI.updateStatus(id, 'CANCELLED');
          break;
        case 'simulateDelay':
          await shipmentAPI.simulateDelay(id);
          break;
      }
      await invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? `Failed to ${label}`;
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="shimmer h-7 w-64 rounded-lg" />
        <div className="shimmer h-4 w-96 rounded-lg" />
        <div className="shimmer h-20 rounded-xl" />
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="shimmer h-64 rounded-xl" />
          <div className="shimmer h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // --- Error ---
  if (isError || !shipment) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Shipment Not Found</h2>
          <p className="text-sm text-gray-500 mb-4">
            {error instanceof Error ? error.message : 'Could not load shipment details.'}
          </p>
          <button
            onClick={() => navigate('/shipments')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  const s = shipment;
  const trackingEvents = (s.trackingEvents ?? []) as TrackingEvent[];
  const alerts = (s.alerts ?? []) as Alert[];

  const deadlinePassed = new Date(s.deadline).getTime() < Date.now();
  const isTerminal = s.status === 'DELIVERED' || s.status === 'CANCELLED';

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/shipments')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shipments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{s.shipmentNumber}</h1>
              <p className="text-sm text-gray-500">
                Created {new Date(s.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${statusColors[s.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {s.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[s.priority] ?? 'bg-gray-100 text-gray-600'}`}>
              {s.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipment Progress</h3>
        <StatusTimeline currentStatus={s.status} />
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Actions Bar */}
      {!isTerminal && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Actions</span>

            {s.status === 'PENDING' && !s.vehicleId && (
              <button
                onClick={() => navigate(`/shipments/${s.id}/allocate`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" /> Allocate Vehicle
              </button>
            )}

            {(s.status === 'ASSIGNED' || s.status === 'PENDING') && s.vehicleId && !s.routeId && (
              <button
                onClick={() => navigate(`/shipments/${s.id}/route`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
              >
                <RouteIcon className="w-3.5 h-3.5" /> Optimize Route
              </button>
            )}

            {s.status === 'ASSIGNED' && s.vehicleId && s.routeId && (
              <button
                onClick={() => handleAction('start', 'start trip')}
                disabled={actionLoading === 'start'}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'start' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Start Trip
              </button>
            )}

            {(s.status === 'IN_TRANSIT' || s.status === 'ARRIVING') && (
              <button
                onClick={() => handleAction('deliver', 'mark delivered')}
                disabled={actionLoading === 'deliver'}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'deliver' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Mark Delivered
              </button>
            )}

            {s.status === 'IN_TRANSIT' && (
              <button
                onClick={() => handleAction('simulateDelay', 'simulate delay')}
                disabled={actionLoading === 'simulateDelay'}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'simulateDelay' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                Simulate Delay
              </button>
            )}

            <button
              onClick={() => handleAction('cancel', 'cancel shipment')}
              disabled={actionLoading === 'cancel'}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
            >
              {actionLoading === 'cancel' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Locations */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Locations</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">📦</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</p>
                  <p className="text-sm text-gray-900 font-medium mt-0.5">{s.pickupLocation}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.pickupLatitude.toFixed(4)}, {s.pickupLongitude.toFixed(4)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <div className="w-px h-6 bg-gray-200" />
                <ArrowRight className="w-3 h-3 text-gray-300" />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">📍</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</p>
                  <p className="text-sm text-gray-900 font-medium mt-0.5">{s.destination}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.destinationLatitude.toFixed(4)}, {s.destinationLongitude.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Cargo Information</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Cargo Type</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{s.cargoType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Weight className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{s.weight} tons</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Packages</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{s.packageCount} packages</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                  <p className={`text-sm font-medium ${deadlinePassed && !isTerminal ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(s.deadline).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900">Alerts</h3>
                <span className="text-xs text-gray-400 ml-auto">{alerts.length}</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="px-5 py-3 flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alertSeverityDots[alert.severity] ?? 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${alertSeverityColors[alert.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-gray-400">{alert.type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {alert.resolved && (
                          <span className="text-[10px] text-emerald-600 font-medium">Resolved</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Vehicle & Driver */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Vehicle & Driver</h3>
            </div>
            {s.vehicle ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.vehicle.vehicleNumber}</p>
                    <p className="text-xs text-gray-500">{s.vehicle.vehicleType} · {s.vehicle.fuelType}</p>
                  </div>
                  <span className={`ml-auto inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.vehicle.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700'
                    : s.vehicle.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                  }`}>
                    {s.vehicle.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="text-sm font-medium text-gray-900">{s.vehicle.capacity}t</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Current Load</p>
                    <p className="text-sm font-medium text-gray-900">{s.vehicle.currentLoad}t</p>
                  </div>
                </div>

                {/* Driver */}
                {s.driver ? (
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.driver.name}</p>
                      <p className="text-xs text-gray-500">
                        ⭐ {s.driver.rating} · {s.driver.tripsCompleted} trips · {s.driver.phone}
                      </p>
                    </div>
                    <span className={`ml-auto inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.driver.status === 'DRIVING' ? 'bg-blue-100 text-blue-700'
                      : s.driver.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                      {s.driver.status.replace('_', ' ')}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 italic">No driver assigned</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 text-center">
                <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No vehicle assigned yet</p>
                {s.status === 'PENDING' && (
                  <button
                    onClick={() => navigate(`/shipments/${s.id}/allocate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" /> Allocate Vehicle
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Route Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Route Information</h3>
            </div>
            {s.route ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="text-sm font-medium text-gray-900">{s.route.distance.toFixed(1)} km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-500">Est. Duration</p>
                    <p className="text-sm font-medium text-gray-900">{Math.round(s.route.estimatedDuration)} min</p>
                  </div>
                </div>

                {s.route.optimizedDistance != null && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-2.5">
                      <p className="text-xs text-emerald-600">Optimized Distance</p>
                      <p className="text-sm font-medium text-emerald-700">{s.route.optimizedDistance.toFixed(1)} km</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2.5">
                      <p className="text-xs text-emerald-600">Optimized Duration</p>
                      <p className="text-sm font-medium text-emerald-700">
                        {s.route.optimizedDuration != null ? `${Math.round(s.route.optimizedDuration)} min` : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ETA */}
                {s.route.eta && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Estimated Arrival</p>
                      <p className="text-sm font-semibold text-blue-800">
                        {new Date(s.route.eta).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.route.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700'
                    : s.route.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700'
                    : s.route.status === 'DEVIATED' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                  }`}>
                    Route: {s.route.status}
                  </span>
                  <button
                    onClick={() => navigate(`/shipments/${s.id}/route`)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    View Route <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center">
                <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">No route optimized yet</p>
                {s.vehicleId && (s.status === 'ASSIGNED' || s.status === 'PENDING') && (
                  <button
                    onClick={() => navigate(`/shipments/${s.id}/route`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    <RouteIcon className="w-3.5 h-3.5" /> Optimize Route
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tracking Events */}
          {trackingEvents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary-500" />
                <h3 className="font-semibold text-gray-900">Recent Tracking</h3>
                <span className="text-xs text-gray-400 ml-auto">{trackingEvents.length} events</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[280px] overflow-y-auto">
                {trackingEvents.slice(0, 15).map((evt) => (
                  <div key={evt.id} className="px-5 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span className="text-xs text-gray-600">
                        {evt.latitude.toFixed(4)}, {evt.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{evt.speed.toFixed(0)} km/h</span>
                      <span>
                        {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
