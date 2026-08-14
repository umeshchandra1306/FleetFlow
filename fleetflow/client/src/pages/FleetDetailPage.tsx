import { Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FleetDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Details</h1>
        <p className="text-sm text-gray-500 mt-0.5">Detailed vehicle information</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <Construction className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Coming Soon</h2>
        <p className="text-sm text-gray-500 mb-4">Vehicle detail page is under development.</p>
        <button
          onClick={() => navigate('/fleet')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Back to Fleet
        </button>
      </div>
    </div>
  );
}
