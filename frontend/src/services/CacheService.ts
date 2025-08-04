/**
 * Cache Service for API responses
 * Provides in-memory and localStorage caching options
 */

export enum CacheStorage {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
}

export interface CacheConfig {
  storage: CacheStorage;
  ttl: number; // Time to live in milliseconds
}

interface CacheItem {
  data: any;
  timestamp: number;
}

interface MemoryCache {
  [key: string]: CacheItem;
}

export class CacheService {
  private memoryCache: MemoryCache = {};
  private defaultConfig: CacheConfig = {
    storage: CacheStorage.MEMORY,
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
  };

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param config Cache configuration
   */
  set(key: string, data: any, config: Partial<CacheConfig> = {}): void {
    const { storage, ttl } = { ...this.defaultConfig, ...config };
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now(),
    };

    if (storage === CacheStorage.MEMORY) {
      this.memoryCache[key] = cacheItem;
    } else if (storage === CacheStorage.LOCAL_STORAGE) {
      try {
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.error('Error storing in localStorage:', error);
      }
    }
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @param config Cache configuration
   * @returns The cached data or null if not found or expired
   */
  get<T = any>(key: string, config: Partial<CacheConfig> = {}): T | null {
    const { storage, ttl } = { ...this.defaultConfig, ...config };
    let cacheItem: CacheItem | null = null;

    if (storage === CacheStorage.MEMORY) {
      cacheItem = this.memoryCache[key] || null;
    } else if (storage === CacheStorage.LOCAL_STORAGE) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          cacheItem = JSON.parse(item);
        }
      } catch (error) {
        console.error('Error retrieving from localStorage:', error);
        return null;
      }
    }

    if (!cacheItem) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cacheItem.timestamp > ttl) {
      this.delete(key, { storage });
      return null;
    }

    return cacheItem.data as T;
  }

  /**
   * Delete an item from the cache
   * @param key Cache key
   * @param config Cache configuration
   */
  delete(key: string, config: Partial<CacheConfig> = {}): void {
    const { storage } = { ...this.defaultConfig, ...config };

    if (storage === CacheStorage.MEMORY && this.memoryCache[key]) {
      delete this.memoryCache[key];
    } else if (storage === CacheStorage.LOCAL_STORAGE) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  }

  /**
   * Clear all items from the cache
   * @param config Cache configuration
   */
  clear(config: Partial<CacheConfig> = {}): void {
    const { storage } = { ...this.defaultConfig, ...config };

    if (storage === CacheStorage.MEMORY) {
      this.memoryCache = {};
    } else if (storage === CacheStorage.LOCAL_STORAGE) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  }
}

// Export a singleton instance
export default new CacheService();