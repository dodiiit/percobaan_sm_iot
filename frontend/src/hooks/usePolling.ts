import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions<T> {
  fetchFn: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

/**
 * A hook for polling data at regular intervals
 */
const usePolling = <T>({
  fetchFn,
  interval = 10000,
  enabled = true,
  onSuccess,
  onError,
  initialData
}: UsePollingOptions<T>) => {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(enabled);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!isPolling) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
      
      // Schedule the next poll
      if (isPolling) {
        timeoutRef.current = setTimeout(fetchData, interval);
      }
    }
  }, [fetchFn, interval, isPolling, onSuccess, onError]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, fetchData]);

  useEffect(() => {
    setIsPolling(enabled);
  }, [enabled]);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch
  };
};

export default usePolling;