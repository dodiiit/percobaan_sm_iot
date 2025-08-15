import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    allowedHosts: [
      'work-1-rsgbiecbkfudrrgt.prod-runtime.all-hands.dev', 
      'work-2-rsgbiecbkfudrrgt.prod-runtime.all-hands.dev', 
      'work-1-poddzmxlxrhcypeu.prod-runtime.all-hands.dev', 
      'work-2-poddzmxlxrhcypeu.prod-runtime.all-hands.dev', 
      'localhost', 
      '127.0.0.1'
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'X-Frame-Options': 'ALLOWALL',
    },
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
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
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    target: 'es2015',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // MUI libraries
          if (id.includes('node_modules/@mui') || 
              id.includes('node_modules/@emotion')) {
            return 'mui-vendor';
          }
          
          // Chart libraries
          if (id.includes('node_modules/chart.js') || 
              id.includes('node_modules/react-chartjs-2')) {
            return 'chart-vendor';
          }
          
          // Form libraries
          if (id.includes('node_modules/formik') || 
              id.includes('node_modules/yup')) {
            return 'form-vendor';
          }
          
          // i18n libraries
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next')) {
            return 'i18n-vendor';
          }
          
          // Headless UI and Heroicons
          if (id.includes('node_modules/@headlessui') || 
              id.includes('node_modules/@heroicons')) {
            return 'ui-vendor';
          }
          
          // Animation libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }
          
          // Other utilities
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({name}) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          return 'assets/[ext]/[name]-[hash][extname]';
        },
      },
    },
  }
});