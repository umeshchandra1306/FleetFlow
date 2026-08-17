import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleetflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fleetflow_token');
      localStorage.removeItem('fleetflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; role?: string }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Vehicles
export const vehicleAPI = {
  list: (params?: any) => api.get('/vehicles', { params }),
  get: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
};

// Drivers
export const driverAPI = {
  list: (params?: any) => api.get('/drivers', { params }),
  get: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
};

// Shipments
export const shipmentAPI = {
  list: (params?: any) => api.get('/shipments', { params }),
  get: (id: string) => api.get(`/shipments/${id}`),
  create: (data: any) => api.post('/shipments', data),
  update: (id: string, data: any) => api.put(`/shipments/${id}`, data),
  allocate: (id: string) => api.post(`/shipments/${id}/allocate`),
  optimize: (id: string) => api.post(`/shipments/${id}/optimize`),
  assign: (id: string, data: { vehicleId: string; driverId?: string }) => api.post(`/shipments/${id}/assign`, data),
  start: (id: string) => api.post(`/shipments/${id}/start`),
  deliver: (id: string) => api.post(`/shipments/${id}/deliver`),
  updateStatus: (id: string, status: string) => api.post(`/shipments/${id}/status`, { status }),
  simulateDelay: (id: string) => api.post(`/shipments/${id}/simulate-delay`),
  controlSimulation: (action: string, vehicleId: string) => api.post('/shipments/simulation/control', { action, vehicleId }),
  getDriverActive: (driverId: string) => api.get(`/shipments/driver/${driverId}/active`),
};

// Routes
export const routeAPI = {
  list: (params?: any) => api.get('/routes', { params }),
  get: (id: string) => api.get(`/routes/${id}`),
};

// Tracking
export const trackingAPI = {
  start: (shipmentId: string) => api.post('/tracking/start', { shipmentId }),
  stop: (vehicleId: string) => api.post('/tracking/stop', { vehicleId }),
  get: (vehicleId: string) => api.get(`/tracking/${vehicleId}`),
};

// Alerts
export const alertAPI = {
  list: (params?: any) => api.get('/alerts', { params }),
  resolve: (id: string) => api.put(`/alerts/${id}/resolve`),
};

// Analytics
export const analyticsAPI = {
  get: () => api.get('/analytics'),
};

// Notifications
export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Search
export const searchAPI = {
  search: (q: string) => api.get('/search', { params: { q } }),
};

export default api;
