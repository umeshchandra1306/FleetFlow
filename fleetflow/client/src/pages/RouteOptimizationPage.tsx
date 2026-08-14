import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shipmentAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Route as RouteIcon, TrendingDown, Clock, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export default function RouteOptimizationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);

  const { data: shipment } = useQuery({
    queryKey: ['shipment', id],
    queryFn: async () => (await shipmentAPI.get(id!)).data.data,
  });

  const handleOptimize = async () => {
    if (!id) return;
    setOptimizing(true);
    try {
      const res = await shipmentAPI.optimize(id);
      setOptimization(res.data.data.optimization);
      setRouteData(res.data.data.route);
    } catch (err) {
      console.error('Optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const routePoints = routeData?.routePoints || shipment?.route?.routePoints || [];
  const positions = routePoints.map((p: any) => [p.latitude, p.longitude] as [number, number]);

  const greenIcon = L.divIcon({
    className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    html: '<div style="width:28px;height:28px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4)">📦</div>',
  });
  const redIcon = L.divIcon({
    className: '', iconSize: [28, 28], iconAnchor: [14, 14],
    html: '<div style="width:28px;height:28px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.4)">📍</div>',
  });

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Route Optimization</h1>
        <p className="text-sm text-gray-500 mt-1">{shipment?.shipmentNumber}: {shipment?.pickupLocation?.split(',')[0]} → {shipment?.destination?.split(',')[0]}</p>
      </div>

      {!optimization && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <RouteIcon className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Optimize</h2>
          <p className="text-sm text-gray-500 mb-6">Click below to calculate the optimal route for this shipment</p>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {optimizing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Optimizing route...</>
            ) : (
              <><RouteIcon className="w-5 h-5" /> Optimize Route</>
            )}
          </button>
        </div>
      )}

      {optimization && (
        <>
          {/* Metrics */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Original Route</p>
              <p className="text-2xl font-bold text-gray-900">{optimization.distance} km</p>
              <p className="text-sm text-gray-500">{Math.floor(optimization.duration / 60)}h {optimization.duration % 60}m</p>
            </div>
            <div className="bg-white rounded-xl border border-primary-200 p-5 ring-1 ring-primary-100">
              <p className="text-xs text-primary-600 uppercase tracking-wider mb-1">Optimized Route</p>
              <p className="text-2xl font-bold text-primary-600">{optimization.optimizedDistance} km</p>
              <p className="text-sm text-primary-500">{Math.floor(optimization.optimizedDuration / 60)}h {optimization.optimizedDuration % 60}m</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Distance Saved</p>
              <p className="text-2xl font-bold text-emerald-700">{optimization.distanceSaved} km</p>
              <p className="text-sm text-emerald-600">{optimization.distanceSavedPercent}% reduction</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time Saved</p>
              <p className="text-2xl font-bold text-emerald-700">{optimization.timeSaved} min</p>
              <p className="text-sm text-emerald-600">{optimization.timeSavedPercent}% faster</p>
            </div>
          </div>

          {/* Map */}
          {positions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary-500" />
                <h2 className="font-semibold text-gray-900">Optimized Route Map</h2>
              </div>
              <div className="h-[400px]">
                <MapContainer
                  center={positions[Math.floor(positions.length / 2)] || [22.5, 78.5]}
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  {shipment && <Marker position={[shipment.pickupLatitude, shipment.pickupLongitude]} icon={greenIcon}><Popup>Pickup: {shipment.pickupLocation}</Popup></Marker>}
                  {shipment && <Marker position={[shipment.destinationLatitude, shipment.destinationLongitude]} icon={redIcon}><Popup>Destination: {shipment.destination}</Popup></Marker>}
                  <Polyline positions={positions} color="#4f46e5" weight={4} opacity={0.8} />
                </MapContainer>
              </div>
            </div>
          )}

          {/* ETA */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Estimated Arrival</h3>
            </div>
            <p className="text-lg font-bold text-primary-600">{new Date(optimization.eta).toLocaleString()}</p>
            {shipment?.deadline && (
              <p className="text-sm text-gray-500 mt-1">
                Deadline: {new Date(shipment.deadline).toLocaleString()}
                {new Date(optimization.eta) <= new Date(shipment.deadline) ? (
                  <span className="text-emerald-600 ml-2 font-medium">✓ On track</span>
                ) : (
                  <span className="text-red-600 ml-2 font-medium">⚠ At risk</span>
                )}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => navigate(`/shipments/${id}`)} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              View Shipment Details
            </button>
            <button
              onClick={() => navigate(`/shipments/${id}`)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Confirm Assignment
            </button>
          </div>
        </>
      )}
    </div>
  );
}
