import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { reportWebVitals, initPerformanceMonitoring, performance } from './utils/performance';

// Mark the initial load time
performance.mark('app_init_start');

// Initialize performance monitoring
initPerformanceMonitoring();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mark the app render completion
performance.mark('app_init_end');
performance.measure('app_initialization', 'app_init_start', 'app_init_end');

// Report web vitals
reportWebVitals((metric: any) => {
  // Log the metrics
  console.info(`Web Vital: ${metric.name} - ${metric.value}`);
  
  // You can send this data to your analytics service
  if (window.gtag) {
    window.gtag('event', metric.name.toLowerCase(), {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
});