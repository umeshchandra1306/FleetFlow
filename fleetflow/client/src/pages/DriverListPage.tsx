import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverAPI } from '../services/api';
import { Driver } from '../types';
import {
  Users, Search, Filter, ChevronDown, X, ArrowRight,
  AlertTriangle, Star, Truck, Phone, CreditCard,
  UserCheck, UserX, Coffee, Activity
} from 'lucide-react';

export default function DriverListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const queryParams: Record<string, string> = {};
  if (statusFilter !== 'all') {
    queryParams.status = statusFilter;
  }
  if (searchTerm) {
    queryParams.search = searchTerm;
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['drivers', queryParams],
    queryFn: () => driverAPI.list(queryParams),
  });

  const drivers: Driver[] = data?.data?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'DRIVING': return 'bg-blue-100 text-blue-700';
      case 'ON_BREAK': return 'bg-amber-100 text-amber-700';
      case 'OFFLINE': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.status === 'AVAILABLE').length;
  const drivingCount = drivers.filter(d => d.status === 'DRIVING').length;
  const onBreakCount = drivers.filter(d => d.status === 'ON_BREAK').length;
  const offlineCount = drivers.filter(d => d.status === 'OFFLINE').length;

  if (isError) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load drivers</h3>
          <p className="text-sm text-gray-500 mb-4">There was an error connecting to the server.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your fleet's driver personnel</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-500 text-white rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : totalDrivers}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-lg">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Available</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : availableCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Driving</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : drivingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-lg">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">On Break</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : onBreakCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-gray-500 text-white rounded-lg">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Offline</p>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '-' : offlineCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative inline-block text-left">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="DRIVING">Driving</option>
              <option value="ON_BREAK">On Break</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="p-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg flex items-center"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Trips</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Vehicle</th>
                <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Shipments</th>
                <th scope="col" className="relative px-5 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="shimmer h-10 w-40 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-6 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-8 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-6 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer h-6 w-12 rounded" /></td>
                    <td className="px-5 py-4"></td>
                  </tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">No drivers found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                      {(searchTerm || statusFilter !== 'all') && (
                        <button onClick={clearFilters} className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr 
                    key={driver.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/drivers/${driver.id}`)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{driver.name}</span>
                        <span className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {driver.licenseNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-current mr-1" />
                          {driver.rating.toFixed(1)}
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5">{driver.tripsCompleted} trips</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {driver.vehicle ? (
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Truck className="h-4 w-4 text-gray-400 mr-2" />
                          {driver.vehicle.vehicleNumber}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.shipments?.length || 0}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600 ml-auto" />
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
