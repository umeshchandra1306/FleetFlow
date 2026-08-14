import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertAPI } from '../services/api';
import { useVehicleTracking } from '../hooks/useSocket';
import {
  AlertTriangle, CheckCircle, Filter, Bell,
  RefreshCw, Inbox, XCircle, Info, ShieldAlert,
} from 'lucide-react';
import type { Alert } from '../types';

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const;
const TYPE_OPTIONS = ['ALL', 'ROUTE_DEVIATION', 'DELAY_RISK', 'LOW_PROGRESS', 'VEHICLE_OFFLINE'] as const;
const RESOLVED_OPTIONS = ['ALL', 'ACTIVE', 'RESOLVED'] as const;

const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  WARNING: 'bg-amber-100 text-amber-700',
  INFO: 'bg-blue-100 text-blue-700',
};

const severityIcon: Record<string, typeof AlertTriangle> = {
  CRITICAL: XCircle,
  WARNING: ShieldAlert,
  INFO: Info,
};

const typeLabels: Record<string, string> = {
  ROUTE_DEVIATION: 'Route Deviation',
  DELAY_RISK: 'Delay Risk',
  LOW_PROGRESS: 'Low Progress',
  VEHICLE_OFFLINE: 'Vehicle Offline',
};

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [resolvedFilter, setResolvedFilter] = useState<string>('ALL');

  const { data: alerts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await alertAPI.list();
      return (res.data.data ?? res.data) as Alert[];
    },
    refetchInterval: 30000,
  });

  // Live socket alerts trigger refetch
  useVehicleTracking(
    () => {},
    () => { refetch(); }
  );

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertAPI.resolve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alerts'] }); },
  });

  const filtered = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(a => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
      if (resolvedFilter === 'ACTIVE' && a.resolved) return false;
      if (resolvedFilter === 'RESOLVED' && !a.resolved) return false;
      return true;
    });
  }, [alerts, severityFilter, typeFilter, resolvedFilter]);

  const activeCount = alerts?.filter(a => !a.resolved).length ?? 0;

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fleet alerts and notifications</p>
          </div>
        </div>
        <div className="shimmer h-12 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (isError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Fleet alerts and notifications</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Failed to load alerts</h2>
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} active alert{activeCount !== 1 ? 's' : ''} &middot; {alerts?.length ?? 0} total
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-4">
          {/* Severity */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Severities' : s}</option>)}
            </select>
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : typeLabels[t] || t}</option>)}
            </select>
          </div>
          {/* Resolved */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={resolvedFilter}
              onChange={e => setResolvedFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {RESOLVED_OPTIONS.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All' : r === 'ACTIVE' ? 'Active Only' : 'Resolved Only'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">No alerts found</h2>
          <p className="text-sm text-gray-500">
            {alerts && alerts.length > 0
              ? 'Try adjusting your filters.'
              : 'No alerts have been generated yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const SevIcon = severityIcon[alert.severity] || AlertTriangle;
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex items-start gap-4 transition-opacity ${
                  alert.resolved ? 'border-gray-100 opacity-60' : 'border-gray-100'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-100' : alert.severity === 'WARNING' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <SevIcon className={`w-5 h-5 ${
                    alert.severity === 'CRITICAL' ? 'text-red-600' : alert.severity === 'WARNING' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${severityStyles[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {typeLabels[alert.type] || alert.type}
                    </span>
                    {alert.resolved && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                    {alert.vehicle && (
                      <span className="text-[10px] text-gray-400">{alert.vehicle.vehicleNumber}</span>
                    )}
                    {alert.shipment && (
                      <span className="text-[10px] text-gray-400">{alert.shipment.shipmentNumber}</span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!alert.resolved && (
                  <button
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
