import React from 'react';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Types for enhanced API functionality
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  meta?: any;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (retryCount: number, error: AxiosError) => void;
}

export interface LoadingState {
  isLoading: boolean;
  error: ApiError | null;
  lastUpdated: Date | null;
}

export interface ApiRequestOptions extends AxiosRequestConfig {
  retry?: Partial<RetryConfig>;
  skipErrorHandling?: boolean;
  skipLoadingState?: boolean;
  cacheKey?: string;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
  onRetry: (retryCount: number, error: AxiosError) => {
    console.warn(`API request retry ${retryCount}:`, error.message);
  }
};

// Loading state manager
class LoadingStateManager {
  private states = new Map<string, LoadingState>();
  private listeners = new Map<string, Set<(state: LoadingState) => void>>();

  getState(key: string): LoadingState {
    return this.states.get(key) || {
      isLoading: false,
      error: null,
      lastUpdated: null
    };
  }

  setState(key: string, state: Partial<LoadingState>): void {
    const currentState = this.getState(key);
    const newState = { ...currentState, ...state };
    this.states.set(key, newState);
    
    // Notify listeners
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(newState));
    }
  }

  subscribe(key: string, listener: (state: LoadingState) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  setLoading(key: string, isLoading: boolean): void {
    this.setState(key, { 
      isLoading, 
      error: isLoading ? null : this.getState(key).error 
    });
  }

  setError(key: string, error: ApiError | null): void {
    this.setState(key, { 
      error, 
      isLoading: false,
      lastUpdated: error ? null : new Date()
    });
  }

  setSuccess(key: string): void {
    this.setState(key, { 
      isLoading: false, 
      error: null, 
      lastUpdated: new Date() 
    });
  }

  clear(key?: string): void {
    if (key) {
      this.states.delete(key);
      this.listeners.delete(key);
    } else {
      this.states.clear();
      this.listeners.clear();
    }
  }
}

// Global loading state manager instance
export const loadingStateManager = new LoadingStateManager();

// Enhanced API class
class EnhancedApi {
  private instance: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for timeout tracking
        config.metadata = {
          ...config.metadata,
          startTime: Date.now()
        };

        return config;
      },
      (error) => Promise.reject(this.formatError(error))
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        // Add response time to metadata
        const startTime = response.config.metadata?.startTime;
        if (startTime) {
          response.config.metadata.responseTime = Date.now() - startTime;
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post('/auth/refresh', {
                refresh_token: refreshToken,
              });

              const { access_token } = response.data.data;
              localStorage.setItem('access_token', access_token);

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure();
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.response.statusText || 'Server error',
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data?.details || error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  private handleAuthFailure(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    
    // Clear all loading states
    loadingStateManager.clear();
    
    // Redirect to login
    window.location.href = '/login';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: RetryConfig
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError;
    
    for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as AxiosError;
        
        // Don't retry if it's the last attempt or retry condition is not met
        if (attempt === retryConfig.retries || !retryConfig.retryCondition!(lastError)) {
          throw lastError;
        }

        // Call onRetry callback
        if (retryConfig.onRetry) {
          retryConfig.onRetry(attempt + 1, lastError);
        }

        // Wait before retrying with exponential backoff
        const delay = retryConfig.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  async request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    const { retry, skipErrorHandling, skipLoadingState, cacheKey, ...axiosConfig } = options;
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry };
    const loadingKey = cacheKey || `${axiosConfig.method || 'GET'}_${axiosConfig.url}`;

    try {
      // Set loading state
      if (!skipLoadingState) {
        loadingStateManager.setLoading(loadingKey, true);
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(
        () => this.instance.request<T>(axiosConfig),
        retryConfig
      );

      // Set success state
      if (!skipLoadingState) {
        loadingStateManager.setSuccess(loadingKey);
      }

      return {
        data: response.data,
        status: response.status,
        message: response.data?.message,
        meta: response.data?.meta
      };
    } catch (error) {
      const apiError = this.formatError(error);
      
      // Set error state
      if (!skipLoadingState) {
        loadingStateManager.setError(loadingKey, apiError);
      }

      // Handle specific error cases
      if (!skipErrorHandling) {
        this.handleError(apiError);
      }

      throw apiError;
    }
  }

  private handleError(error: ApiError): void {
    // Handle specific error types
    switch (error.status) {
      case 401:
        this.handleAuthFailure();
        break;
      case 403:
        window.location.href = '/unauthorized';
        break;
      case 404:
        console.warn('Resource not found:', error.message);
        break;
      case 422:
        console.warn('Validation error:', error.details);
        break;
      case 429:
        console.warn('Rate limit exceeded:', error.message);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.error('Server error:', error.message);
        break;
      default:
        console.error('API error:', error.message);
    }
  }

  // Convenience methods
  async get<T = any>(url: string, options: Omit<ApiRequestOptions, 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'url' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'url' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'url' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, options: Omit<ApiRequestOptions, 'method' | 'url'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'DELETE', url });
  }

  // Batch requests
  async batch<T = any>(requests: ApiRequestOptions[]): Promise<ApiResponse<T>[]> {
    const promises = requests.map(request => this.request<T>(request));
    return Promise.allSettled(promises).then(results =>
      results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          throw result.reason;
        }
      })
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { skipErrorHandling: true, skipLoadingState: true });
      return true;
    } catch {
      return false;
    }
  }

  // Get loading state for a specific key
  getLoadingState(key: string): LoadingState {
    return loadingStateManager.getState(key);
  }

  // Subscribe to loading state changes
  subscribeToLoadingState(key: string, callback: (state: LoadingState) => void): () => void {
    return loadingStateManager.subscribe(key, callback);
  }
}

// Create enhanced API instance
export const enhancedApi = new EnhancedApi();

// React hook for API loading states
export function useApiLoadingState(key: string): LoadingState {
  const [state, setState] = React.useState<LoadingState>(loadingStateManager.getState(key));

  React.useEffect(() => {
    const unsubscribe = loadingStateManager.subscribe(key, setState);
    return unsubscribe;
  }, [key]);

  return state;
}

// React hook for API requests with loading state
export function useApiRequest<T = any>(
  requestFn: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  options: { immediate?: boolean; key?: string } = {}
): {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
} {
  const { immediate = true, key } = options;
  const [data, setData] = React.useState<T | null>(null);
  const requestKey = key || `request_${Date.now()}_${Math.random()}`;
  const loadingState = useApiLoadingState(requestKey);

  const execute = React.useCallback(async () => {
    try {
      loadingStateManager.setLoading(requestKey, true);
      const response = await requestFn();
      setData(response.data);
      loadingStateManager.setSuccess(requestKey);
    } catch (error) {
      const apiError = error as ApiError;
      loadingStateManager.setError(requestKey, apiError);
      setData(null);
    }
  }, [requestFn, requestKey]);

  React.useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    data,
    loading: loadingState.isLoading,
    error: loadingState.error,
    refetch: execute,
    lastUpdated: loadingState.lastUpdated
  };
}

export default enhancedApi;