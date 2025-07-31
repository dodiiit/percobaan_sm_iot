import api from './api';

export interface Payment {
  id: string;
  customer_id: string;
  meter_id?: string;
  amount: number;
  type: 'topup' | 'bill' | 'service_fee';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'credit_card' | 'bank_transfer' | 'e_wallet' | 'cash';
  payment_gateway: 'midtrans' | 'doku' | 'manual';
  transaction_id?: string;
  gateway_transaction_id?: string;
  description: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  meter?: {
    id: string;
    meter_number: string;
  };
}

export interface PaymentRequest {
  customer_id?: string;
  meter_id?: string;
  amount: number;
  type: 'topup' | 'bill' | 'service_fee';
  payment_method: 'credit_card' | 'bank_transfer' | 'e_wallet';
  description: string;
}

export interface PaymentResponse {
  payment: Payment;
  payment_url?: string;
  redirect_url?: string;
  qr_code?: string;
}

class PaymentService {
  // Get all payments (admin/client)
  async getPayments(params?: any): Promise<{ data: Payment[]; total: number }> {
    const response = await api.get('/payments', { params });
    return response.data;
  }

  // Get customer's payments
  async getMyPayments(params?: any): Promise<Payment[]> {
    const response = await api.get('/payments/my-payments', { params });
    return response.data.data;
  }

  // Get single payment
  async getPayment(id: string): Promise<Payment> {
    const response = await api.get(`/payments/${id}`);
    return response.data.data;
  }

  // Create new payment
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const response = await api.post('/payments', paymentData);
    return response.data.data;
  }

  // Update payment status (admin only)
  async updatePaymentStatus(id: string, status: Payment['status'], notes?: string): Promise<Payment> {
    const response = await api.put(`/payments/${id}/status`, { status, notes });
    return response.data.data;
  }

  // Cancel payment
  async cancelPayment(id: string, reason?: string): Promise<Payment> {
    const response = await api.post(`/payments/${id}/cancel`, { reason });
    return response.data.data;
  }

  // Check payment status
  async checkPaymentStatus(id: string): Promise<{ status: string; gateway_status?: string }> {
    const response = await api.get(`/payments/${id}/status`);
    return response.data.data;
  }

  // Process webhook (internal use)
  async processWebhook(gateway: string, payload: any): Promise<void> {
    await api.post(`/payments/webhook/${gateway}`, payload);
  }

  // Get payment methods
  async getPaymentMethods(): Promise<{ method: string; name: string; enabled: boolean }[]> {
    const response = await api.get('/payments/methods');
    return response.data.data;
  }

  // Get payment statistics
  async getPaymentStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    const response = await api.get('/payments/stats', { params: { period } });
    return response.data.data;
  }

  // Retry failed payment
  async retryPayment(id: string): Promise<PaymentResponse> {
    const response = await api.post(`/payments/${id}/retry`);
    return response.data.data;
  }

  // Get payment receipt
  async getPaymentReceipt(id: string): Promise<Blob> {
    const response = await api.get(`/payments/${id}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Bulk operations
  async bulkUpdatePayments(paymentIds: string[], updateData: { status?: Payment['status']; notes?: string }): Promise<void> {
    await api.post('/payments/bulk-update', { payment_ids: paymentIds, ...updateData });
  }

  // Export payments
  async exportPayments(params?: any): Promise<Blob> {
    const response = await api.get('/payments/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  // Customer-specific methods
  async createTopUpPayment(meterId: string, amount: number, paymentMethod: string): Promise<PaymentResponse> {
    return this.createPayment({
      meter_id: meterId,
      amount,
      type: 'topup',
      payment_method: paymentMethod as any,
      description: `Credit top-up for meter ${meterId}`
    });
  }

  async getTopUpHistory(meterId?: string): Promise<Payment[]> {
    const params = meterId ? { meter_id: meterId, type: 'topup' } : { type: 'topup' };
    const response = await this.getMyPayments(params);
    return response;
  }
}

export default new PaymentService();