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
      <div className="p-5 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-xl" />
          ))}
        </div>
        <div className="shimmer h-[440px] rounded-xl" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts = data?.alerts || [];
  const activeShipments = data?.activeShipments || [];
  const vehicles = data?.vehicles || [];

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.activeVehicles || 0, icon: Truck, bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600', change: `${kpis?.totalVehicles || 0} total` },
    { label: 'Available', value: kpis?.availableVehicles || 0, icon: CheckCircle, bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600', change: 'Ready to dispatch' },
    { label: 'Active Shipments', value: kpis?.activeShipments || 0, icon: Package, bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50 text-indigo-600', change: `${kpis?.pendingShipments || 0} pending` },
    { label: 'Delayed', value: kpis?.delayedShipments || 0, icon: AlertTriangle, bg: 'from-red-500 to-red-600', light: 'bg-red-50 text-red-600', change: 'Needs attention', alert: true },
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization || 0}%`, icon: Activity, bg: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600', change: 'Efficiency' },
    { label: 'On-Time Rate', value: `${kpis?.onTimeRate || 0}%`, icon: TrendingUp, bg: 'from-teal-500 to-teal-600', light: 'bg-teal-50 text-teal-600', change: 'Performance' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    ASSIGNED: 'bg-amber-50 text-amber-700',
    IN_TRANSIT: 'bg-blue-50 text-blue-700',
    DELAYED: 'bg-red-50 text-red-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
    PICKED_UP: 'bg-cyan-50 text-cyan-700',
    ARRIVING: 'bg-violet-50 text-violet-700',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  };

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Fleet Command Center</h1>
          <p className="page-header-subtitle">Real-time fleet operations overview</p>
        </div>
        <button
          onClick={() => navigate('/shipments/new')}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.light} rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              {kpi.alert && typeof kpi.value === 'number' && kpi.value > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full pulse-dot" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{kpi.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kpi.change}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <h2 className="font-semibold text-gray-900 text-[15px]">Live Fleet Map</h2>
              <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot" />
            </div>
            <span className="text-xs text-gray-400 font-medium">{vehicles.length} vehicles tracked</span>
          </div>
          <div className="h-[420px]">
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-card flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="font-semibold text-gray-900 text-[15px]">Active Alerts</h2>
              {alerts.length > 0 && (
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/alerts')} className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors">View all</button>
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-[380px]">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No active alerts</p>
                <p className="text-xs text-gray-300 mt-0.5">All systems operating normally</p>
              </div>
            ) : (
              alerts.slice(0, 6).map(alert => (
                <div key={alert.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-[13px] text-gray-800 leading-snug">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`ff-badge ${
                          alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' : alert.severity === 'WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-[15px]">Active Shipments</h2>
            {activeShipments.length > 0 && (
              <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full">{activeShipments.length}</span>
            )}
          </div>
          <button onClick={() => navigate('/shipments')} className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-semibold">Shipment</th>
                <th className="px-5 py-3 font-semibold">Route</th>
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">ETA</th>
                <th className="px-5 py-3 font-semibold">Priority</th>
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeShipments.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center">
                  <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No active shipments</p>
                </td></tr>
              ) : (
                activeShipments.map(s => (
                  <tr key={s.id} className="ff-table-row cursor-pointer group" onClick={() => navigate(`/shipments/${s.id}`)}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{s.shipmentNumber}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.cargoType}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{s.pickupLocation?.split(',')[0]}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">→ {s.destination?.split(',')[0]}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{s.vehicle?.vehicleNumber || '—'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.driver?.name || ''}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`ff-badge ${statusColors[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {s.route?.eta ? new Date(s.route.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`ff-badge ${priorityColors[s.priority]}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
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
