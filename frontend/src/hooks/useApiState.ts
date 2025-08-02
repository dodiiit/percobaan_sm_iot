import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError, loadingStateManager } from '../services/enhancedApi';
import { handleApiError, ErrorHandlerConfig, ErrorContext } from '../services/errorHandler';

export interface UseApiStateOptions<T> {
  immediate?: boolean;
  dependencies?: any[];
  errorConfig?: ErrorHandlerConfig;
  errorContext?: Partial<ErrorContext>;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  retryOnMount?: boolean;
  cacheKey?: string;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: Date | null;
  retryCount: number;
}

export interface UseApiStateReturn<T> extends ApiState<T> {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: ApiError | null) => void;
}

// Hook for managing API request state
export function useApiState<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiStateOptions<T> = {}
): UseApiStateReturn<T> {
  const {
    immediate = false,
    dependencies = [],
    errorConfig = {},
    errorContext = {},
    onSuccess,
    onError,
    retryOnMount = false,
    cacheKey
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    retryCount: 0
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate unique key for this hook instance
  const instanceKey = useRef(cacheKey || `api_state_${Date.now()}_${Math.random()}`);

  // Execute API call
  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    // Update global loading state
    if (cacheKey) {
      loadingStateManager.setLoading(cacheKey, true);
    }

    try {
      const response = await apiCall();
      
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        retryCount: 0
      }));

      // Update global loading state
      if (cacheKey) {
        loadingStateManager.setSuccess(cacheKey);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const apiError = error as ApiError;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError,
        data: null
      }));

      // Update global loading state
      if (cacheKey) {
        loadingStateManager.setError(cacheKey, apiError);
      }

      // Handle error
      handleApiError(apiError, errorConfig, {
        ...errorContext,
        component: errorContext.component || 'useApiState'
      });

      // Call error callback
      if (onError) {
        onError(apiError);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [apiCall, onSuccess, onError, errorConfig, errorContext, cacheKey]);

  // Retry with exponential backoff
  const retry = useCallback(async () => {
    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    // Add delay for retries
    const delay = Math.min(1000 * Math.pow(2, state.retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    await execute();
  }, [execute, state.retryCount]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
      retryCount: 0
    });

    if (cacheKey) {
      loadingStateManager.setState(cacheKey, {
        isLoading: false,
        error: null,
        lastUpdated: null
      });
    }
  }, [cacheKey]);

  // Set data manually
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      lastUpdated: data ? new Date() : null
    }));
  }, []);

  // Set error manually
  const setError = useCallback((error: ApiError | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false
    }));
  }, []);

  // Execute on mount or dependency change
  useEffect(() => {
    if (immediate || (retryOnMount && state.error)) {
      execute();
    }
  }, [immediate, retryOnMount, execute, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    setData,
    setError
  };
}

// Hook for paginated API requests
export interface UsePaginatedApiStateOptions<T> extends UseApiStateOptions<T> {
  initialPage?: number;
  initialLimit?: number;
}

export interface PaginatedApiState<T> extends ApiState<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UsePaginatedApiStateReturn<T> extends Omit<UseApiStateReturn<T[]>, 'data'> {
  data: T[];
  pagination: PaginatedApiState<T>['pagination'];
  loadMore: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePaginatedApiState<T = any>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<{ data: T[]; total: number }>>,
  options: UsePaginatedApiStateOptions<T[]> = {}
): UsePaginatedApiStateReturn<T> {
  const { initialPage = 1, initialLimit = 20, ...apiOptions } = options;
  
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  const paginatedApiCall = useCallback(async () => {
    const response = await apiCall(pagination.page, pagination.limit);
    
    // Update pagination info
    const total = response.data.total || 0;
    const totalPages = Math.ceil(total / pagination.limit);
    
    setPagination(prev => ({
      ...prev,
      total,
      totalPages,
      hasMore: prev.page < totalPages
    }));

    return {
      ...response,
      data: response.data.data
    };
  }, [apiCall, pagination.page, pagination.limit]);

  const apiState = useApiState<T[]>(paginatedApiCall, {
    ...apiOptions,
    dependencies: [pagination.page, pagination.limit, ...(apiOptions.dependencies || [])]
  });

  // Load more items (append to existing data)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || apiState.loading) return;

    const nextPage = pagination.page + 1;
    setPagination(prev => ({ ...prev, page: nextPage }));

    try {
      const response = await apiCall(nextPage, pagination.limit);
      const newData = response.data.data;
      
      apiState.setData([...(apiState.data || []), ...newData]);
      
      // Update pagination
      const total = response.data.total || 0;
      const totalPages = Math.ceil(total / pagination.limit);
      
      setPagination(prev => ({
        ...prev,
        total,
        totalPages,
        hasMore: nextPage < totalPages
      }));
    } catch (error) {
      // Revert page on error
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      throw error;
    }
  }, [apiCall, pagination, apiState]);

  // Load specific page (replace existing data)
  const loadPage = useCallback(async (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Refresh current page
  const refresh = useCallback(async () => {
    await apiState.execute();
  }, [apiState.execute]);

  return {
    ...apiState,
    data: apiState.data || [],
    pagination,
    loadMore,
    loadPage,
    refresh
  };
}

// Hook for real-time data with polling
export interface UsePollingApiStateOptions<T> extends UseApiStateOptions<T> {
  interval?: number;
  enabled?: boolean;
  maxRetries?: number;
}

export function usePollingApiState<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UsePollingApiStateOptions<T> = {}
): UseApiStateReturn<T> & { startPolling: () => void; stopPolling: () => void; isPolling: boolean } {
  const { interval = 5000, enabled = false, maxRetries = 3, ...apiOptions } = options;
  
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const apiState = useApiState<T>(apiCall, apiOptions);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    setIsPolling(true);
    retryCountRef.current = 0;

    const poll = async () => {
      try {
        await apiState.execute();
        retryCountRef.current = 0; // Reset retry count on success
      } catch (error) {
        retryCountRef.current++;
        
        // Stop polling if max retries exceeded
        if (retryCountRef.current >= maxRetries) {
          stopPolling();
          console.error('Polling stopped due to max retries exceeded');
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [apiState.execute, interval, maxRetries]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    retryCountRef.current = 0;
  }, []);

  // Auto-start/stop polling based on enabled option
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...apiState,
    startPolling,
    stopPolling,
    isPolling
  };
}