import { enhancedApi, ApiResponse, ApiError } from './enhancedApi';

export interface Meter {
  id: string;
  meter_number: string;
  customer_id: string;
  property_id: string;
  device_id: string;
  status: 'active' | 'inactive' | 'offline' | 'maintenance';
  credit_balance: number;
  last_reading: number;
  last_reading_date: string;
  installation_date: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  property?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_value: number;
  consumption: number;
  reading_date: string;
  created_at: string;
  updated_at: string;
}

export interface MeterCredit {
  id: string;
  meter_id: string;
  amount: number;
  type: 'topup' | 'usage' | 'adjustment';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MeterStatus {
  status: string;
  last_seen: string;
  signal_strength: number;
  battery_level?: number;
  valve_status?: 'open' | 'closed';
  firmware_version?: string;
}

export interface MeterStats {
  daily_consumption: number;
  weekly_consumption: number;
  monthly_consumption: number;
  average_daily_usage: number;
  peak_usage_time: string;
  efficiency_rating: number;
}

class EnhancedMeterService {
  private readonly baseUrl = '/meters';

  // Get all meters with enhanced error handling and loading states
  async getMeters(params: any = {}): Promise<ApiResponse<{ data: Meter[]; total: number }>> {
    return enhancedApi.get(`${this.baseUrl}`, {
      params,
      cacheKey: `meters_list_${JSON.stringify(params)}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Get customer's meters
  async getMyMeters(): Promise<ApiResponse<Meter[]>> {
    return enhancedApi.get(`${this.baseUrl}/my-meters`, {
      cacheKey: 'my_meters',
      retry: {
        retries: 3,
        retryDelay: 1500
      }
    });
  }

  // Get single meter with detailed error handling
  async getMeter(id: string): Promise<ApiResponse<Meter>> {
    if (!id) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.get(`${this.baseUrl}/${id}`, {
      cacheKey: `meter_${id}`,
      retry: {
        retries: 2,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Don't retry on 404 (meter not found)
          return error.response?.status !== 404;
        }
      }
    });
  }

  // Create new meter with validation
  async createMeter(meterData: Partial<Meter>): Promise<ApiResponse<Meter>> {
    // Validate required fields
    const requiredFields = ['meter_number', 'customer_id', 'property_id'];
    const missingFields = requiredFields.filter(field => !meterData[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}`, meterData, {
      cacheKey: 'create_meter',
      retry: {
        retries: 1,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on validation errors (422) or conflicts (409)
          return ![422, 409].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Update meter with optimistic updates
  async updateMeter(id: string, meterData: Partial<Meter>): Promise<ApiResponse<Meter>> {
    if (!id) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.put(`${this.baseUrl}/${id}`, meterData, {
      cacheKey: `update_meter_${id}`,
      retry: {
        retries: 1,
        retryDelay: 1500
      }
    });
  }

  // Delete meter with confirmation
  async deleteMeter(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.delete(`${this.baseUrl}/${id}`, {
      cacheKey: `delete_meter_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on 404 (already deleted) or 409 (conflict)
          return ![404, 409].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Top up meter credit with amount validation
  async topUpCredit(
    meterId: string, 
    amount: number, 
    description?: string
  ): Promise<ApiResponse<MeterCredit>> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    if (!amount || amount <= 0) {
      throw {
        message: 'Valid top-up amount is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'amount', value: amount }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${meterId}/topup`, {
      amount,
      description: description || 'Credit top-up'
    }, {
      cacheKey: `topup_${meterId}`,
      retry: {
        retries: 2,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on insufficient funds or validation errors
          return ![400, 422].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Control meter (turn on/off valve) with safety checks
  async controlMeter(meterId: string, action: 'open' | 'close'): Promise<ApiResponse<void>> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    if (!['open', 'close'].includes(action)) {
      throw {
        message: 'Invalid action. Must be "open" or "close"',
        code: 'VALIDATION_ERROR',
        details: { field: 'action', value: action }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${meterId}/control`, { action }, {
      cacheKey: `control_${meterId}_${action}`,
      retry: {
        retries: 1,
        retryDelay: 3000,
        retryCondition: (error) => {
          // Only retry on server errors, not client errors
          return (error.response?.status || 0) >= 500;
        }
      }
    });
  }

  // Get meter status with real-time updates
  async getMeterStatus(meterId: string): Promise<ApiResponse<MeterStatus>> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.get(`${this.baseUrl}/${meterId}/status`, {
      cacheKey: `meter_status_${meterId}`,
      retry: {
        retries: 3,
        retryDelay: 1000
      }
    });
  }
}

// Create and export service instance
const enhancedMeterService = new EnhancedMeterService();
export default enhancedMeterService;

// Export class for testing
export { EnhancedMeterService };