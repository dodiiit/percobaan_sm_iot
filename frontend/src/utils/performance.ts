import { ReportHandler, getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Logs web vitals metrics to the console and sends them to an analytics endpoint
 * @param onPerfEntry - Optional callback function to handle performance metrics
 */
export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry); // Cumulative Layout Shift
    getFID(onPerfEntry); // First Input Delay
    getFCP(onPerfEntry); // First Contentful Paint
    getLCP(onPerfEntry); // Largest Contentful Paint
    getTTFB(onPerfEntry); // Time to First Byte
  }
};

/**
 * Default handler for web vitals metrics
 * Logs metrics to console and sends them to analytics if in production
 */
const handleWebVitals: ReportHandler = (metric) => {
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(metric);
  }

  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics endpoint
    const analyticsEndpoint = '/api/analytics/performance';
    
    // Only send if we have a valid endpoint
    if (analyticsEndpoint) {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        navigationType: metric.navigationType,
      });
      
      // Use sendBeacon if available, otherwise fall back to fetch
      if (navigator.sendBeacon) {
        navigator.sendBeacon(analyticsEndpoint, body);
      } else {
        fetch(analyticsEndpoint, {
          body,
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }
  }
};

/**
 * Registers web vitals metrics reporting
 */
export const registerWebVitals = () => {
  reportWebVitals(handleWebVitals);
};

/**
 * Measures the performance of a specific component or operation
 * @param label - Label for the performance measurement
 * @returns Object with start and end functions
 */
export const measurePerformance = (label: string) => {
  const markStart = `${label}-start`;
  const markEnd = `${label}-end`;
  
  return {
    start: () => {
      performance.mark(markStart);
    },
    end: () => {
      performance.mark(markEnd);
      performance.measure(label, markStart, markEnd);
      
      // Get the measurement and log it
      const measurements = performance.getEntriesByName(label, 'measure');
      if (measurements.length > 0) {
        const duration = measurements[0].duration;
        
        // Log in development
        if (process.env.NODE_ENV !== 'production') {
          console.log(`${label}: ${duration.toFixed(2)}ms`);
        }
        
        // Clear marks and measures to avoid memory leaks
        performance.clearMarks(markStart);
        performance.clearMarks(markEnd);
        performance.clearMeasures(label);
        
        return duration;
      }
      
      return 0;
    },
  };
};

/**
 * Creates a performance observer to monitor specific performance entries
 * @param entryTypes - Types of performance entries to observe
 * @param callback - Callback function to handle performance entries
 * @returns Disconnect function to stop observing
 */
export const createPerformanceObserver = (
  entryTypes: string[],
  callback: (entries: PerformanceObserverEntryList) => void
) => {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {};
  }
  
  const observer = new PerformanceObserver((list) => {
    callback(list);
  });
  
  observer.observe({ entryTypes });
  
  return () => {
    observer.disconnect();
  };
};

/**
 * Monitors resource loading performance
 * @param callback - Optional callback to handle resource timing entries
 * @returns Disconnect function to stop monitoring
 */
export const monitorResourceLoading = (
  callback?: (entries: PerformanceResourceTiming[]) => void
) => {
  return createPerformanceObserver(['resource'], (list) => {
    const entries = list.getEntries() as PerformanceResourceTiming[];
    
    if (callback) {
      callback(entries);
    } else if (process.env.NODE_ENV !== 'production') {
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // Log slow resources (>1s)
          console.warn(`Slow resource load: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
        }
      });
    }
  });
};

/**
 * Monitors long tasks that might cause UI jank
 * @param threshold - Duration threshold in ms to consider a task as "long" (default: 50ms)
 * @returns Disconnect function to stop monitoring
 */
export const monitorLongTasks = (threshold = 50) => {
  return createPerformanceObserver(['longtask'], (list) => {
    const entries = list.getEntries();
    
    if (process.env.NODE_ENV !== 'production') {
      entries.forEach((entry) => {
        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
      });
    }
    
    // In production, we could send this data to an analytics endpoint
    if (process.env.NODE_ENV === 'production' && entries.length > 0) {
      // Example implementation
    }
  });
};

/**
 * Monitors first paint and first contentful paint
 * @returns Disconnect function to stop monitoring
 */
export const monitorPaints = () => {
  return createPerformanceObserver(['paint'], (list) => {
    const entries = list.getEntries();
    
    if (process.env.NODE_ENV !== 'production') {
      entries.forEach((entry) => {
        console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
      });
    }
  });
};