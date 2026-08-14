import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentListPage from './pages/ShipmentListPage';
import CreateShipmentPage from './pages/CreateShipmentPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import AllocateVehiclePage from './pages/AllocateVehiclePage';
import RouteOptimizationPage from './pages/RouteOptimizationPage';
import FleetPage from './pages/FleetPage';
import FleetDetailPage from './pages/FleetDetailPage';
import DriverListPage from './pages/DriverListPage';
import DriverDetailPage from './pages/DriverDetailPage';
import RoutesPage from './pages/RoutesPage';
import RouteDetailPage from './pages/RouteDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import DriverDashboardPage from './pages/DriverDashboardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="shimmer w-16 h-16 rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentListPage />} />
        <Route path="shipments/new" element={<CreateShipmentPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="shipments/:id/allocate" element={<AllocateVehiclePage />} />
        <Route path="shipments/:id/route" element={<RouteOptimizationPage />} />
        <Route path="shipments/:id/track" element={<ShipmentDetailPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="fleet/:id" element={<FleetDetailPage />} />
        <Route path="drivers" element={<DriverListPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="routes/:id" element={<RouteDetailPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="driver-dashboard" element={<DriverDashboardPage />} />
        <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500 mt-2">Application settings coming soon.</p></div>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
