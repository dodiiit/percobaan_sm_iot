import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: '/api',
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
  resetPassword: (token: string, password: string, password_confirmation: string) => 
    api.post('/auth/reset-password', { token, password, password_confirmation }),
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

// User API
export const userAPI = {
  getProfile: () => 
    api.get('/api/users/me'),
  updateProfile: (userData: any) => 
    api.put('/api/users/me', userData),
  changePassword: (passwordData: { current_password: string; password: string; password_confirmation: string }) => 
    api.put('/api/users/me/password', passwordData),
};

// Meter API
export const meterAPI = {
  getMeters: (params = {}) => 
    api.get('/api/meters', { params }),
  getMeter: (id: string) => 
    api.get(`/api/meters/${id}`),
  getBalance: (id: string) => 
    api.get(`/api/meters/${id}/balance`),
  getConsumption: (id: string, params = {}) => 
    api.get(`/api/meters/${id}/consumption`, { params }),
  getCredits: (id: string, params = {}) => 
    api.get(`/api/meters/${id}/credits`, { params }),
  topup: (id: string, amount: number, description: string) => 
    api.post(`/api/meters/${id}/topup`, { amount, description }),
  getStatus: (id: string) => 
    api.get(`/api/meters/${id}/status`),
};

// Payment API
export const paymentAPI = {
  getPayments: (params = {}) => 
    api.get('/api/payments', { params }),
  getPayment: (id: string) => 
    api.get(`/api/payments/${id}`),
  createPayment: (paymentData: any) => 
    api.post('/api/payments', paymentData),
  checkPaymentStatus: (id: string) => 
    api.get(`/api/payments/${id}/status`),
  getSummary: () => 
    api.get('/api/payments/summary'),
};

// Real-time API
export const realtimeAPI = {
  getMeterUpdates: (meterId: string) => 
    api.get(`/api/realtime/poll/updates?meter_id=${meterId}`),
  getNotifications: () => 
    api.get('/api/realtime/poll/updates?type=notifications'),
};

// Property API
export const propertyAPI = {
  getProperties: (params = {}) => 
    api.get('/api/properties', { params }),
  getProperty: (id: string) => 
    api.get(`/api/properties/${id}`),
  createProperty: (propertyData: any) => 
    api.post('/api/properties', propertyData),
  updateProperty: (id: string, propertyData: any) => 
    api.put(`/api/properties/${id}`, propertyData),
  deleteProperty: (id: string) => 
    api.delete(`/api/properties/${id}`),
};

export default api;