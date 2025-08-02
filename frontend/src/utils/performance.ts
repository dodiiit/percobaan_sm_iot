import { ReportHandler } from 'web-vitals';

// Initialize performance observer
export const initPerformanceMonitoring = (): void => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Create and observe long task
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log long tasks that block the main thread
          console.warn(`Long task detected: ${entry.duration}ms`, entry);
          
          // You can send this data to your analytics service
          if (window.gtag) {
            window.gtag('event', 'long_task', {
              event_category: 'Performance',
              event_label: 'Long Task',
              value: Math.round(entry.duration),
              non_interaction: true,
            });
          }
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
export const reportWebVitals = (onPerfEntry?: ReportHandler): void => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
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