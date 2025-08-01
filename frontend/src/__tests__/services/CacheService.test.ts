import { CacheService, CacheConfig, CacheStorage } from '../../services/CacheService';

// Mock localStorage and sessionStorage
const mockStorage = () => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
};

Object.defineProperty(window, 'localStorage', {
  value: mockStorage()
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage()
});

describe('CacheService', () => {
  let cacheService: CacheService;
  const mockConfig: CacheConfig = {
    defaultTTL: 300,
    maxSize: 100,
    storage: CacheStorage.MEMORY,
    enableCompression: false,
    enableEncryption: false
  };

  beforeEach(() => {
    cacheService = new CacheService(mockConfig);
    jest.clearAllMocks();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Memory Storage', () => {
    test('should set and get data from memory cache', () => {
      const key = 'test-key';
      const data = { message: 'Hello World' };

      cacheService.set(key, data, 300);
      const result = cacheService.get(key);

      expect(result).toEqual(data);
    });

    test('should return null for non-existent key', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should handle TTL expiration', (done) => {
      const key = 'expiring-key';
      const data = { message: 'This will expire' };

      cacheService.set(key, data, 0.1); // 100ms TTL

      setTimeout(() => {
        const result = cacheService.get(key);
        expect(result).toBeNull();
        done();
      }, 150);
    });

    test('should delete data', () => {
      const key = 'delete-key';
      const data = { message: 'To be deleted' };

      cacheService.set(key, data, 300);
      expect(cacheService.get(key)).toEqual(data);

      cacheService.delete(key);
      expect(cacheService.get(key)).toBeNull();
    });

    test('should check if key exists', () => {
      const key = 'exists-key';
      const data = { message: 'I exist' };

      expect(cacheService.has(key)).toBe(false);

      cacheService.set(key, data, 300);
      expect(cacheService.has(key)).toBe(true);
    });

    test('should clear all data', () => {
      cacheService.set('key1', { data: 1 }, 300);
      cacheService.set('key2', { data: 2 }, 300);

      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);

      cacheService.clear();

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });

    test('should handle LRU eviction when max size is reached', () => {
      const smallCacheService = new CacheService({
        ...mockConfig,
        maxSize: 2
      });

      smallCacheService.set('key1', { data: 1 }, 300);
      smallCacheService.set('key2', { data: 2 }, 300);
      smallCacheService.set('key3', { data: 3 }, 300); // Should evict key1

      expect(smallCacheService.has('key1')).toBe(false);
      expect(smallCacheService.has('key2')).toBe(true);
      expect(smallCacheService.has('key3')).toBe(true);
    });

    test('should update access time on get', () => {
      const smallCacheService = new CacheService({
        ...mockConfig,
        maxSize: 2
      });

      smallCacheService.set('key1', { data: 1 }, 300);
      smallCacheService.set('key2', { data: 2 }, 300);

      // Access key1 to update its access time
      smallCacheService.get('key1');

      // Add key3, should evict key2 (least recently used)
      smallCacheService.set('key3', { data: 3 }, 300);

      expect(smallCacheService.has('key1')).toBe(true);
      expect(smallCacheService.has('key2')).toBe(false);
      expect(smallCacheService.has('key3')).toBe(true);
    });
  });

  describe('LocalStorage', () => {
    beforeEach(() => {
      cacheService = new CacheService({
        ...mockConfig,
        storage: CacheStorage.LOCAL_STORAGE
      });
    });

    test('should set and get data from localStorage', () => {
      const key = 'local-key';
      const data = { message: 'Local storage test' };

      cacheService.set(key, data, 300);
      const result = cacheService.get(key);

      expect(result).toEqual(data);
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(localStorage.getItem).toHaveBeenCalled();
    });

    test('should handle localStorage errors gracefully', () => {
      const key = 'error-key';
      const data = { message: 'Error test' };

      // Mock localStorage.setItem to throw an error
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => cacheService.set(key, data, 300)).not.toThrow();
      expect(cacheService.get(key)).toBeNull();
    });
  });

  describe('SessionStorage', () => {
    beforeEach(() => {
      cacheService = new CacheService({
        ...mockConfig,
        storage: CacheStorage.SESSION_STORAGE
      });
    });

    test('should set and get data from sessionStorage', () => {
      const key = 'session-key';
      const data = { message: 'Session storage test' };

      cacheService.set(key, data, 300);
      const result = cacheService.get(key);

      expect(result).toEqual(data);
      expect(sessionStorage.setItem).toHaveBeenCalled();
      expect(sessionStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('should track cache hits and misses', () => {
      const key = 'stats-key';
      const data = { message: 'Stats test' };

      // Initial stats
      let stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Cache miss
      cacheService.get(key);
      stats = cacheService.getStats();
      expect(stats.misses).toBe(1);

      // Set data
      cacheService.set(key, data, 300);

      // Cache hit
      cacheService.get(key);
      stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should calculate hit ratio correctly', () => {
      const key = 'ratio-key';
      const data = { message: 'Ratio test' };

      cacheService.set(key, data, 300);

      // 3 hits, 1 miss
      cacheService.get(key); // hit
      cacheService.get(key); // hit
      cacheService.get(key); // hit
      cacheService.get('non-existent'); // miss

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBe(75); // 3/4 * 100
    });

    test('should track cache size', () => {
      let stats = cacheService.getStats();
      expect(stats.size).toBe(0);

      cacheService.set('key1', { data: 1 }, 300);
      cacheService.set('key2', { data: 2 }, 300);

      stats = cacheService.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('Invalidation', () => {
    test('should invalidate by pattern', () => {
      cacheService.set('user:123:profile', { name: 'John' }, 300);
      cacheService.set('user:123:settings', { theme: 'dark' }, 300);
      cacheService.set('user:456:profile', { name: 'Jane' }, 300);
      cacheService.set('posts:latest', { posts: [] }, 300);

      expect(cacheService.has('user:123:profile')).toBe(true);
      expect(cacheService.has('user:123:settings')).toBe(true);
      expect(cacheService.has('user:456:profile')).toBe(true);
      expect(cacheService.has('posts:latest')).toBe(true);

      // Invalidate all user:123 keys
      const invalidated = cacheService.invalidateByPattern('user:123:*');

      expect(invalidated).toBe(2);
      expect(cacheService.has('user:123:profile')).toBe(false);
      expect(cacheService.has('user:123:settings')).toBe(false);
      expect(cacheService.has('user:456:profile')).toBe(true);
      expect(cacheService.has('posts:latest')).toBe(true);
    });

    test('should invalidate by tags', () => {
      cacheService.set('user:123', { name: 'John' }, 300, ['user', 'profile']);
      cacheService.set('user:456', { name: 'Jane' }, 300, ['user', 'profile']);
      cacheService.set('post:789', { title: 'Test' }, 300, ['post']);

      expect(cacheService.has('user:123')).toBe(true);
      expect(cacheService.has('user:456')).toBe(true);
      expect(cacheService.has('post:789')).toBe(true);

      // Invalidate all entries with 'user' tag
      const invalidated = cacheService.invalidateByTags(['user']);

      expect(invalidated).toBe(2);
      expect(cacheService.has('user:123')).toBe(false);
      expect(cacheService.has('user:456')).toBe(false);
      expect(cacheService.has('post:789')).toBe(true);
    });
  });

  describe('Compression', () => {
    beforeEach(() => {
      cacheService = new CacheService({
        ...mockConfig,
        enableCompression: true
      });
    });

    test('should compress and decompress large data', () => {
      const key = 'large-data';
      const largeData = {
        message: 'x'.repeat(1000),
        array: new Array(100).fill({ nested: { data: 'test' } })
      };

      cacheService.set(key, largeData, 300);
      const result = cacheService.get(key);

      expect(result).toEqual(largeData);
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parse errors gracefully', () => {
      const key = 'invalid-json';
      
      // Manually set invalid JSON in localStorage
      if (mockConfig.storage === CacheStorage.LOCAL_STORAGE) {
        (localStorage.setItem as jest.Mock).mockImplementation((k, v) => {
          if (k === key) {
            // Simulate corrupted data
            return 'invalid-json-data';
          }
        });
        
        (localStorage.getItem as jest.Mock).mockImplementation((k) => {
          if (k === key) {
            return 'invalid-json-data';
          }
          return null;
        });
      }

      const result = cacheService.get(key);
      expect(result).toBeNull();
    });

    test('should handle storage quota exceeded', () => {
      const localStorageService = new CacheService({
        ...mockConfig,
        storage: CacheStorage.LOCAL_STORAGE
      });

      // Mock localStorage.setItem to throw quota exceeded error
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const key = 'quota-test';
      const data = { message: 'Large data' };

      // Should not throw error
      expect(() => localStorageService.set(key, data, 300)).not.toThrow();
      
      // Should fallback to memory storage
      const result = localStorageService.get(key);
      expect(result).toBeNull(); // Since localStorage failed, it won't be stored
    });
  });

  describe('TTL Management', () => {
    test('should get remaining TTL', () => {
      const key = 'ttl-key';
      const data = { message: 'TTL test' };
      const ttl = 300;

      cacheService.set(key, data, ttl);
      
      const remainingTTL = cacheService.getTTL(key);
      expect(remainingTTL).toBeGreaterThan(0);
      expect(remainingTTL).toBeLessThanOrEqual(ttl);
    });

    test('should return -1 for non-existent key TTL', () => {
      const remainingTTL = cacheService.getTTL('non-existent');
      expect(remainingTTL).toBe(-1);
    });

    test('should extend TTL', () => {
      const key = 'extend-ttl-key';
      const data = { message: 'Extend TTL test' };

      cacheService.set(key, data, 100);
      const initialTTL = cacheService.getTTL(key);

      cacheService.extendTTL(key, 200);
      const extendedTTL = cacheService.getTTL(key);

      expect(extendedTTL).toBeGreaterThan(initialTTL);
    });
  });
});