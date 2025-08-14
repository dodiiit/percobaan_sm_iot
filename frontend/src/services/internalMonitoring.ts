/**
 * Internal Monitoring Service
 * Self-hosted monitoring solution without external dependencies
 */

interface MonitoringConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  enableConsoleLog: boolean;
  sampleRate: number;
}

interface MonitoringEvent {
  type: 'error' | 'performance' | 'custom' | 'user_action';
  name: string;
  data: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  context?: any;
}

interface ErrorEvent {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
}

class InternalMonitoringService {
  private config: MonitoringConfig;
  private eventQueue: MonitoringEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      endpoint: '/api/monitoring/events',
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      enableConsoleLog: process.env.NODE_ENV !== 'production',
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    // Only monitor a sample of users
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // Set up automatic flushing
    this.startFlushTimer();

    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: 'high'
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: { type: 'unhandled_promise_rejection' }
      });
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logCustomEvent('page_visibility_change', {
        visible: !document.hidden,
        timestamp: Date.now()
      });
    });

    // Monitor page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true); // Force flush before page unload
    });

    // Log session start
    this.logCustomEvent('session_start', {
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Log error event
   */
  public logError(error: ErrorEvent): void {
    const event: MonitoringEvent = {
      type: 'error',
      name: 'javascript_error',
      data: error,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);

    if (this.config.enableConsoleLog) {
      console.error('[Monitoring] Error logged:', error);
    }
  }

  /**
   * Log performance metric
   */
  public logPerformance(metric: PerformanceMetric): void {
    const event: MonitoringEvent = {
      type: 'performance',
      name: metric.name,
      data: {
        value: metric.value,
        unit: metric.unit,
        context: metric.context
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);

    if (this.config.enableConsoleLog) {
      console.info(`[Monitoring] Performance metric: ${metric.name} = ${metric.value}${metric.unit}`);
    }
  }

  /**
   * Log custom event
   */
  public logCustomEvent(name: string, data: any = {}): void {
    const event: MonitoringEvent = {
      type: 'custom',
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);

    if (this.config.enableConsoleLog) {
      console.info(`[Monitoring] Custom event: ${name}`, data);
    }
  }

  /**
   * Log user action
   */
  public logUserAction(action: string, data: any = {}): void {
    const event: MonitoringEvent = {
      type: 'user_action',
      name: action,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);

    if (this.config.enableConsoleLog) {
      console.info(`[Monitoring] User action: ${action}`, data);
    }
  }

  /**
   * Add event to queue
   */
  private addEvent(event: MonitoringEvent): void {
    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  public async flush(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: force // Use keepalive for page unload
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.retryCount = 0; // Reset retry count on success

      if (this.config.enableConsoleLog) {
        console.info(`[Monitoring] Flushed ${events.length} events to server`);
      }

    } catch (error) {
      console.error('[Monitoring] Failed to flush events:', error);

      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        // Add events back to queue for retry
        this.eventQueue.unshift(...events);
        
        // Retry with exponential backoff
        setTimeout(() => {
          this.flush();
        }, Math.pow(2, this.retryCount) * 1000);
      }
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Get current user ID from localStorage or session
   */
  private getCurrentUserId(): string | undefined {
    try {
      return localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Monitor API calls
   */
  public monitorApiCall(
    url: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    error?: any
  ): void {
    const responseTime = endTime - startTime;

    this.logPerformance({
      name: 'api_call',
      value: responseTime,
      unit: 'ms',
      context: {
        url,
        method,
        status,
        error: error?.message
      }
    });

    // Log as error if API call failed
    if (status >= 400 || error) {
      this.logError({
        message: `API call failed: ${method} ${url}`,
        severity: status >= 500 ? 'high' : 'medium',
        context: {
          url,
          method,
          status,
          responseTime,
          error: error?.message
        }
      });
    }
  }

  /**
   * Monitor component render time
   */
  public monitorComponentRender(componentName: string, renderTime: number): void {
    this.logPerformance({
      name: 'component_render',
      value: renderTime,
      unit: 'ms',
      context: {
        component: componentName
      }
    });

    // Alert on slow renders
    if (renderTime > 100) {
      this.logCustomEvent('slow_component_render', {
        component: componentName,
        renderTime
      });
    }
  }

  /**
   * Monitor route changes
   */
  public monitorRouteChange(from: string, to: string, loadTime: number): void {
    this.logCustomEvent('route_change', {
      from,
      to,
      loadTime
    });

    this.logPerformance({
      name: 'route_load_time',
      value: loadTime,
      unit: 'ms',
      context: {
        route: to
      }
    });
  }

  /**
   * Get monitoring statistics
   */
  public getStats(): any {
    return {
      sessionId: this.sessionId,
      queueSize: this.eventQueue.length,
      retryCount: this.retryCount,
      config: this.config
    };
  }

  /**
   * Destroy monitoring service
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    this.flush(true);
  }
}

// Create singleton instance
const internalMonitoring = new InternalMonitoringService();

// Export for use in other modules
export default internalMonitoring;

// Export types
export type {
  MonitoringConfig,
  MonitoringEvent,
  PerformanceMetric,
  ErrorEvent
};

// Utility functions for easy integration
export const logError = (error: ErrorEvent) => internalMonitoring.logError(error);
export const logPerformance = (metric: PerformanceMetric) => internalMonitoring.logPerformance(metric);
export const logCustomEvent = (name: string, data?: any) => internalMonitoring.logCustomEvent(name, data);
export const logUserAction = (action: string, data?: any) => internalMonitoring.logUserAction(action, data);
export const monitorApiCall = (url: string, method: string, startTime: number, endTime: number, status: number, error?: any) => 
  internalMonitoring.monitorApiCall(url, method, startTime, endTime, status, error);
export const monitorComponentRender = (componentName: string, renderTime: number) => 
  internalMonitoring.monitorComponentRender(componentName, renderTime);
export const monitorRouteChange = (from: string, to: string, loadTime: number) => 
  internalMonitoring.monitorRouteChange(from, to, loadTime);