import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { applyTheme, getSavedTheme, Theme } from '../utils/theme';
import {
  User as UserIcon,
  Palette,
  Bell,
  Layout,
  Check,
  Shield,
  Sun,
  Moon,
  Laptop,
  Save,
  CheckCircle2,
  Mail,
  BadgeCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  // 1. Theme State
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme());

  // 2. Notification Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('fleetflow_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('fleetflow_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 3. Compact Dashboard Mode State
  const [compactDashboard, setCompactDashboard] = useState<boolean>(() => {
    const saved = localStorage.getItem('fleetflow_compact_dashboard');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Feedback Toast state
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showSavedToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // Apply Theme Effect
  useEffect(() => {
    localStorage.setItem('fleetflow_theme', theme);
    applyTheme(theme);
  }, [theme]);

  // Save Notification Preference
  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    localStorage.setItem('fleetflow_notifications', JSON.stringify(value));
    showSavedToast('Notification preferences updated.');
  };

  const handleToggleSound = (value: boolean) => {
    setSoundEnabled(value);
    localStorage.setItem('fleetflow_sound', JSON.stringify(value));
    showSavedToast('Audio preferences updated.');
  };

  // Save Compact Mode Preference
  const handleToggleCompactDashboard = (value: boolean) => {
    setCompactDashboard(value);
    localStorage.setItem('fleetflow_compact_dashboard', JSON.stringify(value));
    showSavedToast('Dashboard layout preference updated.');
  };

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    showSavedToast(`Theme changed to ${newTheme}.`);
  };

  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="page-header-title">Settings & Preferences</h1>
          <p className="page-header-subtitle">Manage system appearance, notifications, and profile details</p>
        </div>
        {savedNotice && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <UserIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Account Profile</h2>
            <p className="text-xs text-slate-500">Your authenticated user details and system role</p>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </div>
            <p className="text-base font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </div>
            <p className="text-base font-bold text-slate-900 truncate">{user?.email || '—'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />
              Access Role
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Palette className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Appearance</h2>
            <p className="text-xs text-slate-500">Choose system theme and visual display modes</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Color Theme
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'system', label: 'System', icon: Laptop },
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
            ].map(item => {
              const IconComponent = item.icon;
              const isSelected = theme === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleThemeChange(item.key as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-150 gap-2.5 text-center ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs font-semibold ring-2 ring-indigo-600/20'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Bell className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">Configure alert channels and in-app sound notifications</p>
          </div>
        </div>

        <div className="p-6 space-y-5 divide-y divide-slate-100">
          {/* Toggle 1: Desktop & In-App Notifications */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-semibold text-slate-900">In-App & Desktop Alerts</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive real-time push banners for critical fleet events</p>
            </div>
            <button
              onClick={() => handleToggleNotifications(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Sound Effects */}
          <div className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Alert Audio Signals</p>
              <p className="text-xs text-slate-500 mt-0.5">Play subtle audio alert on critical status changes</p>
            </div>
            <button
              onClick={() => handleToggleSound(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Customization Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Layout className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Dashboard Layout</h2>
            <p className="text-xs text-slate-500">Configure default display densities and metric spacing</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Compact Dashboard Density</p>
              <p className="text-xs text-slate-500 mt-0.5">Streamline KPI cards and table rows for maximum screen efficiency</p>
            </div>
            <button
              onClick={() => handleToggleCompactDashboard(!compactDashboard)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                compactDashboard ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  compactDashboard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
