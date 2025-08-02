import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios, { AxiosError } from 'axios';

// Mock axios
vi.mock('axios', () => ({
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    request: vi.fn(),
  })),
}));

// Import after mocking
const { enhancedApi, loadingStateManager } = await import('../../services/enhancedApi');

describe('EnhancedApi', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    request: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.create as any).mockReturnValue(mockAxiosInstance);
    loadingStateManager.clear();
  });

  describe('Request execution', () => {
    it('should execute successful requests', async () => {
      const mockResponse = {
        data: { message: 'success', data: { id: 1, name: 'test' } },
        status: 200,
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const response = await enhancedApi.get('/test');

      expect(response.data).toEqual(mockResponse.data);
      expect(response.status).toBe(200);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(enhancedApi.get('/test')).rejects.toMatchObject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error occurred' },
        },
      } as AxiosError;
      mockAxiosInstance.request.mockRejectedValue(serverError);

      await expect(enhancedApi.get('/test')).rejects.toMatchObject({
        message: 'Server error occurred',
        status: 500,
      });
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on server errors', async () => {
      const serverError = {
        response: { status: 500 },
      } as AxiosError;

      // First two calls fail, third succeeds
      mockAxiosInstance.request
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValue({ data: { success: true }, status: 200 });

      const response = await enhancedApi.get('/test', {
        retry: { retries: 2, retryDelay: 100 }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
      expect(response.data).toEqual({ success: true });
    });

    it('should not retry on client errors', async () => {
      const clientError = {
        response: { status: 400 },
      } as AxiosError;

      mockAxiosInstance.request.mockRejectedValue(clientError);

      await expect(enhancedApi.get('/test', {
        retry: { retries: 2, retryDelay: 100 }
      })).rejects.toBeDefined();

      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading state management', () => {
    it('should manage loading states correctly', () => {
      const key = 'test_key';

      // Initial state
      expect(loadingStateManager.getState(key)).toEqual({
        isLoading: false,
        error: null,
        lastUpdated: null,
      });

      // Set loading
      loadingStateManager.setLoading(key, true);
      expect(loadingStateManager.getState(key).isLoading).toBe(true);

      // Set success
      loadingStateManager.setSuccess(key);
      const successState = loadingStateManager.getState(key);
      expect(successState.isLoading).toBe(false);
      expect(successState.error).toBeNull();
      expect(successState.lastUpdated).toBeInstanceOf(Date);
    });
  });
});