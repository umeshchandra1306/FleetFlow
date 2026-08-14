import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehicleAPI } from '../services/api';
import { Vehicle } from '../types';
import { 
  Truck, 
  Search, 
  Filter, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  WifiOff,
  Navigation,
  Loader2,
  Clock
} from 'lucide-react';

export default function FleetPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (statusFilter && statusFilter !== 'all') queryParams.status = statusFilter;
  if (typeFilter && typeFilter !== 'all') queryParams.type = typeFilter;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles', queryParams],
    queryFn: () => vehicleAPI.list(queryParams),
  });

  const vehicles: Vehicle[] = data?.data?.data || [];
  
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const assignedCount = vehicles.filter(v => v.status === 'ASSIGNED').length;
  const inTransitCount = vehicles.filter(v => v.status === 'IN_TRANSIT').length;
  const maintenanceOfflineCount = vehicles.filter(v => ['MAINTENANCE', 'OFFLINE'].includes(v.status)).length;
  
  const uniqueTypes = Array.from(new Set(vehicles.map(v => v.vehicleType))).filter(Boolean);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'ASSIGNED': return 'bg-amber-100 text-amber-700';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700';
      case 'IDLE': return 'bg-gray-100 text-gray-700';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-700';
      case 'OFFLINE': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all';

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-5 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 mb-2">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Failed to load fleet data</h3>
          <p className="text-gray-500">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-primary-500 text-white p-3 rounded-lg">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Vehicles</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : totalVehicles}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-emerald-500 text-white p-3 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Available</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : availableCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-amber-500 text-white p-3 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Assigned</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : assignedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-blue-500 text-white p-3 rounded-lg">
            <Navigation size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">In Transit</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : inTransitCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center space-x-4">
          <div className="bg-orange-500 text-white p-3 rounded-lg">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Maintenance</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : maintenanceOfflineCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by vehicle number..."
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
            <option value="all">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="IDLE">Idle</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OFFLINE">Offline</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm py-2 pl-3 pr-8 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 font-medium">Vehicle</th>
                <th className="px-5 py-3.5 font-medium">Type</th>
                <th className="px-5 py-3.5 font-medium">Capacity / Load</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Fuel</th>
                <th className="px-5 py-3.5 font-medium">Driver</th>
                <th className="px-5 py-3.5 font-medium">Location</th>
                <th className="px-5 py-3.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-32 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-6 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-16 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-32 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-4 w-4 rounded" /></td>
                  </tr>
                ))
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Truck className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-gray-500 font-medium">No vehicles found matching your criteria.</div>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => {
                  const utilPercent = (vehicle.currentLoad / vehicle.capacity) * 100;
                  
                  return (
                    <tr 
                      key={vehicle.id} 
                      onClick={() => navigate(`/fleet/${vehicle.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{vehicle.vehicleNumber}</div>
                        {vehicle.shipments && vehicle.shipments.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{vehicle.shipments.length} active shipment(s)</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 capitalize">
                        {vehicle.vehicleType.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 min-w-[100px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-900 font-medium">{vehicle.currentLoad}kg</span>
                              <span className="text-gray-500">{vehicle.capacity}kg</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${utilPercent > 90 ? 'bg-red-500' : utilPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(utilPercent, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 capitalize">
                        {vehicle.fuelType.toLowerCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        {vehicle.driver ? (
                          <span className="text-gray-900 font-medium">{vehicle.driver.name}</span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-900">
                          {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
                        </div>
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
