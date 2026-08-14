import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotificationSocket } from '../hooks/useSocket';
import { notificationAPI, searchAPI } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Package, Truck, Users, Route, BarChart3,
  AlertTriangle, Settings, LogOut, Menu, X, Bell, Search,
  ChevronDown, Zap
} from 'lucide-react';
import type { SearchResult } from '../types';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/shipments', icon: Package, label: 'Shipments' },
  { to: '/fleet', icon: Truck, label: 'Fleet' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/routes', icon: Route, label: 'Routes' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
];

export default function AppLayout() {
  const { user, logout, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; title: string; message: string; type: string }[]>([]);

  // Notifications query
  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationAPI.list()).data.data,
    refetchInterval: 30000,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // Real-time notifications
  useNotificationSocket((data) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...data }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    refetchNotifs();
  });

  // Search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.search(searchQuery);
        setSearchResults(res.data.data.results);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchClick = (result: SearchResult) => {
    setShowSearch(false);
    setSearchQuery('');
    const paths: Record<string, string> = {
      shipment: `/shipments/${result.id}`,
      vehicle: `/fleet/${result.id}`,
      driver: `/drivers/${result.id}`,
      route: `/routes/${result.id}`,
    };
    navigate(paths[result.type] || '/dashboard');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setShowNotifications(false);
      setShowUserMenu(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Redirect driver to driver dashboard
  useEffect(() => {
    if (isDriver && location.pathname === '/dashboard') {
      navigate('/driver-dashboard');
    }
  }, [isDriver, location.pathname, navigate]);

  const driverNavItems = [
    { to: '/driver-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { to: '/shipments', icon: Package, label: 'Shipments' },
    { to: '/routes', icon: Route, label: 'Routes' },
  ];

  const currentNavItems = isDriver ? driverNavItems : navItems;

  return (
    <div className="flex h-screen bg-surface-secondary overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col transition-sidebar bg-sidebar-bg ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.07] flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">FleetFlow</h1>
              <p className="text-sidebar-text text-[10px] uppercase tracking-[0.15em] font-medium">Fleet Command</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {currentNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-sidebar-text hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span className="text-[13px] font-medium tracking-wide">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="px-3 py-4 border-t border-white/[0.07]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-text hover:bg-white/[0.06] hover:text-white transition-colors w-full"
          >
            <Menu className="w-[18px] h-[18px] flex-shrink-0" />
            {sidebarOpen && <span className="text-[13px]">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar-bg z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-white font-bold text-lg tracking-tight">FleetFlow</h1>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-sidebar-text hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-5 px-3 space-y-0.5">
              {currentNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive ? 'bg-white/[0.12] text-white' : 'text-sidebar-text hover:bg-white/[0.06] hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="text-[13px] font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-topbar sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors">
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shipments, vehicles, drivers..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="w-72 lg:w-96 pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15 focus:border-primary-400 focus:bg-white transition-all duration-200"
              />
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-dropdown border border-gray-100 z-50 max-h-80 overflow-y-auto">
                  {searchResults.map(r => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSearchClick(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 tracking-wide">
                        {r.type}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500">{r.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-gray-100 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => { await notificationAPI.markAllRead(); refetchNotifs(); }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n: any) => (
                      <div key={n.id} className={`px-4 py-3 border-b border-gray-50 transition-colors ${!n.read ? 'bg-primary-50/40' : 'hover:bg-gray-50'}`}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 hidden md:block" />

            {/* User Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-xl flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-dropdown border border-gray-100 z-50 py-1.5">
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-enter bg-white rounded-xl shadow-dropdown border border-gray-100 p-4 max-w-sm flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              toast.type === 'alert' ? 'bg-red-500' : toast.type === 'delivery' ? 'bg-green-500' : 'bg-primary-500'
            }`} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
