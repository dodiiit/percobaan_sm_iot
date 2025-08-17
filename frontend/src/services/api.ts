import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '@/constants/config';


// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string; remember?: boolean }) => 
    api.post('/auth/login', credentials),
  register: (userData: any) => 
    api.post('/auth/register', userData),
  logout: () => 
    api.post('/auth/logout'),
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  resetPassword: (
    tokenOrPayload: string | { token: string; password: string; password_confirmation: string },
    password?: string,
    password_confirmation?: string
  ) => {
    const payload = typeof tokenOrPayload === 'string'
      ? { token: tokenOrPayload, password: password as string, password_confirmation: password_confirmation as string }
      : tokenOrPayload;
    return api.post('/auth/reset-password', payload);
  },
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

// User API
export const userAPI = {
  getProfile: () => 
    api.get('/users/me'),
  updateProfile: (userData: any) => 
    api.put('/users/me', userData),
  changePassword: (passwordData: { current_password: string; password: string; password_confirmation: string }) => 
    api.put('/users/me/password', passwordData),
};

// Meter API
export const meterAPI = {
  getMeters: (params = {}) => 
    api.get('/meters', { params }),
  getMeter: (id: string) => 
    api.get(`/meters/${id}`),
  getBalance: (id: string) => 
    api.get(`/meters/${id}/balance`),
  getConsumption: (id: string, params = {}) => 
    api.get(`/meters/${id}/consumption`, { params }),
  getCredits: (id: string, params = {}) => 
    api.get(`/meters/${id}/credits`, { params }),
  topup: (id: string, amount: number, description?: string) => 
    api.post(`/meters/${id}/topup`, { amount, description }),
  getStatus: (id: string) => 
    api.get(`/meters/${id}/status`),
  getCustomerMeters: () => 
    api.get('/meters/my-meters'),
  getReadings: (id: string, params = {}) => 
    api.get(`/meters/${id}/readings`, { params }),
  getCustomerReadings: (params = {}) => 
    api.get('/meters/my-readings', { params }),
  getAlerts: (id: string, params = {}) => 
    api.get(`/meters/${id}/alerts`, { params }),
  getCustomerAlerts: (params = {}) => 
    api.get('/meters/my-alerts', { params }),
};

// Payment API
export const paymentAPI = {
  getPayments: (params = {}) => 
    api.get('/payments', { params }),
  getPayment: (id: string) => 
    api.get(`/payments/${id}`),
  createPayment: (paymentData: any) => 
    api.post('/payments', paymentData),
  checkPaymentStatus: (id: string) => 
    api.get(`/payments/${id}/status`),
  getSummary: () => 
    api.get('/payments/summary'),
  getCustomerPayments: (params = {}) => 
    api.get('/payments/my-payments', { params }),
  createTopupPayment: (paymentData: any) => 
    api.post('/payments/topup', paymentData),
  getPaymentMethods: () => 
    api.get('/payments/methods'),
  getPaymentReceipt: (id: string) => 
    api.get(`/payments/${id}/receipt`),
  cancelPayment: (id: string) => 
    api.post(`/payments/${id}/cancel`),
  getPaymentHistory: (meterId: string, params = {}) => 
    api.get(`/payments/history/${meterId}`, { params }),
};

// Real-time API
export const realtimeAPI = {
  getMeterUpdates: (meterId: string) => 
    api.get(`/realtime/poll/updates?meter_id=${meterId}`),
  getNotifications: () => 
    api.get('/realtime/poll/updates?type=notifications'),
};

// Property API
export const propertyAPI = {
  getProperties: (params = {}) => 
    api.get('/properties', { params }),
  getProperty: (id: string) => 
    api.get(`/properties/${id}`),
  createProperty: (propertyData: any) => 
    api.post('/properties', propertyData),
  updateProperty: (id: string, propertyData: any) => 
    api.put(`/properties/${id}`, propertyData),
  deleteProperty: (id: string) => 
    api.delete(`/properties/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getSuperadminDashboard: () => 
    api.get('/dashboard/superadmin'),
  getClientDashboard: () => 
    api.get('/dashboard/client'),
  getCustomerDashboard: () => 
    api.get('/dashboard/customer'),
  getStats: () => 
    api.get('/dashboard/stats'),
  getCharts: () => 
    api.get('/dashboard/charts'),
};

export default api;