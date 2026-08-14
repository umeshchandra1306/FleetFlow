import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Activity, Package, Truck, AlertTriangle,
  Clock, CheckCircle, Route, Gauge, RefreshCw,
} from 'lucide-react';
import type { AnalyticsData } from '../types';

export default function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await analyticsAPI.get();
      return res.data.data as AnalyticsData;
    },
  });

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fleet performance and delivery insights</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="shimmer h-80 rounded-xl" />
          <div className="shimmer h-80 rounded-xl" />
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
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fleet performance and delivery insights</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Failed to load analytics</h2>
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

  /* ---------- Empty ---------- */
  if (!data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fleet performance and delivery insights</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No analytics data</h2>
          <p className="text-sm text-gray-500">Start creating shipments to see analytics here.</p>
        </div>
      </div>
    );
  }

  /* ---------- KPI Cards ---------- */
  const kpiCards = [
    { label: 'Fleet Utilization', value: `${data.fleetUtilization}%`, icon: Activity, color: 'bg-purple-500' },
    { label: 'On-Time Rate', value: `${data.onTimeRate}%`, icon: TrendingUp, color: 'bg-teal-500' },
    { label: 'Total Shipments', value: data.shipments.total, icon: Package, color: 'bg-indigo-500' },
    { label: 'Delivered', value: data.shipments.delivered, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: 'Delayed', value: data.shipments.delayed, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Pending', value: data.shipments.pending, icon: Clock, color: 'bg-amber-500' },
    { label: 'Total Vehicles', value: data.vehicles.total, icon: Truck, color: 'bg-blue-500' },
    { label: 'Routes Optimized', value: data.optimization.routesOptimized, icon: Route, color: 'bg-cyan-500' },
  ];

  const optimCards = [
    { label: 'Distance Saved', value: `${data.optimization.distanceSaved.toFixed(1)} km`, sub: `${data.optimization.distanceSavedPercent.toFixed(1)}% reduction`, icon: Gauge, color: 'bg-violet-500' },
    { label: 'Time Saved', value: `${data.optimization.timeSaved.toFixed(0)} min`, sub: `${data.optimization.timeSavedPercent.toFixed(1)}% faster`, icon: Clock, color: 'bg-rose-500' },
  ];

  const PRIORITY_COLORS: Record<string, string> = { LOW: '#9ca3af', MEDIUM: '#3b82f6', HIGH: '#f97316', URGENT: '#ef4444' };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fleet performance and delivery insights</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.color} rounded-lg flex items-center justify-center`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.label === 'Delayed' && typeof kpi.value === 'number' && kpi.value > 0 && (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full pulse-dot" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Optimization Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label} &middot; {card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Shipment Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Shipment Status Distribution</h2>
          </div>
          <div className="p-4 h-72">
            {data.charts.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.charts.statusDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Vehicle Utilization */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Vehicle Utilization</h2>
          </div>
          <div className="p-4 h-72">
            {data.charts.vehicleUtilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.vehicleUtilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.charts.vehicleUtilization.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Volume */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Daily Shipment Volume</h2>
          </div>
          <div className="p-4 h-72">
            {data.charts.dailyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="shipments" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Shipments by Priority</h2>
          </div>
          <div className="p-4 h-72">
            {data.charts.priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.priorityDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.charts.priorityDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
