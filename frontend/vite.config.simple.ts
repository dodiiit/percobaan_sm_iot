import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Simplified Vite config for debugging
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});