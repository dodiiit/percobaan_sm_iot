import api from './api';

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

class MeterService {
  // Get all meters (admin/client)
  async getMeters(params?: any): Promise<{ data: Meter[]; total: number }> {
    const response = await api.get('/meters', { params });
    return response.data;
  }

  // Get customer's meters
  async getMyMeters(): Promise<Meter[]> {
    const response = await api.get('/meters/my-meters');
    return response.data.data;
  }

  // Get single meter
  async getMeter(id: string): Promise<Meter> {
    const response = await api.get(`/meters/${id}`);
    return response.data.data;
  }

  // Create new meter
  async createMeter(meterData: Partial<Meter>): Promise<Meter> {
    const response = await api.post('/meters', meterData);
    return response.data.data;
  }

  // Update meter
  async updateMeter(id: string, meterData: Partial<Meter>): Promise<Meter> {
    const response = await api.put(`/meters/${id}`, meterData);
    return response.data.data;
  }

  // Delete meter
  async deleteMeter(id: string): Promise<void> {
    await api.delete(`/meters/${id}`);
  }

  // Get meter readings
  async getMeterReadings(meterId: string, params?: any): Promise<{ data: MeterReading[]; total: number }> {
    const response = await api.get(`/meters/${meterId}/readings`, { params });
    return response.data;
  }

  // Get customer's readings
  async getMyReadings(params?: any): Promise<MeterReading[]> {
    const response = await api.get('/meters/my-readings', { params });
    return response.data.data;
  }

  // Add meter reading
  async addReading(meterId: string, readingData: { reading_value: number; reading_date?: string }): Promise<MeterReading> {
    const response = await api.post(`/meters/${meterId}/readings`, readingData);
    return response.data.data;
  }

  // Get meter credit history
  async getMeterCredits(meterId: string, params?: any): Promise<{ data: MeterCredit[]; total: number }> {
    const response = await api.get(`/meters/${meterId}/credits`, { params });
    return response.data;
  }

  // Top up meter credit
  async topUpCredit(meterId: string, amount: number, description?: string): Promise<MeterCredit> {
    const response = await api.post(`/meters/${meterId}/topup`, {
      amount,
      description: description || 'Credit top-up'
    });
    return response.data.data;
  }

  // Control meter (turn on/off valve)
  async controlMeter(meterId: string, action: 'open' | 'close'): Promise<void> {
    await api.post(`/meters/${meterId}/control`, { action });
  }

  // Get meter status
  async getMeterStatus(meterId: string): Promise<{ status: string; last_seen: string; signal_strength: number }> {
    const response = await api.get(`/meters/${meterId}/status`);
    return response.data.data;
  }

  // Update meter firmware
  async updateFirmware(meterId: string, firmwareVersion: string): Promise<void> {
    await api.post(`/meters/${meterId}/firmware-update`, { version: firmwareVersion });
  }

  // Get meter statistics
  async getMeterStats(meterId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const response = await api.get(`/meters/${meterId}/stats`, { params: { period } });
    return response.data.data;
  }

  // Bulk operations
  async bulkUpdateMeters(meterIds: string[], updateData: Partial<Meter>): Promise<void> {
    await api.post('/meters/bulk-update', { meter_ids: meterIds, ...updateData });
  }

  async bulkDeleteMeters(meterIds: string[]): Promise<void> {
    await api.post('/meters/bulk-delete', { meter_ids: meterIds });
  }
}

export default new MeterService();