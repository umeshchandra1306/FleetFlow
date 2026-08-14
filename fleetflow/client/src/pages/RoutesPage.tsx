import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { routeAPI } from '../services/api';
import type { Route } from '../types';
import {
  Route as RouteIcon,
  Search,
  Filter,
  X,
  ChevronRight,
  AlertCircle,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Truck,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DEVIATED', label: 'Deviated' },
] as const;

const statusColors: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DEVIATED: 'bg-red-100 text-red-700',
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

export default function RoutesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const queryParams: Record<string, string> = {};
  if (statusFilter !== 'all') queryParams.status = statusFilter;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['routes', queryParams],
    queryFn: () => routeAPI.list(queryParams),
  });

  const routes: Route[] = data?.data?.data || [];

  // Client-side search filter
  const filteredRoutes = search
    ? routes.filter((r) => {
        const q = search.toLowerCase();
        const shipNum = (r.shipment as any)?.shipmentNumber?.toLowerCase() || '';
        const vehicleNum = (r.vehicle as any)?.vehicleNumber?.toLowerCase() || '';
        return (
          shipNum.includes(q) ||
          vehicleNum.includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      })
    : routes;

  const totalRoutes = routes.length;
  const activeCount = routes.filter((r) => r.status === 'ACTIVE').length;
  const plannedCount = routes.filter((r) => r.status === 'PLANNED').length;
  const completedCount = routes.filter((r) => r.status === 'COMPLETED').length;
  const deviatedCount = routes.filter((r) => r.status === 'DEVIATED').length;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all';

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-5 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 mb-2">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Failed to load routes</h3>
          <p className="text-gray-500">Please try again later or contact support.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Route management and optimization</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-primary-500 text-white p-3 rounded-lg">
            <RouteIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Routes</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : totalRoutes}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-blue-500 text-white p-3 rounded-lg">
            <Navigation size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-gray-500 text-white p-3 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Planned</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : plannedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-emerald-500 text-white p-3 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : completedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-red-500 text-white p-3 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Deviated</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : deviatedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by shipment or vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-primary-500 focus:border-primary-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 font-medium">Shipment</th>
                <th className="px-5 py-3.5 font-medium">Vehicle</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Distance</th>
                <th className="px-5 py-3.5 font-medium">Duration</th>
                <th className="px-5 py-3.5 font-medium">ETA</th>
                <th className="px-5 py-3.5 font-medium">Created</th>
                <th className="px-5 py-3.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-28 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-6 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-16 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-4 rounded" /></td>
                  </tr>
                ))
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <RouteIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-gray-500 font-medium">No routes found matching your criteria.</div>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  const shipment = route.shipment as any;
                  const vehicle = route.vehicle as any;
                  const displayDistance = route.optimizedDistance || route.distance;
                  const displayDuration = route.optimizedDuration || route.estimatedDuration;

                  return (
                    <tr
                      key={route.id}
                      onClick={() => navigate(`/routes/${route.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        {shipment ? (
                          <div>
                            <div className="font-medium text-gray-900">{shipment.shipmentNumber}</div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]" title={shipment.destination}>
                              {shipment.pickupLocation} → {shipment.destination}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">No shipment</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {vehicle ? (
                          <div className="flex items-center space-x-2">
                            <Truck size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-900">{vehicle.vehicleNumber}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            statusColors[route.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {route.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDistance(displayDistance)}
                        {route.optimizedDistance && route.optimizedDistance < route.distance && (
                          <div className="text-xs text-emerald-600 mt-0.5">
                            {((1 - route.optimizedDistance / route.distance) * 100).toFixed(0)}% saved
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {formatDuration(displayDuration)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {route.eta ? (
                          <div>
                            <div className="text-sm">{new Date(route.eta).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(route.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-sm">
                        {new Date(route.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronRight className="inline-block h-5 w-5 text-gray-400" />
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
