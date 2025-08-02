import { enhancedApi, loadingStateManager } from './enhancedApi';
import enhancedAuthService from './enhancedAuthService';
import enhancedMeterService from './enhancedMeterService';
import enhancedPaymentService from './enhancedPaymentService';
import enhancedRealtimeService from './enhancedRealtimeService';
import errorHandler from './errorHandler';

export interface ApiIntegrationConfig {
  baseURL?: string;
  timeout?: number;
  retryConfig?: {
    retries: number;
    retryDelay: number;
  };
  enableRealtime?: boolean;
  enableCaching?: boolean;
  enableErrorReporting?: boolean;
}

export interface SystemHealth {
  api: boolean;
  realtime: boolean;
  cache: boolean;
  overall: 'healthy' | 'degraded' | 'critical';
  lastChecked: Date;
  issues: string[];
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeConnections: number;
}

class ApiIntegration {
  private config: ApiIntegrationConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private systemHealth: SystemHealth = {
    api: false,
    realtime: false,
    cache: false,
    overall: 'critical',
    lastChecked: new Date(),
    issues: []
  };
  private metrics: ApiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    activeConnections: 0
  };

  constructor(config: ApiIntegrationConfig = {}) {
    this.config = {
      baseURL: '/api',
      timeout: 30000,
      retryConfig: {
        retries: 3,
        retryDelay: 1000
      },
      enableRealtime: true,
      enableCaching: true,
      enableErrorReporting: true,
      ...config
    };

    this.initialize();
  }

  // Initialize API integration
  private async initialize(): Promise<void> {
    try {
      // Start health monitoring
      this.startHealthMonitoring();

      // Start metrics collection
      this.startMetricsCollection();

      // Initialize real-time service if enabled
      if (this.config.enableRealtime) {
        await this.initializeRealtime();
      }

      console.log('API Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize API Integration:', error);
      errorHandler.handleError(error as any, {
        logError: true,
        showToast: false
      }, {
        component: 'ApiIntegration',
        action: 'initialize'
      });
    }
  }

  // Initialize real-time service
  private async initializeRealtime(): Promise<void> {
    try {
      const isHealthy = await enhancedRealtimeService.healthCheck();
      if (isHealthy) {
        console.log('Real-time service is healthy');
      } else {
        console.warn('Real-time service health check failed');
      }
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
    }
  }

  // Start health monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkSystemHealth();
    }, 60000); // Check every minute

    // Initial health check
    this.checkSystemHealth();
  }

  // Start metrics collection
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  // Check system health
  private async checkSystemHealth(): Promise<void> {
    const issues: string[] = [];
    let apiHealthy = false;
    let realtimeHealthy = false;
    let cacheHealthy = false;

    try {
      // Check API health
      apiHealthy = await enhancedApi.healthCheck();
      if (!apiHealthy) {
        issues.push('API service is not responding');
      }
    } catch (error) {
      issues.push('API health check failed');
    }

    try {
      // Check real-time service health
      if (this.config.enableRealtime) {
        realtimeHealthy = await enhancedRealtimeService.healthCheck();
        if (!realtimeHealthy) {
          issues.push('Real-time service is not responding');
        }
      } else {
        realtimeHealthy = true; // Not enabled, so consider healthy
      }
    } catch (error) {
      issues.push('Real-time service health check failed');
    }

    try {
      // Check cache health (simplified check)
      if (this.config.enableCaching) {
        cacheHealthy = true; // Assume healthy if no errors
      } else {
        cacheHealthy = true; // Not enabled, so consider healthy
      }
    } catch (error) {
      issues.push('Cache service health check failed');
    }

    // Determine overall health
    let overall: SystemHealth['overall'] = 'healthy';
    if (issues.length > 0) {
      if (!apiHealthy) {
        overall = 'critical';
      } else if (!realtimeHealthy || !cacheHealthy) {
        overall = 'degraded';
      }
    }

    this.systemHealth = {
      api: apiHealthy,
      realtime: realtimeHealthy,
      cache: cacheHealthy,
      overall,
      lastChecked: new Date(),
      issues
    };

    // Log health status changes
    if (issues.length > 0) {
      console.warn('System health issues detected:', issues);
    }
  }

  // Update metrics
  private updateMetrics(): void {
    try {
      const errorStats = errorHandler.getErrorStats();
      
      // Calculate error rate
      const totalRequests = this.metrics.totalRequests + errorStats.total;
      const errorRate = totalRequests > 0 ? (errorStats.total / totalRequests) * 100 : 0;

      this.metrics = {
        ...this.metrics,
        totalRequests,
        failedRequests: errorStats.total,
        successfulRequests: totalRequests - errorStats.total,
        errorRate
      };
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }

  // Get system health
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  // Get API metrics
  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  // Get service instances
  getServices() {
    return {
      auth: enhancedAuthService,
      meter: enhancedMeterService,
      payment: enhancedPaymentService,
      realtime: enhancedRealtimeService,
      api: enhancedApi,
      errorHandler,
      loadingStateManager
    };
  }

  // Batch health check for all services
  async performFullHealthCheck(): Promise<{
    api: boolean;
    realtime: boolean;
    auth: boolean;
    overall: boolean;
    details: any;
  }> {
    const results = {
      api: false,
      realtime: false,
      auth: false,
      overall: false,
      details: {} as any
    };

    try {
      // API health check
      results.api = await enhancedApi.healthCheck();
      results.details.api = results.api ? 'OK' : 'Failed';
    } catch (error) {
      results.details.api = `Error: ${error.message}`;
    }

    try {
      // Real-time service health check
      if (this.config.enableRealtime) {
        results.realtime = await enhancedRealtimeService.healthCheck();
        results.details.realtime = results.realtime ? 'OK' : 'Failed';
      } else {
        results.realtime = true;
        results.details.realtime = 'Disabled';
      }
    } catch (error) {
      results.details.realtime = `Error: ${error.message}`;
    }

    try {
      // Auth service health check (validate token)
      results.auth = await enhancedAuthService.validateToken();
      results.details.auth = results.auth ? 'OK' : 'Invalid token';
    } catch (error) {
      results.details.auth = `Error: ${error.message}`;
    }

    // Overall health
    results.overall = results.api && results.realtime && results.auth;

    return results;
  }

  // Preload critical data
  async preloadCriticalData(): Promise<void> {
    try {
      const promises: Promise<any>[] = [];

      // Preload user data if authenticated
      if (enhancedAuthService.isAuthenticated()) {
        promises.push(
          enhancedAuthService.getCurrentUser().catch(error => {
            console.warn('Failed to preload user data:', error);
          })
        );

        // Preload user's meters
        promises.push(
          enhancedMeterService.getMyMeters().catch(error => {
            console.warn('Failed to preload meters:', error);
          })
        );

        // Preload recent payments
        promises.push(
          enhancedPaymentService.getMyPayments({ limit: 10 }).catch(error => {
            console.warn('Failed to preload payments:', error);
          })
        );
      }

      await Promise.allSettled(promises);
      console.log('Critical data preloaded successfully');
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  // Clear all caches
  clearAllCaches(): void {
    try {
      loadingStateManager.clear();
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  // Reset API integration
  async reset(): Promise<void> {
    try {
      // Stop monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Disconnect real-time service
      enhancedRealtimeService.disconnect();

      // Clear caches
      this.clearAllCaches();

      // Clear error log
      errorHandler.clearErrorLog();

      // Reset metrics
      this.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        activeConnections: 0
      };

      console.log('API Integration reset successfully');
    } catch (error) {
      console.error('Failed to reset API Integration:', error);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down API Integration...');

      // Logout if authenticated
      if (enhancedAuthService.isAuthenticated()) {
        try {
          await enhancedAuthService.logout();
        } catch (error) {
          console.warn('Failed to logout during shutdown:', error);
        }
      }

      // Reset everything
      await this.reset();

      console.log('API Integration shutdown completed');
    } catch (error) {
      console.error('Error during API Integration shutdown:', error);
    }
  }

  // Get configuration
  getConfig(): ApiIntegrationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<ApiIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('API Integration configuration updated');
  }

  // Export system diagnostics
  exportDiagnostics(): {
    health: SystemHealth;
    metrics: ApiMetrics;
    config: ApiIntegrationConfig;
    errorStats: any;
    subscriptions: any[];
    timestamp: Date;
  } {
    return {
      health: this.getSystemHealth(),
      metrics: this.getMetrics(),
      config: this.getConfig(),
      errorStats: errorHandler.getErrorStats(),
      subscriptions: enhancedRealtimeService.getSubscriptionInfo(),
      timestamp: new Date()
    };
  }
}

// Create and export API integration instance
const apiIntegration = new ApiIntegration();

// Export for use in React components
export default apiIntegration;

// Export class for testing
export { ApiIntegration };

// Convenience exports for direct service access
export {
  enhancedApi,
  enhancedAuthService,
  enhancedMeterService,
  enhancedPaymentService,
  enhancedRealtimeService,
  errorHandler,
  loadingStateManager
};