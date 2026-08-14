import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehicleAPI } from '../services/api';
import { Vehicle, Driver, Shipment, TrackingEvent, Alert } from '../types';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  User, 
  Phone, 
  Star,
  Package,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface VehicleDetail extends Vehicle {
  trackingEvents?: TrackingEvent[];
  alerts?: Alert[];
  totalShipments?: number;
  completedShipments?: number;
  utilization?: number;
}

export default function FleetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehicleAPI.get(id!),
    enabled: !!id,
  });

  const vehicle: VehicleDetail | undefined = data?.data?.data;

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

  const getAlertSeverity = (severity: string) => {
    switch (severity) {
      case 'INFO': return { bg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', icon: Info };
      case 'WARNING': return { bg: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: AlertTriangle };
      case 'CRITICAL': return { bg: 'bg-red-100 text-red-800', dot: 'bg-red-500', icon: AlertCircle };
      default: return { bg: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500', icon: Info };
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="shimmer h-10 w-10 rounded-lg"></div>
          <div className="shimmer h-8 w-48 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="shimmer h-64 rounded-xl"></div>
          <div className="shimmer h-64 rounded-xl"></div>
          <div className="shimmer h-96 rounded-xl lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 mb-2">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Not Found</h2>
          <p className="text-gray-500">The vehicle you are looking for does not exist or you don't have permission to view it.</p>
          <button 
            onClick={() => navigate('/fleet')}
            className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Fleet
          </button>
        </div>
      </div>
    );
  }

  const utilPercent = (vehicle.currentLoad / vehicle.capacity) * 100;
  const driver = vehicle.driver;
  const shipments = vehicle.shipments || [];
  const trackingEvents = vehicle.trackingEvents || [];
  const alerts = vehicle.alerts || [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/fleet')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{vehicle.vehicleNumber}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
              {vehicle.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {vehicle.vehicleType.toLowerCase().replace('_', ' ')} • {vehicle.fuelType.toLowerCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Truck size={20} className="mr-2 text-primary-500" />
            Vehicle Information
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Capacity</p>
              <p className="font-semibold text-gray-900">{vehicle.capacity} kg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Current Load</p>
              <p className="font-semibold text-gray-900">{vehicle.currentLoad} kg</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Utilization</span>
              <span className="text-gray-900 font-bold">{utilPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${utilPercent > 90 ? 'bg-red-500' : utilPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(utilPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-2 text-gray-400" />
              <span className="text-sm">Current Location</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <User size={20} className="mr-2 text-primary-500" />
            Assigned Driver
          </h2>
          
          {driver ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                  <p className="text-sm text-gray-500">License: {driver.licenseNumber}</p>
                </div>
                <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-md text-amber-700 font-medium text-sm border border-amber-100">
                  <Star size={14} className="fill-current" />
                  <span>{driver.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                    <Phone size={16} />
                  </div>
                  <span>{driver.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                    <Package size={16} />
                  </div>
                  <span>{driver.tripsCompleted || 0} trips</span>
                </div>
              </div>
              
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-500 mr-2">Status:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700`}>
                  {driver.status?.replace('_', ' ') || 'UNKNOWN'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="bg-gray-50 p-4 rounded-full">
                <User size={32} className="text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">No Driver Assigned</p>
                <p className="text-sm text-gray-500">This vehicle is currently unassigned.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Package size={20} className="mr-2 text-primary-500" />
              Assigned Shipments ({shipments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Shipment ID</th>
                  <th className="px-5 py-3.5 font-medium">Destination</th>
                  <th className="px-5 py-3.5 font-medium">Priority</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      No active shipments assigned to this vehicle.
                    </td>
                  </tr>
                ) : (
                  shipments.map((shipment: any) => (
                    <tr 
                      key={shipment.id} 
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {shipment.shipmentNumber}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 truncate max-w-[200px]" title={shipment.destinationAddress}>
                        {shipment.destinationAddress}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
                          {shipment.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getShipmentStatusColor(shipment.status)}`}>
                          {shipment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(shipment.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Navigation size={20} className="mr-2 text-primary-500" />
            Recent Tracking Events
          </h2>
          
          <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gray-100">
            {trackingEvents.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">No tracking data available.</p>
            ) : (
              trackingEvents.slice(0, 5).map((event: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] bg-primary-100 p-1 rounded-full border-2 border-white ring-1 ring-gray-100">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">{event.eventType?.replace('_', ' ').toLowerCase() || 'Location Update'}</span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex justify-between">
                      <span>{event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}</span>
                      {event.speed !== undefined && <span>{event.speed} km/h</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <AlertTriangle size={20} className="mr-2 text-primary-500" />
              Recent Alerts
            </h2>
            
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert: any) => {
                const sev = getAlertSeverity(alert.severity);
                const Icon = sev.icon;
                
                return (
                  <div key={alert.id} className={`p-3 rounded-lg border flex items-start space-x-3 ${alert.resolved ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
                    <div className={`mt-0.5 relative flex items-center justify-center`}>
                       <Icon size={18} className={alert.resolved ? 'text-gray-400' : sev.bg.split(' ')[1]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium ${alert.resolved ? 'text-gray-600' : 'text-gray-900'}`}>
                          {alert.type.replace('_', ' ')}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 truncate ${alert.resolved ? 'text-gray-500' : 'text-gray-600'}`} title={alert.message}>
                        {alert.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${alert.resolved ? 'bg-gray-100 text-gray-500' : sev.bg}`}>
                          {alert.severity}
                        </span>
                        {alert.resolved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-green-50 text-green-600 border border-green-100">
                            <CheckCircle2 size={10} className="mr-1" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
