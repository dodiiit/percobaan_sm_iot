import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Configuration
const config = {
  // Whether to enable performance monitoring
  enabled: true,
  
  // Whether to log metrics to console
  logToConsole: process.env.NODE_ENV !== 'production',
  
  // Endpoint to send metrics to
  endpoint: '/api/metrics',
  
  // Sample rate (0-1) - what percentage of users to collect data from
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // User ID for tracking (if available)
  userId: typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : undefined,
};

// Types
interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * Send a performance metric to the server and/or console
 */
function sendMetric(metric: PerformanceMetric): void {
  // Add additional context
  const metricWithContext = {
    ...metric,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId: config.userId,
  };
  
  // Log to console if enabled
  if (config.logToConsole) {
    console.log('[Performance]', metricWithContext);
  }
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Performance',
      event_label: metric.id || metric.name,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
  
  // Send to server
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      config.endpoint,
      JSON.stringify(metricWithContext)
    );
  } else {
    // Fallback to fetch API
    fetch(config.endpoint, {
      method: 'POST',
      body: JSON.stringify(metricWithContext),
      headers: {
        'Content-Type': 'application/json',
      },
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((error) => {
      if (config.logToConsole) {
        console.error('Failed to send performance metric:', error);
      }
    });
  }
}

// Initialize performance observer
export const initPerformanceMonitoring = (): void => {
  if (!config.enabled || typeof window === 'undefined') return;
  
  // Only collect metrics from a sample of users
  if (Math.random() > config.sampleRate) return;
  
  // Collect Core Web Vitals
  onCLS((metric) => sendMetric({ ...metric, name: 'CLS' }));
  onFCP((metric) => sendMetric({ ...metric, name: 'FCP' }));
  onINP((metric) => sendMetric({ ...metric, name: 'INP' }));
  onLCP((metric) => sendMetric({ ...metric, name: 'LCP' }));
  onTTFB((metric) => sendMetric({ ...metric, name: 'TTFB' }));
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Create and observe long task
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log long tasks that block the main thread
          if (config.logToConsole) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
          
          sendMetric({
            name: 'long_task',
            value: entry.duration,
            rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
          });
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Long task observer failed to initialize', e);
    }

    // Create and observe layout shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          // Only log significant layout shifts
          if (entry.value >= 0.1) {
            console.warn(`Layout shift detected: ${entry.value.toFixed(4)}`, entry);
            
            // You can send this data to your analytics service
            if (window.gtag) {
              window.gtag('event', 'layout_shift', {
                event_category: 'Performance',
                event_label: 'Layout Shift',
                value: Math.round(entry.value * 100) / 100,
                non_interaction: true,
              });
            }
          }
        });
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('Layout shift observer failed to initialize', e);
    }

    // Create and observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        console.info(`Largest Contentful Paint: ${lastEntry.startTime.toFixed(0)}ms`);
        
        // You can send this data to your analytics service
        if (window.gtag) {
          window.gtag('event', 'largest_contentful_paint', {
            event_category: 'Performance',
            event_label: 'LCP',
            value: Math.round(lastEntry.startTime),
            non_interaction: true,
          });
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.error('LCP observer failed to initialize', e);
    }

    // Create and observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          console.info(`First Input Delay: ${entry.processingStart - entry.startTime}ms`);
          
          // You can send this data to your analytics service
          if (window.gtag) {
            window.gtag('event', 'first_input_delay', {
              event_category: 'Performance',
              event_label: 'FID',
              value: Math.round(entry.processingStart - entry.startTime),
              non_interaction: true,
            });
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.error('FID observer failed to initialize', e);
    }
  }
};

// Report web vitals
export const reportWebVitals = (onPerfEntry?: (metric: Metric) => void): void => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFCP(onPerfEntry);
      onINP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

// Custom performance mark and measure utility
export const performance = {
  mark: (name: string): void => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark: string): void => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measures = window.performance.getEntriesByName(name, 'measure');
        const lastMeasure = measures[measures.length - 1];
        
        console.info(`Performance measure ${name}: ${lastMeasure.duration.toFixed(2)}ms`);
        
        // You can send this data to your analytics service
        if (window.gtag) {
          window.gtag('event', 'custom_measure', {
            event_category: 'Performance',
            event_label: name,
            value: Math.round(lastMeasure.duration),
            non_interaction: true,
          });
        }
      } catch (e) {
        console.error(`Failed to measure performance between ${startMark} and ${endMark}`, e);
      }
    }
  },
  
  clearMarks: (): void => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks();
    }
  },
  
  clearMeasures: (): void => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMeasures();
    }
  }
};

// Add TypeScript declaration for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params: {
        event_category: string;
        event_label: string;
        value: number;
        non_interaction: boolean;
      }
    ) => void;
  }
}