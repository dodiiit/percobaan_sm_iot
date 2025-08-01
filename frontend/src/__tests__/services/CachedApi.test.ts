import axios from 'axios';
import { CachedApi } from '../../services/CachedApi';
import { CacheService, CacheStorage } from '../../services/CacheService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock CacheService
jest.mock('../../services/CacheService');
const MockedCacheService = CacheService as jest.MockedClass<typeof CacheService>;

describe('CachedApi', () => {
  let cachedApi: CachedApi;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock cache service instance
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
      invalidateByPattern: jest.fn(),
      invalidateByTags: jest.fn(),
      getTTL: jest.fn(),
      extendTTL: jest.fn()
    } as any;

    MockedCacheService.mockImplementation(() => mockCacheService);

    // Create CachedApi instance
    cachedApi = new CachedApi({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      cache: {
        defaultTTL: 300,
        maxSize: 100,
        storage: CacheStorage.MEMORY,
        enableCompression: false,
        enableEncryption: false
      }
    });

    // Mock axios instance
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    } as any);
  });

  describe('GET Requests with Caching', () => {
    test('should return cached data on cache hit', async () => {
      const url = '/api/users';
      const cachedData = { users: [{ id: 1, name: 'John' }] };
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue(cachedData);

      const result = await cachedApi.get(url);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedData);
      expect(mockedAxios.create().get).not.toHaveBeenCalled();
    });

    test('should make API call and cache response on cache miss', async () => {
      const url = '/api/users';
      const responseData = { users: [{ id: 1, name: 'John' }] };
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      const result = await cachedApi.get(url);

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, undefined);
      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, responseData, 300, undefined);
      expect(result).toEqual(responseData);
    });

    test('should include query parameters in cache key', async () => {
      const url = '/api/users';
      const params = { page: 1, limit: 10 };
      const cacheKey = 'GET:/api/users?page=1&limit=10';

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { users: [] },
        status: 200,
        headers: {}
      });

      await cachedApi.get(url, { params });

      expect(mockCacheService.get).toHaveBeenCalledWith(cacheKey);
    });

    test('should respect custom TTL', async () => {
      const url = '/api/users';
      const responseData = { users: [] };
      const customTTL = 600;
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      await cachedApi.get(url, { cacheTTL: customTTL });

      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, responseData, customTTL, undefined);
    });

    test('should respect cache tags', async () => {
      const url = '/api/users';
      const responseData = { users: [] };
      const tags = ['users', 'profiles'];
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      await cachedApi.get(url, { cacheTags: tags });

      expect(mockCacheService.set).toHaveBeenCalledWith(cacheKey, responseData, 300, tags);
    });

    test('should bypass cache when disabled', async () => {
      const url = '/api/users';
      const responseData = { users: [] };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      await cachedApi.get(url, { cache: false });

      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, { cache: false });
    });
  });

  describe('ETag Support', () => {
    test('should handle ETag caching', async () => {
      const url = '/api/users';
      const etag = '"abc123"';
      const responseData = { users: [] };
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue({
        data: responseData,
        etag: etag
      });

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 304,
        headers: { etag }
      });

      const result = await cachedApi.get(url, { useETag: true });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(url, {
        useETag: true,
        headers: { 'If-None-Match': etag }
      });
      expect(result).toEqual(responseData);
    });

    test('should update cache on ETag mismatch', async () => {
      const url = '/api/users';
      const oldEtag = '"abc123"';
      const newEtag = '"def456"';
      const oldData = { users: [{ id: 1, name: 'John' }] };
      const newData = { users: [{ id: 1, name: 'Jane' }] };
      const cacheKey = 'GET:/api/users';

      mockCacheService.get.mockReturnValue({
        data: oldData,
        etag: oldEtag
      });

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: newData,
        status: 200,
        headers: { etag: newEtag }
      });

      const result = await cachedApi.get(url, { useETag: true });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        cacheKey,
        { data: newData, etag: newEtag },
        300,
        undefined
      );
      expect(result).toEqual(newData);
    });
  });

  describe('Non-GET Requests', () => {
    test('should not cache POST requests', async () => {
      const url = '/api/users';
      const postData = { name: 'John' };
      const responseData = { id: 1, name: 'John' };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 201,
        headers: {}
      });

      const result = await cachedApi.post(url, postData);

      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(url, postData, undefined);
      expect(result).toEqual(responseData);
    });

    test('should invalidate cache on POST request', async () => {
      const url = '/api/users';
      const postData = { name: 'John' };
      const responseData = { id: 1, name: 'John' };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 201,
        headers: {}
      });

      await cachedApi.post(url, postData, { invalidatePatterns: ['users*'] });

      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith('users*');
    });

    test('should invalidate cache by tags on PUT request', async () => {
      const url = '/api/users/1';
      const putData = { name: 'Jane' };
      const responseData = { id: 1, name: 'Jane' };

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.put as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      await cachedApi.put(url, putData, { invalidateTags: ['users', 'profiles'] });

      expect(mockCacheService.invalidateByTags).toHaveBeenCalledWith(['users', 'profiles']);
    });

    test('should invalidate cache on DELETE request', async () => {
      const url = '/api/users/1';

      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValue({
        data: { success: true },
        status: 200,
        headers: {}
      });

      await cachedApi.delete(url, { invalidatePatterns: ['users*', 'user:1:*'] });

      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith('users*');
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith('user:1:*');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const url = '/api/users';
      const networkError = new Error('Network Error');

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(networkError);

      await expect(cachedApi.get(url)).rejects.toThrow('Network Error');
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    test('should return cached data on network error if available', async () => {
      const url = '/api/users';
      const cachedData = { users: [{ id: 1, name: 'John' }] };
      const cacheKey = 'GET:/api/users';
      const networkError = new Error('Network Error');

      mockCacheService.get.mockReturnValue(cachedData);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(networkError);

      const result = await cachedApi.get(url, { fallbackToCache: true });

      expect(result).toEqual(cachedData);
    });

    test('should handle cache service errors gracefully', async () => {
      const url = '/api/users';
      const responseData = { users: [] };

      mockCacheService.get.mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: responseData,
        status: 200,
        headers: {}
      });

      const result = await cachedApi.get(url);

      expect(result).toEqual(responseData);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    test('should clear all cache', () => {
      cachedApi.clearCache();
      expect(mockCacheService.clear).toHaveBeenCalled();
    });

    test('should get cache stats', () => {
      const mockStats = {
        hits: 10,
        misses: 5,
        hitRatio: 66.67,
        size: 15
      };

      mockCacheService.getStats.mockReturnValue(mockStats);

      const stats = cachedApi.getCacheStats();
      expect(stats).toEqual(mockStats);
      expect(mockCacheService.getStats).toHaveBeenCalled();
    });

    test('should invalidate by pattern', () => {
      const pattern = 'users*';
      mockCacheService.invalidateByPattern.mockReturnValue(5);

      const result = cachedApi.invalidateByPattern(pattern);
      
      expect(result).toBe(5);
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith(pattern);
    });

    test('should invalidate by tags', () => {
      const tags = ['users', 'profiles'];
      mockCacheService.invalidateByTags.mockReturnValue(3);

      const result = cachedApi.invalidateByTags(tags);
      
      expect(result).toBe(3);
      expect(mockCacheService.invalidateByTags).toHaveBeenCalledWith(tags);
    });
  });

  describe('Request Interceptors', () => {
    test('should add authorization header when token is available', async () => {
      const url = '/api/users';
      const token = 'bearer-token-123';
      
      // Mock token storage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(token)
        }
      });

      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: { users: [] },
        status: 200,
        headers: {}
      });

      await cachedApi.get(url);

      // Verify that the request interceptor was set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('Response Interceptors', () => {
    test('should handle 401 responses by clearing auth token', async () => {
      const url = '/api/users';
      
      mockCacheService.get.mockReturnValue(null);
      
      const mockAxiosInstance = mockedAxios.create();
      const unauthorizedError = {
        response: { status: 401 },
        isAxiosError: true
      };
      
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(cachedApi.get(url)).rejects.toMatchObject({
        response: { status: 401 }
      });

      // Verify that the response interceptor was set up
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});