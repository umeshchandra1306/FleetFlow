import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import { useVehicleTracking, useShipmentStatus } from '../hooks/useSocket';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import RoadRoutePolyline from '../components/RoadRoutePolyline';
import L from 'leaflet';
import {
  Truck, Package, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  Plus, ArrowRight, Activity, MapPin, Zap, Radio, ShieldAlert,
  Navigation, CheckCircle
} from 'lucide-react';
import type { DashboardData, Vehicle, VehicleLocation } from '../types';

const vehicleIcon = (status: string) => L.divIcon({
  className: 'vehicle-marker',
  html: `<div class="vehicle-marker-icon ${status === 'IN_TRANSIT' ? 'in-transit' : status === 'DELAYED' ? 'delayed' : ''}">🚛</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;background:linear-gradient(135deg, #10b981, #059669);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:2.5px solid white;box-shadow:0 3px 10px rgba(16,185,129,0.4)">📦</div>',
  iconSize: [30, 30], iconAnchor: [15, 15],
});

const destIcon = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;background:linear-gradient(135deg, #ef4444, #dc2626);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:2.5px solid white;box-shadow:0 3px 10px rgba(239,68,68,0.4)">📍</div>',
  iconSize: [30, 30], iconAnchor: [15, 15],
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
      <div className="p-5 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="shimmer h-8 w-64 rounded-lg" />
          <div className="shimmer h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-[104px] rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 shimmer h-[480px] rounded-2xl" />
          <div className="shimmer h-[480px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts = data?.alerts || [];
  const activeShipments = data?.activeShipments || [];
  const vehicles = data?.vehicles || [];

  const kpiCards = [
    {
      label: 'Active Vehicles',
      value: kpis?.activeVehicles || 0,
      icon: Truck,
      lightBg: 'bg-indigo-50 text-indigo-600',
      change: `${kpis?.totalVehicles || 0} total fleet`,
    },
    {
      label: 'Available',
      value: kpis?.availableVehicles || 0,
      icon: CheckCircle2,
      lightBg: 'bg-emerald-50 text-emerald-600',
      change: 'Ready for dispatch',
    },
    {
      label: 'Active Shipments',
      value: kpis?.activeShipments || 0,
      icon: Package,
      lightBg: 'bg-blue-50 text-blue-600',
      change: `${kpis?.pendingShipments || 0} pending`,
    },
    {
      label: 'Delayed',
      value: kpis?.delayedShipments || 0,
      icon: AlertTriangle,
      lightBg: 'bg-rose-50 text-rose-600',
      change: 'Requires attention',
      alert: true,
    },
    {
      label: 'Fleet Utilization',
      value: `${kpis?.fleetUtilization || 0}%`,
      icon: Activity,
      lightBg: 'bg-violet-50 text-violet-600',
      change: 'Efficiency score',
    },
    {
      label: 'On-Time Rate',
      value: `${kpis?.onTimeRate || 0}%`,
      icon: TrendingUp,
      lightBg: 'bg-teal-50 text-teal-600',
      change: 'SLA fulfillment',
    },
  ];

  const statusConfig: Record<string, { bg: string; dot: string; label: string }> = {
    PENDING: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: 'Pending' },
    ASSIGNED: { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500', label: 'Assigned' },
    IN_TRANSIT: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500 pulse-dot', label: 'In Transit' },
    DELAYED: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500 pulse-dot', label: 'Delayed' },
    DELIVERED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Delivered' },
    PICKED_UP: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80', dot: 'bg-cyan-500', label: 'Picked Up' },
    ARRIVING: { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500 pulse-dot', label: 'Arriving' },
  };

  const priorityConfig: Record<string, { bg: string; label: string }> = {
    LOW: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low' },
    MEDIUM: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', label: 'Medium' },
    HIGH: { bg: 'bg-orange-50 text-orange-700 border-orange-200/80', label: 'High' },
    URGENT: { bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', label: 'Urgent' },
  };

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Sleek SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-header-title">Fleet Command Center</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
              LIVE RADAR
            </span>
          </div>
          <p className="page-header-subtitle">Real-time telematics, live vehicle tracking, and active logisitics operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 font-medium">
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Telemetry Active</span>
          </div>
          <button
            onClick={() => navigate('/shipments/new')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-indigo-600 transition-all duration-200 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> New Shipment
          </button>
        </div>
      </div>

      {/* Compact SaaS KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all duration-150 flex flex-col justify-between h-[104px]"
          >
            {/* Top Row: Subtle Label & Small Icon */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
                {kpi.label}
              </span>
              <div className={`p-1.5 rounded-md ${kpi.lightBg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Middle: Metric Number */}
            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {kpi.value}
              </span>
              {kpi.alert && typeof kpi.value === 'number' && kpi.value > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              )}
            </div>

            {/* Bottom: Unclipped Helper Text */}
            <p className="text-[11px] text-slate-500 font-medium truncate leading-snug">
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid: Map & Alerts */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Live Fleet Map (Visual Centerpiece) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Section Header & Compact Status Legend */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 border border-indigo-100/80 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Navigation className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-bold text-slate-900 text-sm lg:text-base tracking-tight">Live Fleet Map</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white tracking-wider uppercase shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE FLEET
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Real-time telematics feeds & active shipment routes</p>
              </div>
            </div>
            
            {/* Compact Legend Bar */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> In Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" /> Delayed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" /> Pickup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" /> Destination
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-800">{vehicles.length} Units</span>
            </div>
          </div>

          <div className="h-[470px] relative">
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
                      <div className="p-1 min-w-[150px]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                          <p className="font-bold text-slate-900">{v.vehicleNumber}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{v.status}</span>
                        </div>
                        <p className="text-xs text-slate-600">{v.vehicleType}</p>
                        <p className="text-xs text-slate-500">Driver: <span className="font-medium text-slate-800">{v.driver?.name || 'Unassigned'}</span></p>
                        {pos && (
                          <div className="mt-1 pt-1 border-t border-slate-100 text-[11px] font-semibold text-indigo-600 flex items-center justify-between">
                            <span>Speed:</span>
                            <span>{pos.speed} km/h</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {activeShipments.map(s => (
                <Marker key={`pickup-${s.id}`} position={[s.pickupLatitude, s.pickupLongitude]} icon={pickupIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-slate-900">{s.shipmentNumber} Pickup</p>
                      <p className="text-slate-600">{s.pickupLocation}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {activeShipments.map(s => (
                <Marker key={`dest-${s.id}`} position={[s.destinationLatitude, s.destinationLongitude]} icon={destIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-slate-900">{s.shipmentNumber} Destination</p>
                      <p className="text-slate-600">{s.destination}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {activeShipments.map(s => (
                <RoadRoutePolyline
                  key={`route-${s.id}`}
                  start={{ lat: s.pickupLatitude, lng: s.pickupLongitude }}
                  end={{ lat: s.destinationLatitude, lng: s.destinationLongitude }}
                  color={s.status === 'DELAYED' ? '#ef4444' : '#4f46e5'}
                  weight={3.5}
                  opacity={0.8}
                />
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-50 border border-amber-100/80 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm lg:text-base flex items-center gap-2 tracking-tight">
                  Active Alerts
                  {alerts.length > 0 && (
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                      {alerts.length}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">System warnings & operational events</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[470px]">
            {alerts.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-800 font-semibold">No active alerts</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">All telemetry feeds and fleet metrics operating normally.</p>
              </div>
            ) : (
              alerts.slice(0, 6).map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                const isWarning = alert.severity === 'WARNING';
                return (
                  <div
                    key={alert.id}
                    className={`px-4.5 py-3.5 transition-colors hover:bg-slate-50/80 ${
                      isCritical
                        ? 'border-l-2 border-l-rose-500 bg-rose-50/30'
                        : isWarning
                        ? 'border-l-2 border-l-amber-500 bg-amber-50/20'
                        : 'border-l-2 border-l-blue-500 bg-blue-50/10'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 leading-snug">{alert.message}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                              : isWarning
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-blue-50 text-blue-700 border-blue-200/80'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Active Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 border border-blue-100/80 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
              <Package className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm lg:text-base flex items-center gap-2 tracking-tight">
                Active Shipments
                {activeShipments.length > 0 && (
                  <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                    {activeShipments.length}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Live dispatch tracking & ETA schedule</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/shipments')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline transition-colors"
          >
            View all shipments <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 bg-slate-50/80">
                <th className="px-5 py-3">Shipment</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Vehicle / Driver</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">ETA</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No active shipments</p>
                    <p className="text-xs text-slate-400 mt-0.5">Dispatched shipments will display here in real time.</p>
                  </td>
                </tr>
              ) : (
                activeShipments.map(s => {
                  const status = statusConfig[s.status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: s.status };
                  const priority = priorityConfig[s.priority] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: s.priority };

                  return (
                    <tr
                      key={s.id}
                      className="ff-table-row cursor-pointer group hover:bg-slate-50/70 transition-colors"
                      onClick={() => navigate(`/shipments/${s.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.shipmentNumber}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{s.cargoType}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <span className="truncate max-w-[130px]">{s.pickupLocation?.split(',')[0]}</span>
                          <span className="text-slate-400 font-normal">→</span>
                          <span className="truncate max-w-[130px]">{s.destination?.split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-800">{s.vehicle?.vehicleNumber || '—'}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{s.driver?.name || 'Unassigned'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {s.route?.eta ? new Date(s.route.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priority.bg}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

