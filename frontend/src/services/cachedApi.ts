import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheService, CacheConfig, CACHE_CONFIGS } from './cacheService';

// Create axios instance with caching capabilities
const cachedApi = axios.create({
  baseURL: 'https://api.lingindustri.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Cache configuration mapping
const ROUTE_CACHE_CONFIG: Record<string, CacheConfig> = {
  // Meter routes
  '/meters': CACHE_CONFIGS.METERS,
  '/meters/*/consumption': CACHE_CONFIGS.METER_CONSUMPTION,
  '/meters/*/balance': CACHE_CONFIGS.METER_BALANCE,
  '/meters/*/credits': CACHE_CONFIGS.METER_CREDITS,
  '/meters/*/status': CACHE_CONFIGS.METER_STATUS,
  
  // User routes
  '/users': CACHE_CONFIGS.USERS,
  '/users/*': CACHE_CONFIGS.USERS,
  
  // Property routes
  '/properties': CACHE_CONFIGS.PROPERTIES,
  '/properties/*': CACHE_CONFIGS.PROPERTIES,
  
  // Tariff routes
  '/tariffs': CACHE_CONFIGS.TARIFFS,
  '/tariffs/*': CACHE_CONFIGS.TARIFFS,
  
  // Service fee routes
  '/service-fees': CACHE_CONFIGS.SERVICE_FEES,
  '/service-fees/*': CACHE_CONFIGS.SERVICE_FEES,
  
  // Payment routes
  '/payments': CACHE_CONFIGS.PAYMENT_HISTORY,
  '/payments/*': CACHE_CONFIGS.PAYMENT_HISTORY,
  
  // Settings routes
  '/settings': CACHE_CONFIGS.SYSTEM_SETTINGS,
  '/settings/*': CACHE_CONFIGS.SYSTEM_SETTINGS,
};

// Routes that should never be cached
const NON_CACHEABLE_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/meters/*/ota',
  '/meters/*/control',
  '/realtime/*',
  '/cache/*',
];

// Routes that should invalidate cache on write operations
const CACHE_INVALIDATION_MAP: Record<string, string[]> = {
  '/meters': ['meters*', 'properties*'],
  '/meters/*': ['meters*', 'meter*'],
  '/users': ['users*'],
  '/users/*': ['users*', 'user*'],
  '/properties': ['properties*', 'meters*'],
  '/properties/*': ['properties*', 'property*', 'meters*'],
  '/tariffs': ['tariffs*'],
  '/tariffs/*': ['tariffs*', 'tariff*'],
  '/service-fees': ['service_fees*'],
  '/service-fees/*': ['service_fees*', 'service_fee*'],
  '/payments': ['payment*', 'meter*'],
  '/payments/*': ['payment*', 'meter*'],
};

/**
 * Check if a route should be cached
 */
function shouldCache(method: string, url: string): boolean {
  // Only cache GET requests
  if (method.toUpperCase() !== 'GET') {
    return false;
  }

  // Check non-cacheable routes
  const path = new URL(url, 'http://localhost').pathname;
  return !NON_CACHEABLE_ROUTES.some(route => {
    const pattern = route.replace(/\*/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
}

/**
 * Get cache configuration for a route
 */
function getCacheConfig(url: string): CacheConfig | null {
  const path = new URL(url, 'http://localhost').pathname;
  
  // Find matching cache configuration
  for (const [route, config] of Object.entries(ROUTE_CACHE_CONFIG)) {
    const pattern = route.replace(/\*/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Generate cache key for request
 */
function generateCacheKey(config: AxiosRequestConfig): string {
  const url = config.url || '';
  const params = config.params || {};
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  
  let key = cacheService.generateKey(url, params);
  
  if (userId) {
    key = `user:${userId}:${key}`;
  }
  
  return key;
}

/**
 * Invalidate cache patterns for write operations
 */
function invalidateCache(url: string): void {
  const path = new URL(url, 'http://localhost').pathname;
  
  for (const [route, patterns] of Object.entries(CACHE_INVALIDATION_MAP)) {
    const routePattern = route.replace(/\*/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    
    if (regex.test(path)) {
      patterns.forEach(pattern => {
        cacheService.clearPattern(pattern, 'memory');
        cacheService.clearPattern(pattern, 'sessionStorage');
        cacheService.clearPattern(pattern, 'localStorage');
      });
      break;
    }
  }
}

// Request interceptor
cachedApi.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if request should be cached
    if (shouldCache(config.method || 'GET', config.url || '')) {
      const cacheConfig = getCacheConfig(config.url || '');
      
      if (cacheConfig) {
        const cacheKey = generateCacheKey(config);
        const cachedResponse = cacheService.getCachedResponse(cacheKey, cacheConfig.storage);
        
        if (cachedResponse) {
          // Add If-None-Match header for ETag validation
          if (cachedResponse.etag) {
            config.headers['If-None-Match'] = cachedResponse.etag;
          }
          
          // Store cache info in config for response interceptor
          config.metadata = {
            cacheKey,
            cacheConfig,
            cachedData: cachedResponse.data,
          };
        } else {
          // Store cache info for new requests
          config.metadata = {
            cacheKey,
            cacheConfig,
          };
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
cachedApi.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    
    // Handle 304 Not Modified responses
    if (response.status === 304 && config.metadata?.cachedData) {
      return {
        ...response,
        data: config.metadata.cachedData,
        headers: {
          ...response.headers,
          'x-cache': 'HIT',
        },
      };
    }

    // Cache successful responses
    if (response.status === 200 && config.metadata?.cacheConfig) {
      cacheService.cacheResponse(
        config.metadata.cacheKey,
        response,
        config.metadata.cacheConfig
      );
      
      // Add cache header
      response.headers['x-cache'] = 'MISS';
    }

    // Invalidate cache for write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
      invalidateCache(config.url || '');
    }

    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('userId');
      
      // Clear all cache on logout
      cacheService.clear();
      
      window.location.href = '/login';
    }
    
    // Handle forbidden errors
    if (error.response && error.response.status === 403) {
      window.location.href = '/unauthorized';
    }
    
    // Handle server errors
    if (error.response && error.response.status === 500) {
      window.location.href = '/server-error';
    }
    
    return Promise.reject(error);
  }
);

// Cache management functions
export const cacheManager = {
  /**
   * Clear all cache
   */
  clearAll(): void {
    cacheService.clear();
  },

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern: string): void {
    cacheService.clearPattern(pattern, 'memory');
    cacheService.clearPattern(pattern, 'sessionStorage');
    cacheService.clearPattern(pattern, 'localStorage');
  },

  /**
   * Get cache statistics
   */
  getStats() {
    return cacheService.getStats();
  },

  /**
   * Manually invalidate cache for specific operations
   */
  invalidate(operation: string): void {
    const patterns = CACHE_INVALIDATION_MAP[operation] || [];
    patterns.forEach(pattern => this.clearPattern(pattern));
  },

  /**
   * Preload data into cache
   */
  async preload(requests: Array<{ url: string; params?: any }>): Promise<void> {
    const promises = requests.map(({ url, params }) =>
      cachedApi.get(url, { params }).catch(error => {
        console.warn(`Failed to preload ${url}:`, error);
      })
    );

    await Promise.allSettled(promises);
  },
};

export default cachedApi;