import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.lingindustri.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Remove token from localStorage and sessionStorage
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      // Redirect to unauthorized page
      window.location.href = '/unauthorized';
    }
    
    // Handle 500 Internal Server Error
    if (error.response && error.response.status === 500) {
      // Redirect to server error page
      window.location.href = '/server-error';
    }
    
    return Promise.reject(error);
  }
);

// Export both cached and non-cached API instances
export { default as cachedApi, cacheManager } from './cachedApi';
export default api;