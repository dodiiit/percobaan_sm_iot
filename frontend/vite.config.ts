import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 12000,
    host: '0.0.0.0',
    cors: true,
    allowedHosts: ['work-1-fsvklykpxaizwwow.prod-runtime.all-hands.dev', 'localhost', '127.0.0.1'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'X-Frame-Options': 'ALLOWALL',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/webhooks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});