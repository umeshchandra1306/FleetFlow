import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shipmentAPI } from '../services/api';
import { Truck, CheckCircle, XCircle, Star, MapPin, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import type { AllocationScore } from '../types';

export default function AllocateVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<AllocationScore | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const { data: shipmentData } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => (await shipmentAPI.get(id!)).data.data,
  });

  const { data: allocationData, isLoading } = useQuery({
    queryKey: ['allocate', id],
    queryFn: async () => (await shipmentAPI.allocate(id!)).data.data,
    enabled: !!id,
  });

  const handleAssign = async () => {
    if (!selectedVehicle || !id) return;
    setAssigning(true);
    setError('');
    try {
      await shipmentAPI.assign(id, {
        vehicleId: selectedVehicle.vehicleId,
        driverId: selectedVehicle.driverId || undefined,
      });
      navigate(`/shipments/${id}/route`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign vehicle');
    } finally {
      setAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Finding suitable vehicles...</p>
        </div>
      </div>
    );
  }

  const recommended = allocationData?.recommended;
  const alternatives = allocationData?.alternatives || [];
  const disqualified = allocationData?.disqualified || [];

  // Auto-select recommended
  if (recommended && !selectedVehicle) {
    setSelectedVehicle(recommended);
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Smart Vehicle Allocation</h1>
        <p className="text-sm text-gray-500 mt-1">
          {shipmentData?.shipmentNumber}: {shipmentData?.pickupLocation?.split(',')[0]} → {shipmentData?.destination?.split(',')[0]} · {shipmentData?.weight}t · {shipmentData?.priority}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended */}
        {recommended && (
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Recommended Vehicle
            </h2>
            <div
              onClick={() => setSelectedVehicle(recommended)}
              className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${
                selectedVehicle?.vehicleId === recommended.vehicleId
                  ? 'border-primary-500 shadow-lg shadow-primary-500/10 ring-2 ring-primary-500/20'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-7 h-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{recommended.vehicleNumber}</h3>
                    <p className="text-sm text-gray-500">{recommended.vehicleType} · Driver: {recommended.driverName || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{recommended.totalScore}<span className="text-lg text-gray-400">/100</span></div>
                  <p className="text-xs text-gray-500">Allocation Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900">{recommended.availableCapacity}t / {recommended.capacity}t</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(recommended.capacityScore / 30) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Distance to Pickup</p>
                  <p className="text-sm font-semibold text-gray-900">{recommended.distanceToPickup} km</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(recommended.distanceScore / 25) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Availability</p>
                  <p className="text-sm font-semibold text-gray-900">Available Now</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(recommended.availabilityScore / 20) * 100}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Deadline Feasibility</p>
                  <p className="text-sm font-semibold text-gray-900">Can Meet</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(recommended.deadlineScore / 25) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {recommended.reasons.map((r: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" /> {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Alternative Vehicles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alternatives.map((v: AllocationScore) => (
                <div
                  key={v.vehicleId}
                  onClick={() => setSelectedVehicle(v)}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selectedVehicle?.vehicleId === v.vehicleId ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{v.vehicleNumber}</span>
                    </div>
                    <span className="text-lg font-bold text-primary-600">{v.totalScore}</span>
                  </div>
                  <p className="text-xs text-gray-500">{v.vehicleType} · {v.driverName}</p>
                  <p className="text-xs text-gray-500 mt-1">Capacity: {v.availableCapacity}t · {v.distanceToPickup} km away</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disqualified */}
        {disqualified.length > 0 && (
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Unavailable Vehicles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
              {disqualified.map((v: AllocationScore) => (
                <div key={v.vehicleId} className="bg-gray-50 rounded-lg p-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-gray-700">{v.vehicleNumber}</span>
                  </div>
                  <p className="text-xs text-red-500 mt-1">{v.disqualifyReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={() => navigate('/shipments')} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
        <button
          onClick={handleAssign}
          disabled={!selectedVehicle || assigning}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {assigning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Assign & Optimize Route <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
