import { AxiosResponse } from 'axios';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
}

export interface CacheConfig {
  ttl: number;
  maxSize?: number;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export class CacheService {
  private memoryCache = new Map<string, CacheItem>();
  private maxMemorySize: number;

  constructor(maxMemorySize = 100) {
    this.maxMemorySize = maxMemorySize;
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url: string, params?: Record<string, any>): string {
    const baseKey = url.replace(/^\/+|\/+$/g, '').replace(/\//g, ':');
    
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${JSON.stringify(params[key])}`)
        .join('&');
      return `${baseKey}?${sortedParams}`;
    }
    
    return baseKey;
  }

  /**
   * Set cache item
   */
  set<T>(key: string, data: T, config: CacheConfig): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
    };

    switch (config.storage) {
      case 'localStorage':
        this.setLocalStorage(key, item);
        break;
      case 'sessionStorage':
        this.setSessionStorage(key, item);
        break;
      default:
        this.setMemoryCache(key, item);
    }
  }

  /**
   * Get cache item
   */
  get<T>(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): T | null {
    let item: CacheItem<T> | null = null;

    switch (storage) {
      case 'localStorage':
        item = this.getLocalStorage<T>(key);
        break;
      case 'sessionStorage':
        item = this.getSessionStorage<T>(key);
        break;
      default:
        item = this.getMemoryCache<T>(key);
    }

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.delete(key, storage);
      return null;
    }

    return item.data;
  }

  /**
   * Delete cache item
   */
  delete(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    switch (storage) {
      case 'localStorage':
        localStorage.removeItem(`cache:${key}`);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(`cache:${key}`);
        break;
      default:
        this.memoryCache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear(storage?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storage || storage === 'memory') {
      this.memoryCache.clear();
    }

    if (!storage || storage === 'localStorage') {
      this.clearStorageByPrefix('cache:', localStorage);
    }

    if (!storage || storage === 'sessionStorage') {
      this.clearStorageByPrefix('cache:', sessionStorage);
    }
  }

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    switch (storage) {
      case 'localStorage':
        this.clearStorageByPattern(regex, localStorage);
        break;
      case 'sessionStorage':
        this.clearStorageByPattern(regex, sessionStorage);
        break;
      default:
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
    }
  }

  /**
   * Check if cache item exists and is valid
   */
  has(key: string, storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'): boolean {
    return this.get(key, storage) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    localStorageSize: number;
    sessionStorageSize: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: this.getStorageSize(localStorage, 'cache:'),
      sessionStorageSize: this.getStorageSize(sessionStorage, 'cache:'),
    };
  }

  /**
   * Cache HTTP response with proper headers handling
   */
  cacheResponse<T>(
    key: string,
    response: AxiosResponse<T>,
    config: CacheConfig
  ): void {
    const etag = response.headers.etag;
    const cacheControl = response.headers['cache-control'];
    
    // Parse cache-control header for TTL
    let ttl = config.ttl;
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        ttl = parseInt(maxAgeMatch[1]) * 1000; // Convert to milliseconds
      }
    }

    const item: CacheItem<T> = {
      data: response.data,
      timestamp: Date.now(),
      ttl,
      etag,
    };

    switch (config.storage) {
      case 'localStorage':
        this.setLocalStorage(key, item);
        break;
      case 'sessionStorage':
        this.setSessionStorage(key, item);
        break;
      default:
        this.setMemoryCache(key, item);
    }
  }

  /**
   * Get cached response with ETag validation
   */
  getCachedResponse<T>(
    key: string,
    storage: 'memory' | 'localStorage' | 'sessionStorage' = 'memory'
  ): { data: T; etag?: string } | null {
    const item = this.getCacheItem<T>(key, storage);
    
    if (!item || this.isExpired(item)) {
      return null;
    }

    return {
      data: item.data,
      etag: item.etag,
    };
  }

  private setMemoryCache<T>(key: string, item: CacheItem<T>): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, item);
  }

  private getMemoryCache<T>(key: string): CacheItem<T> | null {
    return this.memoryCache.get(key) as CacheItem<T> || null;
  }

  private setLocalStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  private getLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const item = localStorage.getItem(`cache:${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  private setSessionStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set sessionStorage cache:', error);
    }
  }

  private getSessionStorage<T>(key: string): CacheItem<T> | null {
    try {
      const item = sessionStorage.getItem(`cache:${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get sessionStorage cache:', error);
      return null;
    }
  }

  private getCacheItem<T>(
    key: string,
    storage: 'memory' | 'localStorage' | 'sessionStorage'
  ): CacheItem<T> | null {
    switch (storage) {
      case 'localStorage':
        return this.getLocalStorage<T>(key);
      case 'sessionStorage':
        return this.getSessionStorage<T>(key);
      default:
        return this.getMemoryCache<T>(key);
    }
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private clearStorageByPrefix(prefix: string, storage: Storage): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
  }

  private clearStorageByPattern(pattern: RegExp, storage: Storage): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache:')) {
        const cacheKey = key.replace('cache:', '');
        if (pattern.test(cacheKey)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => storage.removeItem(key));
  }

  private getStorageSize(storage: Storage, prefix: string): number {
    let count = 0;
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        count++;
      }
    }

    return count;
  }
}

// Default cache configurations for different data types
export const CACHE_CONFIGS = {
  // Real-time data (short cache)
  METER_BALANCE: { ttl: 60 * 1000, storage: 'memory' as const }, // 1 minute
  METER_STATUS: { ttl: 30 * 1000, storage: 'memory' as const }, // 30 seconds
  
  // Frequently changing data
  METER_CONSUMPTION: { ttl: 5 * 60 * 1000, storage: 'memory' as const }, // 5 minutes
  METER_CREDITS: { ttl: 5 * 60 * 1000, storage: 'memory' as const }, // 5 minutes
  PAYMENT_HISTORY: { ttl: 5 * 60 * 1000, storage: 'sessionStorage' as const }, // 5 minutes
  
  // Moderately changing data
  METERS: { ttl: 10 * 60 * 1000, storage: 'sessionStorage' as const }, // 10 minutes
  USERS: { ttl: 15 * 60 * 1000, storage: 'sessionStorage' as const }, // 15 minutes
  PROPERTIES: { ttl: 30 * 60 * 1000, storage: 'sessionStorage' as const }, // 30 minutes
  
  // Relatively static data
  TARIFFS: { ttl: 60 * 60 * 1000, storage: 'localStorage' as const }, // 1 hour
  SERVICE_FEES: { ttl: 60 * 60 * 1000, storage: 'localStorage' as const }, // 1 hour
  SYSTEM_SETTINGS: { ttl: 60 * 60 * 1000, storage: 'localStorage' as const }, // 1 hour
  
  // Static data
  USER_ROLES: { ttl: 2 * 60 * 60 * 1000, storage: 'localStorage' as const }, // 2 hours
  SYSTEM_CONFIG: { ttl: 2 * 60 * 60 * 1000, storage: 'localStorage' as const }, // 2 hours
};

// Create singleton instance
export const cacheService = new CacheService();