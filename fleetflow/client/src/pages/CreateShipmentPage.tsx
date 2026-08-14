import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipmentAPI } from '../services/api';
import { Package, MapPin, Weight, Boxes, Clock, ArrowRight, AlertCircle } from 'lucide-react';

const LOCATIONS = [
  { name: 'Delhi Warehouse, Connaught Place', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai Port, JNPT', lat: 19.0760, lng: 72.8777 },
  { name: 'Jaipur Distribution Center', lat: 26.9124, lng: 75.7873 },
  { name: 'Bangalore Tech Park', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai Trade Center', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad HITEC City', lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata Salt Lake', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune Industrial Area', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad Textile Hub', lat: 23.0225, lng: 72.5714 },
  { name: 'Chandigarh Central', lat: 30.7333, lng: 76.7794 },
  { name: 'Lucknow Central', lat: 26.8467, lng: 80.9462 },
  { name: 'Hubli Market', lat: 15.3173, lng: 75.7139 },
];

export default function CreateShipmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    shipmentNumber: `SH-${Math.floor(2000 + Math.random() * 8000)}`,
    pickupLocation: '',
    pickupLatitude: '',
    pickupLongitude: '',
    destination: '',
    destinationLatitude: '',
    destinationLongitude: '',
    cargoType: 'General',
    weight: '',
    packageCount: '',
    priority: 'MEDIUM',
    deadline: '',
  });

  const setLocation = (field: 'pickup' | 'destination', loc: typeof LOCATIONS[0]) => {
    if (field === 'pickup') {
      setForm(f => ({ ...f, pickupLocation: loc.name, pickupLatitude: String(loc.lat), pickupLongitude: String(loc.lng) }));
    } else {
      setForm(f => ({ ...f, destination: loc.name, destinationLatitude: String(loc.lat), destinationLongitude: String(loc.lng) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.pickupLocation || !form.destination) { setError('Please select both pickup and destination locations'); return; }
    if (!form.weight || parseFloat(form.weight) <= 0) { setError('Weight must be greater than 0'); return; }
    if (!form.packageCount || parseInt(form.packageCount) <= 0) { setError('Package count must be greater than 0'); return; }
    if (!form.deadline) { setError('Delivery deadline is required'); return; }
    if (new Date(form.deadline) <= new Date()) { setError('Deadline must be in the future'); return; }
    if (form.pickupLocation === form.destination) { setError('Pickup and destination must be different'); return; }

    setLoading(true);
    try {
      const res = await shipmentAPI.create(form);
      navigate(`/shipments/${res.data.data.id}/allocate`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  // Default deadline: 6 hours from now
  const defaultDeadline = () => {
    const d = new Date(Date.now() + 6 * 3600000);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the shipment details to begin the allocation process</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Shipment Info */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-500" /> Shipment Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shipment Number</label>
              <input type="text" value={form.shipmentNumber} onChange={e => setForm(f => ({ ...f, shipmentNumber: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cargo Type</label>
              <select value={form.cargoType} onChange={e => setForm(f => ({ ...f, cargoType: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                {['General', 'Electronics', 'Textiles', 'FMCG', 'Auto Parts', 'Pharmaceuticals', 'Food Products', 'Chemicals', 'Machinery', 'Precious Goods', 'Steel'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-500" /> Locations
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location</label>
              <select value={form.pickupLocation} onChange={e => { const loc = LOCATIONS.find(l => l.name === e.target.value); if (loc) setLocation('pickup', loc); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                <option value="">Select pickup location</option>
                {LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
              <select value={form.destination} onChange={e => { const loc = LOCATIONS.find(l => l.name === e.target.value); if (loc) setLocation('destination', loc); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                <option value="">Select destination</option>
                {LOCATIONS.filter(l => l.name !== form.pickupLocation).map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Weight className="w-4 h-4 text-primary-500" /> Cargo Details
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (tons)</label>
              <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} min="0.1" step="0.1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="e.g. 6" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Package Count</label>
              <input type="number" value={form.packageCount} onChange={e => setForm(f => ({ ...f, packageCount: e.target.value }))} min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="e.g. 45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deadline */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" /> Delivery Timeline
          </h2>
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Deadline</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
            <button type="button" onClick={() => setForm(f => ({ ...f, deadline: defaultDeadline() }))} className="text-xs text-primary-600 mt-1 hover:underline">
              Set 6 hours from now
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="p-6 flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/shipments')} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create & Find Vehicle <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
