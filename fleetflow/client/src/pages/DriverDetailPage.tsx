import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driverAPI } from '../services/api';
import { Driver, Vehicle, Shipment } from '../types';
import {
  ArrowLeft, Star, Phone, Mail, CreditCard, Award,
  Truck, AlertCircle, MapPin, Package, Calendar, Activity,
  Clock, Navigation, CheckCircle2, AlertTriangle, ArrowRight,
  User as UserCircleIcon
} from 'lucide-react';

interface DriverDetail extends Driver {
  user?: { email: string; name: string } | null;
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driverAPI.get(id!),
    enabled: !!id,
  });

  const driver: DriverDetail | null = data?.data?.data || null;

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'DRIVING': return 'bg-blue-100 text-blue-700';
      case 'ON_BREAK': return 'bg-amber-100 text-amber-700';
      case 'OFFLINE': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'ASSIGNED': return 'bg-amber-100 text-amber-700';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-700';
      case 'OFFLINE': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      case 'ASSIGNED': return 'bg-amber-100 text-amber-700';
      case 'PICKED_UP': return 'bg-cyan-100 text-cyan-700';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-700';
      case 'DELAYED': return 'bg-red-100 text-red-700';
      case 'ARRIVING': return 'bg-violet-100 text-violet-700';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-600';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="shimmer h-8 w-8 rounded-full" />
          <div className="shimmer h-8 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="shimmer h-64 rounded-xl" />
          <div className="shimmer h-64 rounded-xl" />
          <div className="shimmer h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <button 
          onClick={() => navigate('/drivers')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Drivers
        </button>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Driver not found</h3>
          <p className="text-sm text-gray-500 mb-4">The driver you are looking for does not exist or an error occurred.</p>
          <button 
            onClick={() => navigate('/drivers')} 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Go to Drivers List
          </button>
        </div>
      </div>
    );
  }

  const shipments = driver.shipments || [];
  const activeShipments = shipments.filter(s => !['DELIVERED', 'CANCELLED'].includes(s.status));
  const completedShipments = shipments.filter(s => ['DELIVERED', 'CANCELLED'].includes(s.status));

  // Find current trip (first active shipment that is somewhat in transit)
  const currentTrip = activeShipments.find(s => ['IN_TRANSIT', 'ASSIGNED', 'PICKED_UP', 'DELAYED', 'ARRIVING'].includes(s.status));

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/drivers')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {driver.name}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDriverStatusColor(driver.status)}`}>
              {driver.status.replace('_', ' ')}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCircleIcon className="h-5 w-5 text-gray-400" />
              Driver Profile
            </h2>
            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md text-sm font-medium">
              <Star className="h-4 w-4 fill-current" />
              {driver.rating.toFixed(1)}
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-900">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {driver.phone}
                  </div>
                  {driver.user?.email && (
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {driver.user.email}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Details</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-900">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500 mr-1">License:</span>
                    {driver.licenseNumber}
                  </div>
                  <div className="flex items-center text-sm text-gray-900">
                    <Award className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500 mr-1">Trips Completed:</span>
                    {driver.tripsCompleted}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Vehicle Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-400" />
              Assigned Vehicle
            </h2>
          </div>
          <div className="p-5">
            {driver.vehicle ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{driver.vehicle.vehicleNumber}</h3>
                    <p className="text-sm text-gray-500 capitalize">{driver.vehicle.vehicleType.replace('_', ' ').toLowerCase()}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleStatusColor(driver.vehicle.status)}`}>
                    {driver.vehicle.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="text-sm font-medium text-gray-900">{driver.vehicle.capacity} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Load</p>
                    <p className="text-sm font-medium text-gray-900">{driver.vehicle.currentLoad} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fuel Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{driver.vehicle.fuelType.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                  <Truck className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No Vehicle Assigned</h3>
                <p className="text-xs text-gray-500 max-w-[200px]">This driver does not currently have an assigned vehicle.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Trip Section */}
      {currentTrip && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden border-l-4 border-l-primary-500">
          <div className="px-5 py-4 border-b border-gray-100 bg-primary-50/30 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary-500" />
              Current Trip
            </h2>
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(currentTrip.priority)}`}>
                {currentTrip.priority}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShipmentStatusColor(currentTrip.status)}`}>
                {currentTrip.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Shipment Number</p>
                <p className="text-base font-bold text-gray-900">{currentTrip.shipmentNumber}</p>
              </div>
              
              <div className="flex-1 w-full flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate">{currentTrip.pickupLocation}</span>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full h-0.5 bg-gray-200 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                      <Truck className="h-4 w-4 text-primary-500" />
                    </div>
                  </div>
                  {currentTrip.route?.eta && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ETA: {new Date(currentTrip.route.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  )}
                </div>
                
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">{currentTrip.destination}</span>
                    <MapPin className="h-4 w-4 text-primary-500" />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/shipments/${currentTrip.id}`)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 whitespace-nowrap"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipment History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            Shipment History
          </h2>
        </div>
        
        {shipments.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Shipments Found</h3>
            <p className="text-sm text-gray-500">This driver hasn't been assigned any shipments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment Number</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="relative px-5 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeShipments.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/shipments/${s.id}`)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{s.shipmentNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center text-sm text-gray-500 gap-2">
                        <span className="truncate max-w-[150px]">{s.pickupLocation}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{s.destination}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getShipmentStatusColor(s.status)}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(s.priority)}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600 ml-auto" />
                    </td>
                  </tr>
                ))}
                
                {completedShipments.length > 0 && activeShipments.length > 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed & Cancelled
                    </td>
                  </tr>
                )}
                
                {completedShipments.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors opacity-75"
                    onClick={() => navigate(`/shipments/${s.id}`)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{s.shipmentNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center text-sm text-gray-500 gap-2">
                        <span className="truncate max-w-[150px]">{s.pickupLocation}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{s.destination}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getShipmentStatusColor(s.status)}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(s.priority)}`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
