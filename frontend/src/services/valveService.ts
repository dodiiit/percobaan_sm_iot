import api from './api';

export interface Valve {
  id: string;
  valve_id: string;
  meter_id: string;
  property_id: string;
  valve_type: 'main' | 'secondary' | 'emergency' | 'bypass';
  valve_model: string;
  valve_serial: string;
  firmware_version: string;
  hardware_version: string;
  location_description?: string;
  latitude?: number;
  longitude?: number;
  installation_date: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error' | 'offline';
  current_state: 'open' | 'closed' | 'partial' | 'unknown';
  last_command?: 'open' | 'close' | 'partial_open' | 'emergency_close';
  last_command_at?: string;
  last_response_at?: string;
  battery_level?: number;
  signal_strength?: number;
  operating_pressure?: number;
  max_pressure: number;
  temperature?: number;
  is_manual_override: boolean;
  manual_override_reason?: string;
  manual_override_at?: string;
  auto_close_enabled: boolean;
  emergency_close_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValveCommand {
  id: string;
  valve_id: string;
  command_type: 'open' | 'close' | 'partial_open' | 'emergency_close' | 'status_check' | 'reset';
  command_value?: any;
  initiated_by: string;
  initiated_by_name?: string;
  reason?: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  sent_at?: string;
  acknowledged_at?: string;
  completed_at?: string;
  response_data?: any;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ValveAlert {
  id: string;
  valve_id: string;
  alert_type: 'low_battery' | 'communication_lost' | 'pressure_high' | 'pressure_low' | 'temperature_high' | 'manual_override' | 'command_failed' | 'maintenance_due';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  alert_data?: any;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ValveStatus {
  valve: Valve;
  meter?: {
    meter_id: string;
    last_credit: number;
    auto_valve_control: boolean;
  };
  recent_commands: ValveCommand[];
  active_alerts: ValveAlert[];
  health_status: string;
  last_updated: string;
}

export interface ValveStatistics {
  valve_statistics: {
    total_valves: number;
    active_valves: number;
    offline_valves: number;
    maintenance_valves: number;
    error_valves: number;
    open_valves: number;
    closed_valves: number;
    partial_valves: number;
    low_battery_valves: number;
    avg_battery_level?: number;
    avg_signal_strength?: number;
  };
  command_statistics: {
    total_commands: number;
    pending_commands: number;
    completed_commands: number;
    failed_commands: number;
    timeout_commands: number;
    emergency_commands: number;
    avg_completion_time_seconds?: number;
  };
  health_issues: {
    offline_valves: number;
    low_battery_valves: number;
    maintenance_due: number;
  };
  system_health: string;
  last_updated: string;
}

export interface ValveOverview {
  valves: Array<Valve & {
    meter_id: string;
    last_credit: number;
    auto_valve_control: boolean;
    low_credit_threshold: number;
    property_name: string;
    client_name: string;
    health_status: string;
    pending_commands: number;
    active_alerts: number;
  }>;
  statistics: ValveStatistics;
}

export interface CommandRequest {
  reason?: string;
  priority?: 'low' | 'normal' | 'high' | 'emergency';
  percentage?: number; // For partial open commands
}

export interface BulkOperationRequest {
  valve_ids: string[];
  operation: 'open' | 'close' | 'emergency_close' | 'status_check';
  reason: string;
  priority?: 'low' | 'normal' | 'high' | 'emergency';
}

export interface BulkOperationResult {
  operation: string;
  successful: any[];
  errors: Array<{
    valve_id: string;
    error: string;
  }>;
  total_processed: number;
  total_errors: number;
}

class ValveService {
  /**
   * Get all valves with pagination and filtering
   */
  async getValves(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    state?: string;
    meter_id?: string;
  }) {
    const response = await api.get('/valves', { params });
    return response.data;
  }

  /**
   * Get valve overview with health status
   */
  async getValveOverview(): Promise<ValveOverview> {
    const response = await api.get('/valves/overview');
    return response.data.data;
  }

  /**
   * Get specific valve details
   */
  async getValve(id: string): Promise<ValveStatus> {
    const response = await api.get(`/valves/${id}`);
    return response.data.data;
  }

  /**
   * Create a new valve
   */
  async createValve(valveData: Partial<Valve>) {
    const response = await api.post('/valves', valveData);
    return response.data;
  }

  /**
   * Update valve information
   */
  async updateValve(id: string, valveData: Partial<Valve>) {
    const response = await api.put(`/valves/${id}`, valveData);
    return response.data;
  }

  /**
   * Delete a valve
   */
  async deleteValve(id: string) {
    const response = await api.delete(`/valves/${id}`);
    return response.data;
  }

  /**
   * Open a valve
   */
  async openValve(id: string, request: CommandRequest = {}) {
    const response = await api.post(`/valves/${id}/open`, request);
    return response.data;
  }

  /**
   * Close a valve
   */
  async closeValve(id: string, request: CommandRequest = {}) {
    const response = await api.post(`/valves/${id}/close`, request);
    return response.data;
  }

  /**
   * Partially open a valve
   */
  async partialOpenValve(id: string, percentage: number, request: Omit<CommandRequest, 'percentage'> = {}) {
    const response = await api.post(`/valves/${id}/partial-open`, {
      ...request,
      percentage
    });
    return response.data;
  }

  /**
   * Emergency close a valve
   */
  async emergencyCloseValve(id: string, request: CommandRequest = {}) {
    const response = await api.post(`/valves/${id}/emergency-close`, request);
    return response.data;
  }

  /**
   * Check valve status
   */
  async checkValveStatus(id: string) {
    const response = await api.post(`/valves/${id}/status-check`);
    return response.data;
  }

  /**
   * Get valve command history
   */
  async getValveCommands(id: string, limit: number = 50): Promise<{
    valve_id: string;
    commands: ValveCommand[];
  }> {
    const response = await api.get(`/valves/${id}/commands`, {
      params: { limit }
    });
    return response.data.data;
  }

  /**
   * Get valve status history
   */
  async getValveHistory(id: string, limit: number = 50) {
    const response = await api.get(`/valves/${id}/history`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get valve alerts
   */
  async getValveAlerts(id: string): Promise<{
    valve_id: string;
    active_alerts: ValveAlert[];
  }> {
    const response = await api.get(`/valves/${id}/alerts`);
    return response.data.data;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string) {
    const response = await api.post(`/valves/alerts/${alertId}/acknowledge`);
    return response.data;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolutionNotes?: string) {
    const response = await api.post(`/valves/alerts/${alertId}/resolve`, {
      resolution_notes: resolutionNotes
    });
    return response.data;
  }

  /**
   * Enable manual override
   */
  async enableManualOverride(id: string, reason: string) {
    const response = await api.post(`/valves/${id}/enable-override`, { reason });
    return response.data;
  }

  /**
   * Disable manual override
   */
  async disableManualOverride(id: string) {
    const response = await api.post(`/valves/${id}/disable-override`);
    return response.data;
  }

  /**
   * Get system statistics
   */
  async getStatistics(): Promise<ValveStatistics> {
    const response = await api.get('/valves/statistics');
    return response.data.data;
  }

  /**
   * Get failed commands
   */
  async getFailedCommands(hours: number = 24) {
    const response = await api.get('/valves/failed-commands', {
      params: { hours }
    });
    return response.data;
  }

  /**
   * Perform bulk operations on multiple valves
   */
  async bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResult> {
    const response = await api.post('/valves/bulk-operation', request);
    return response.data.data;
  }

  /**
   * Get valves by meter ID
   */
  async getValvesByMeter(meterId: string): Promise<Valve[]> {
    const response = await api.get('/valves', {
      params: { meter_id: meterId }
    });
    return response.data.data.valves;
  }

  /**
   * Get valve health status color
   */
  getHealthStatusColor(healthStatus: string): string {
    switch (healthStatus) {
      case 'normal': return 'green';
      case 'low_battery': return 'orange';
      case 'weak_signal': return 'orange';
      case 'high_pressure': return 'orange';
      case 'communication_lost': return 'red';
      case 'offline': return 'red';
      case 'error': return 'red';
      case 'maintenance': return 'blue';
      default: return 'gray';
    }
  }

  /**
   * Get valve state icon
   */
  getStateIcon(state: string): string {
    switch (state) {
      case 'open': return '🟢';
      case 'closed': return '🔴';
      case 'partial': return '🟡';
      case 'unknown': return '⚪';
      default: return '❓';
    }
  }

  /**
   * Get command priority color
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'emergency': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'gray';
    }
  }

  /**
   * Format valve status for display
   */
  formatValveStatus(valve: Valve): {
    statusText: string;
    statusColor: string;
    stateText: string;
    stateIcon: string;
  } {
    return {
      statusText: valve.status.charAt(0).toUpperCase() + valve.status.slice(1),
      statusColor: this.getHealthStatusColor(valve.status),
      stateText: valve.current_state.charAt(0).toUpperCase() + valve.current_state.slice(1),
      stateIcon: this.getStateIcon(valve.current_state)
    };
  }
}

export const valveService = new ValveService();