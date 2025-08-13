// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const environment = {
  production: isProduction,
  development: isDevelopment,
  apiUrl: process.env.VITE_API_URL || (
    isProduction 
      ? '/api' 
      : 'http://localhost:8000/api'
  ),
  authUrl: process.env.VITE_AUTH_URL || (
    isProduction 
      ? '/auth' 
      : 'http://localhost:8000/auth'
  ),
  webhookUrl: process.env.VITE_WEBHOOK_URL || (
    isProduction 
      ? '/webhooks' 
      : 'http://localhost:8000/webhooks'
  ),
  appName: 'IndoWater Solution',
  version: '1.0.0',
};

// Global environment variables for backward compatibility
declare global {
  interface Window {
    env?: any;
  }
}

if (typeof window !== 'undefined') {
  window.env = {
    REACT_APP_API_URL: environment.apiUrl,
    REACT_APP_AUTH_URL: environment.authUrl,
    REACT_APP_WEBHOOK_URL: environment.webhookUrl,
    NODE_ENV: process.env.NODE_ENV,
    PROD: isProduction,
    DEV: isDevelopment,
  };
}

export default environment;