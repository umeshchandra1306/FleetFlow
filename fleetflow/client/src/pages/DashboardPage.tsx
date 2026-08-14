import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import { useVehicleTracking, useShipmentStatus } from '../hooks/useSocket';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  Truck, Package, AlertTriangle, TrendingUp, Clock, CheckCircle,
  Plus, ArrowRight, Activity, MapPin, Zap, BarChart3
} from 'lucide-react';
import type { DashboardData, Vehicle, VehicleLocation } from '../types';

const vehicleIcon = (status: string) => L.divIcon({
  className: 'vehicle-marker',
  html: `<div class="vehicle-marker-icon ${status === 'IN_TRANSIT' ? 'in-transit' : status === 'DELAYED' ? 'delayed' : ''}">🚛</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4)">📦</div>',
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const destIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4)">📍</div>',
  iconSize: [28, 28], iconAnchor: [14, 14],
});

export default function DashboardPage() {
  const navigate = useNavigate();
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, VehicleLocation>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await dashboardAPI.get();
      return res.data.data as DashboardData;
    },
    refetchInterval: 15000,
  });

  useVehicleTracking(useCallback((loc: VehicleLocation) => {
    setVehiclePositions(prev => ({ ...prev, [loc.vehicleId]: loc }));
  }, []));

  useShipmentStatus(useCallback(() => { refetch(); }, [refetch]));

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
        <div className="shimmer h-96 rounded-xl" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts = data?.alerts || [];
  const activeShipments = data?.activeShipments || [];
  const vehicles = data?.vehicles || [];

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.activeVehicles || 0, icon: Truck, color: 'bg-blue-500', change: `${kpis?.totalVehicles || 0} total` },
    { label: 'Available', value: kpis?.availableVehicles || 0, icon: CheckCircle, color: 'bg-emerald-500', change: 'Ready to dispatch' },
    { label: 'Active Shipments', value: kpis?.activeShipments || 0, icon: Package, color: 'bg-indigo-500', change: `${kpis?.pendingShipments || 0} pending` },
    { label: 'Delayed', value: kpis?.delayedShipments || 0, icon: AlertTriangle, color: 'bg-red-500', change: 'Needs attention' },
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization || 0}%`, icon: Activity, color: 'bg-purple-500', change: 'Efficiency' },
    { label: 'On-Time Rate', value: `${kpis?.onTimeRate || 0}%`, icon: TrendingUp, color: 'bg-teal-500', change: 'Performance' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    ASSIGNED: 'bg-amber-100 text-amber-700',
    IN_TRANSIT: 'bg-blue-100 text-blue-700',
    DELAYED: 'bg-red-100 text-red-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    PICKED_UP: 'bg-cyan-100 text-cyan-700',
    ARRIVING: 'bg-violet-100 text-violet-700',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time fleet operations overview</p>
        </div>
        <button
          onClick={() => navigate('/shipments/new')}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {typeof kpi.value === 'number' && kpi.value > 0 && kpi.label === 'Delayed' && (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full pulse-dot" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-gray-900">Live Fleet Map</h2>
              <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
            </div>
            <span className="text-xs text-gray-400">{vehicles.length} vehicles tracked</span>
          </div>
          <div className="h-[400px]">
            <MapContainer
              center={[22.5, 78.5]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {vehicles.map((v: Vehicle) => {
                const pos = vehiclePositions[v.id];
                const lat = pos?.latitude || v.latitude;
                const lng = pos?.longitude || v.longitude;
                return (
                  <Marker key={v.id} position={[lat, lng]} icon={vehicleIcon(v.status)}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{v.vehicleNumber}</p>
                        <p className="text-gray-500">{v.vehicleType}</p>
                        <p className="text-gray-500">{v.driver?.name || 'No driver'}</p>
                        <p className="text-xs mt-1">Status: <span className="font-medium">{v.status}</span></p>
                        {pos && <p className="text-xs">Speed: {pos.speed} km/h</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {activeShipments.map(s => (
                <Marker key={`pickup-${s.id}`} position={[s.pickupLatitude, s.pickupLongitude]} icon={pickupIcon}>
                  <Popup><div className="text-xs"><p className="font-bold">{s.shipmentNumber} Pickup</p><p>{s.pickupLocation}</p></div></Popup>
                </Marker>
              ))}
              {activeShipments.map(s => (
                <Marker key={`dest-${s.id}`} position={[s.destinationLatitude, s.destinationLongitude]} icon={destIcon}>
                  <Popup><div className="text-xs"><p className="font-bold">{s.shipmentNumber} Destination</p><p>{s.destination}</p></div></Popup>
                </Marker>
              ))}
              {activeShipments.filter(s => s.route?.routePoints).map(s => {
                const points = (s.route!.routePoints as any[]).map(p => [p.latitude, p.longitude] as [number, number]);
                return <Polyline key={`route-${s.id}`} positions={points} color={s.status === 'DELAYED' ? '#ef4444' : '#4f46e5'} weight={3} opacity={0.7} />;
              })}
            </MapContainer>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Active Alerts</h2>
            </div>
            <button onClick={() => navigate('/alerts')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No active alerts</p>
            ) : (
              alerts.slice(0, 6).map(alert => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-800">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>{alert.severity}</span>
                        <span className="text-[10px] text-gray-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Shipments Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Active Shipments</h2>
          </div>
          <button onClick={() => navigate('/shipments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Shipment</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">ETA</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeShipments.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">No active shipments</td></tr>
              ) : (
                activeShipments.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/shipments/${s.id}`)}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900">{s.shipmentNumber}</p>
                      <p className="text-xs text-gray-500">{s.cargoType}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700">{s.pickupLocation?.split(',')[0]}</p>
                      <p className="text-xs text-gray-500">→ {s.destination?.split(',')[0]}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700">{s.vehicle?.vehicleNumber || '—'}</p>
                      <p className="text-xs text-gray-500">{s.driver?.name || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-gray-100 text-gray-700'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {s.route?.eta ? new Date(s.route.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[s.priority]}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
