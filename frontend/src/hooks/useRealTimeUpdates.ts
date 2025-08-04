import { useState, useEffect, useRef } from 'react';

interface UseRealTimeUpdatesOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * A hook for handling real-time updates using Server-Sent Events (SSE)
 * with automatic reconnection.
 */
const useRealTimeUpdates = ({
  url,
  onMessage,
  onError,
  enabled = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseRealTimeUpdatesOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!enabled) return;
    
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };
      
      eventSource.onerror = (event) => {
        setIsConnected(false);
        setError(event);
        
        if (onError) {
          onError(event);
        }
        
        // Close the connection
        eventSource.close();
        
        // Attempt to reconnect if we haven't exceeded the maximum attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, reconnectInterval);
        } else {
          console.error(`Failed to connect after ${maxReconnectAttempts} attempts.`);
        }
      };
      
      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error creating EventSource:', err);
      setError(err as Event);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [url, enabled]);

  return {
    isConnected,
    error,
    connect,
    disconnect
  };
};

export default useRealTimeUpdates;