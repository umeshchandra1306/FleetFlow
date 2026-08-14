import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shipmentAPI } from '../services/api';
import {
  Package, Plus, Search, Filter, ArrowRight,
  MapPin, Truck, Clock, AlertTriangle, Loader2,
  ChevronDown, X,
} from 'lucide-react';
import type { Shipment } from '../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'ARRIVING', label: 'Arriving' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const;

const statusColors: Record<string, string> = {
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

const priorityDots: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: shipments, isLoading, isError, error } = useQuery<Shipment[]>({
    queryKey: ['shipments', statusFilter, priorityFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();
      const res = await shipmentAPI.list(params);
      return res.data.data as Shipment[];
    },
  });

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all';

  const formatDeadline = (deadline: string): string => {
    const d = new Date(deadline);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffH = Math.floor(diffMs / 3600000);

    if (diffMs < 0) return 'Overdue';
    if (diffH < 1) return `${Math.max(0, Math.floor(diffMs / 60000))}m left`;
    if (diffH < 24) return `${diffH}h left`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDeadlineColor = (deadline: string, status: string): string => {
    if (status === 'DELIVERED' || status === 'CANCELLED') return 'text-gray-400';
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs < 0) return 'text-red-600 font-semibold';
    if (diffMs < 3600000) return 'text-red-500';
    if (diffMs < 10800000) return 'text-amber-600';
    return 'text-gray-600';
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="shimmer h-7 w-40 rounded-lg" />
            <div className="shimmer h-4 w-56 rounded-lg mt-2" />
          </div>
          <div className="shimmer h-10 w-36 rounded-lg" />
        </div>
        <div className="shimmer h-12 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Failed to Load Shipments</h2>
          <p className="text-sm text-gray-500 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const list = shipments ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list.length} shipment{list.length !== 1 ? 's' : ''}
            {hasActiveFilters ? ' matching filters' : ' total'}
          </p>
        </div>
        <button
          onClick={() => navigate('/shipments/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Shipment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by number, location, cargo..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white min-w-[160px]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white min-w-[150px]"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">
            {hasActiveFilters ? 'No matching shipments' : 'No shipments yet'}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query.'
              : 'Create your first shipment to get started.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => navigate('/shipments/new')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Create Shipment
            </button>
          )}
        </div>
      ) : (
        /* Shipment Table */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Shipment</th>
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Cargo</th>
                  <th className="px-5 py-3 font-medium">Vehicle / Driver</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Deadline</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    {/* Shipment number */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{s.shipmentNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    </td>

                    {/* Route */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 truncate max-w-[200px]">
                            {s.pickupLocation.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            → {s.destination.split(',')[0]}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{s.cargoType}</p>
                      <p className="text-xs text-gray-500">{s.weight}t · {s.packageCount} pkg</p>
                    </td>

                    {/* Vehicle / Driver */}
                    <td className="px-5 py-3.5">
                      {s.vehicle ? (
                        <div className="flex items-start gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{s.vehicle.vehicleNumber}</p>
                            <p className="text-xs text-gray-500">{s.driver?.name ?? 'No driver'}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDots[s.priority] ?? 'bg-gray-400'}`} />
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[s.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                          {s.priority}
                        </span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className={`text-xs ${getDeadlineColor(s.deadline, s.status)}`}>
                          {formatDeadline(s.deadline)}
                        </span>
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-3.5">
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
