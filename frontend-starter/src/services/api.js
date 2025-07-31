import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
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
  (response) => response,
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
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (userData) => api.put('/api/users/me', userData),
  changePassword: (passwordData) => api.put('/api/users/me/password', passwordData),
};

// Meter API
export const meterAPI = {
  getMeters: (params = {}) => api.get('/api/meters', { params }),
  getMeter: (id) => api.get(`/api/meters/${id}`),
  getBalance: (id) => api.get(`/api/meters/${id}/balance`),
  getConsumption: (id, params = {}) => api.get(`/api/meters/${id}/consumption`, { params }),
  getCredits: (id, params = {}) => api.get(`/api/meters/${id}/credits`, { params }),
  topup: (id, amount, description) => api.post(`/api/meters/${id}/topup`, { amount, description }),
  getStatus: (id) => api.get(`/api/meters/${id}/status`),
};

// Payment API
export const paymentAPI = {
  getPayments: (params = {}) => api.get('/api/payments', { params }),
  getPayment: (id) => api.get(`/api/payments/${id}`),
  createPayment: (paymentData) => api.post('/api/payments', paymentData),
  processPayment: (id) => api.post(`/api/payments/${id}/process`),
};

// Real-time API
export const realtimeAPI = {
  getMeterUpdates: (meterId) => api.get(`/api/realtime/poll/updates?meter_id=${meterId}`),
  getNotifications: () => api.get('/api/realtime/poll/updates?type=notifications'),
};

export default api;