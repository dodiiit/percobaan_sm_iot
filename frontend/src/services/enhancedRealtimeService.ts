import { enhancedApi, ApiResponse, ApiError } from './enhancedApi';
import { handleApiError } from './errorHandler';

export interface RealtimeUpdate {
  id: string;
  type: 'meter_reading' | 'meter_status' | 'payment' | 'alert' | 'notification';
  meter_id?: string;
  customer_id?: string;
  data: any;
  timestamp: string;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface MeterRealtimeData {
  meter_id: string;
  current_reading: number;
  flow_rate: number;
  pressure: number;
  temperature: number;
  battery_level: number;
  signal_strength: number;
  valve_status: 'open' | 'closed';
  alerts: string[];
  timestamp: string;
}

export interface RealtimeConnectionConfig {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export interface RealtimeSubscription {
  id: string;
  type: string;
  filters?: any;
  callback: (data: any) => void;
  errorCallback?: (error: ApiError) => void;
}

class EnhancedRealtimeService {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private config: RealtimeConnectionConfig;

  constructor(config: RealtimeConnectionConfig = {}) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      timeout: 10000,
      ...config
    };
  }

  // Get connection status
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Subscribe to real-time updates for a specific meter
  async subscribeMeterUpdates(
    meterId: string,
    callback: (data: MeterRealtimeData) => void,
    errorCallback?: (error: ApiError) => void
  ): Promise<string> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    const subscriptionId = `meter_${meterId}_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      type: 'meter_updates',
      filters: { meter_id: meterId },
      callback,
      errorCallback
    };

    this.subscriptions.set(subscriptionId, subscription);
    await this.startPolling(subscriptionId);

    return subscriptionId;
  }

  // Subscribe to notifications
  async subscribeNotifications(
    callback: (data: NotificationData) => void,
    errorCallback?: (error: ApiError) => void
  ): Promise<string> {
    const subscriptionId = `notifications_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      type: 'notifications',
      callback,
      errorCallback
    };

    this.subscriptions.set(subscriptionId, subscription);
    await this.startPolling(subscriptionId);

    return subscriptionId;
  }

  // Subscribe to general real-time updates
  async subscribeUpdates(
    filters: any = {},
    callback: (data: RealtimeUpdate) => void,
    errorCallback?: (error: ApiError) => void
  ): Promise<string> {
    const subscriptionId = `updates_${Date.now()}`;
    
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      type: 'general_updates',
      filters,
      callback,
      errorCallback
    };

    this.subscriptions.set(subscriptionId, subscription);
    await this.startPolling(subscriptionId);

    return subscriptionId;
  }

  // Unsubscribe from updates
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    // Stop polling for this subscription
    const interval = this.pollingIntervals.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(subscriptionId);
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    // If no more subscriptions, disconnect
    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  // Unsubscribe from all updates
  async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    
    for (const id of subscriptionIds) {
      await this.unsubscribe(id);
    }
  }

  // Start polling for a subscription
  private async startPolling(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    this.connectionStatus = 'connecting';

    // Initial fetch
    await this.fetchUpdates(subscription);

    // Set up polling interval
    const interval = setInterval(async () => {
      try {
        await this.fetchUpdates(subscription);
        this.reconnectAttempts = 0; // Reset on success
      } catch (error) {
        await this.handlePollingError(subscriptionId, error as ApiError);
      }
    }, this.config.heartbeatInterval);

    this.pollingIntervals.set(subscriptionId, interval);
    this.connectionStatus = 'connected';
  }

  // Fetch updates for a subscription
  private async fetchUpdates(subscription: RealtimeSubscription): Promise<void> {
    try {
      let response: ApiResponse<any>;

      switch (subscription.type) {
        case 'meter_updates':
          response = await this.getMeterUpdates(subscription.filters.meter_id);
          break;
        case 'notifications':
          response = await this.getNotifications();
          break;
        case 'general_updates':
          response = await this.getGeneralUpdates(subscription.filters);
          break;
        default:
          throw {
            message: `Unknown subscription type: ${subscription.type}`,
            code: 'INVALID_SUBSCRIPTION_TYPE'
          } as ApiError;
      }

      // Call subscription callback with data
      subscription.callback(response.data);

    } catch (error) {
      const apiError = error as ApiError;
      
      // Handle error
      handleApiError(apiError, {
        showToast: false, // Don't show toast for polling errors
        logError: true
      }, {
        component: 'RealtimeService',
        action: `fetch_${subscription.type}`
      });

      // Call error callback if provided
      if (subscription.errorCallback) {
        subscription.errorCallback(apiError);
      }

      throw error;
    }
  }

  // Handle polling errors with reconnection logic
  private async handlePollingError(subscriptionId: string, error: ApiError): Promise<void> {
    this.connectionStatus = 'error';
    this.reconnectAttempts++;

    // If max reconnect attempts reached, stop polling
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnect attempts reached. Stopping polling for subscription:', subscriptionId);
      await this.unsubscribe(subscriptionId);
      return;
    }

    // If auto-reconnect is enabled, try to reconnect
    if (this.config.autoReconnect) {
      console.warn(`Reconnect attempt ${this.reconnectAttempts} for subscription ${subscriptionId}`);
      
      setTimeout(async () => {
        try {
          const subscription = this.subscriptions.get(subscriptionId);
          if (subscription) {
            await this.fetchUpdates(subscription);
            this.connectionStatus = 'connected';
          }
        } catch (retryError) {
          // Will be handled in the next polling cycle
        }
      }, this.config.reconnectInterval);
    }
  }

  // Get meter updates via polling
  private async getMeterUpdates(meterId: string): Promise<ApiResponse<MeterRealtimeData>> {
    return enhancedApi.get(`/realtime/meters/${meterId}/updates`, {
      cacheKey: `realtime_meter_${meterId}`,
      timeout: this.config.timeout,
      retry: {
        retries: 1,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Only retry on server errors
          return (error.response?.status || 0) >= 500;
        }
      }
    });
  }

  // Get notifications via polling
  private async getNotifications(): Promise<ApiResponse<NotificationData[]>> {
    return enhancedApi.get('/realtime/notifications', {
      cacheKey: 'realtime_notifications',
      timeout: this.config.timeout,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Get general updates via polling
  private async getGeneralUpdates(filters: any = {}): Promise<ApiResponse<RealtimeUpdate[]>> {
    return enhancedApi.get('/realtime/updates', {
      params: filters,
      cacheKey: `realtime_updates_${JSON.stringify(filters)}`,
      timeout: this.config.timeout,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Disconnect from real-time updates
  disconnect(): void {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();

    // Clear subscriptions
    this.subscriptions.clear();

    // Update connection status
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
  }

  // Reconnect to real-time updates
  async reconnect(): Promise<void> {
    this.disconnect();

    // Restart all subscriptions
    const subscriptions = Array.from(this.subscriptions.values());
    
    for (const subscription of subscriptions) {
      await this.startPolling(subscription.id);
    }
  }

  // Send real-time command to meter
  async sendMeterCommand(
    meterId: string,
    command: {
      type: 'valve_control' | 'reading_request' | 'config_update' | 'firmware_update';
      data: any;
    }
  ): Promise<ApiResponse<{ command_id: string; status: string }>> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    if (!command.type) {
      throw {
        message: 'Command type is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'type' }
      } as ApiError;
    }

    return enhancedApi.post(`/realtime/meters/${meterId}/commands`, command, {
      cacheKey: `meter_command_${meterId}_${command.type}`,
      timeout: 15000, // Extended timeout for real-time commands
      retry: {
        retries: 2,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Retry on server errors and timeouts
          return [500, 502, 503, 504, 408].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Get command status
  async getCommandStatus(commandId: string): Promise<ApiResponse<{
    id: string;
    status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed';
    response?: any;
    error?: string;
  }>> {
    if (!commandId) {
      throw {
        message: 'Command ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.get(`/realtime/commands/${commandId}/status`, {
      cacheKey: `command_status_${commandId}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Poll command status until completion
  async pollCommandStatus(
    commandId: string,
    options: {
      maxAttempts?: number;
      interval?: number;
      onUpdate?: (status: string) => void;
    } = {}
  ): Promise<ApiResponse<any>> {
    const { maxAttempts = 30, interval = 2000, onUpdate } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.getCommandStatus(commandId);
        const status = response.data.status;

        if (onUpdate) {
          onUpdate(status);
        }

        // Stop polling if command is completed or failed
        if (['completed', 'failed'].includes(status)) {
          return response;
        }

        // Wait before next poll
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw {
      message: 'Command status polling timeout',
      code: 'TIMEOUT_ERROR',
      details: { commandId, maxAttempts }
    } as ApiError;
  }

  // Bulk subscribe to multiple meters
  async bulkSubscribeMeterUpdates(
    meterIds: string[],
    callback: (meterId: string, data: MeterRealtimeData) => void,
    errorCallback?: (meterId: string, error: ApiError) => void
  ): Promise<string[]> {
    if (!meterIds || meterIds.length === 0) {
      throw {
        message: 'At least one meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    const subscriptionIds: string[] = [];

    for (const meterId of meterIds) {
      try {
        const subscriptionId = await this.subscribeMeterUpdates(
          meterId,
          (data) => callback(meterId, data),
          errorCallback ? (error) => errorCallback(meterId, error) : undefined
        );
        subscriptionIds.push(subscriptionId);
      } catch (error) {
        console.error(`Failed to subscribe to meter ${meterId}:`, error);
        if (errorCallback) {
          errorCallback(meterId, error as ApiError);
        }
      }
    }

    return subscriptionIds;
  }

  // Get real-time system status
  async getSystemStatus(): Promise<ApiResponse<{
    active_connections: number;
    active_meters: number;
    pending_commands: number;
    system_health: 'healthy' | 'degraded' | 'critical';
    last_update: string;
  }>> {
    return enhancedApi.get('/realtime/system/status', {
      cacheKey: 'realtime_system_status',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Get real-time statistics
  async getRealtimeStats(): Promise<ApiResponse<{
    messages_per_minute: number;
    average_response_time: number;
    error_rate: number;
    active_subscriptions: number;
    meter_connectivity: {
      online: number;
      offline: number;
      total: number;
    };
  }>> {
    return enhancedApi.get('/realtime/stats', {
      cacheKey: 'realtime_stats',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    if (!notificationId) {
      throw {
        message: 'Notification ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.put(`/notifications/${notificationId}/read`, {}, {
      cacheKey: `mark_notification_read_${notificationId}`,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Mark all notifications as read
  async markAllNotificationsRead(): Promise<ApiResponse<{ marked_count: number }>> {
    return enhancedApi.put('/notifications/mark-all-read', {}, {
      cacheKey: 'mark_all_notifications_read',
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    if (!notificationId) {
      throw {
        message: 'Notification ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.delete(`/notifications/${notificationId}`, {
      cacheKey: `delete_notification_${notificationId}`,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }

  // Get subscription info
  getSubscriptionInfo(): Array<{
    id: string;
    type: string;
    filters?: any;
    active: boolean;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      filters: sub.filters,
      active: this.pollingIntervals.has(sub.id)
    }));
  }

  // Health check for real-time service
  async healthCheck(): Promise<boolean> {
    try {
      await enhancedApi.get('/realtime/health', {
        skipErrorHandling: true,
        skipLoadingState: true,
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  // Test real-time connectivity
  async testConnectivity(): Promise<ApiResponse<{
    latency: number;
    packet_loss: number;
    connection_quality: 'excellent' | 'good' | 'fair' | 'poor';
  }>> {
    const startTime = Date.now();
    
    const response = await enhancedApi.get('/realtime/test', {
      skipLoadingState: true,
      timeout: 10000,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });

    const latency = Date.now() - startTime;
    
    return {
      ...response,
      data: {
        ...response.data,
        latency
      }
    };
  }

  // Emergency disconnect (stops all polling immediately)
  emergencyDisconnect(): void {
    console.warn('Emergency disconnect triggered for real-time service');
    
    // Clear all intervals immediately
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Update status
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
  }
}

// Create and export service instance
const enhancedRealtimeService = new EnhancedRealtimeService();
export default enhancedRealtimeService;

// Export class for testing
export { EnhancedRealtimeService };