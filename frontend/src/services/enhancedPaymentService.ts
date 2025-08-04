import { enhancedApi, ApiResponse, ApiError } from './enhancedApi';

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

export interface PaymentStats {
  total_amount: number;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  average_amount: number;
  top_payment_methods: Array<{ method: string; count: number; amount: number }>;
}

class EnhancedPaymentService {
  private readonly baseUrl = '/payments';

  // Get all payments with enhanced filtering and pagination
  async getPayments(params: any = {}): Promise<ApiResponse<{ data: Payment[]; total: number }>> {
    return enhancedApi.get(`${this.baseUrl}`, {
      params,
      cacheKey: `payments_list_${JSON.stringify(params)}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Get customer's payments
  async getMyPayments(params: any = {}): Promise<ApiResponse<Payment[]>> {
    return enhancedApi.get(`${this.baseUrl}/my-payments`, {
      params,
      cacheKey: `my_payments_${JSON.stringify(params)}`,
      retry: {
        retries: 3,
        retryDelay: 1500
      }
    });
  }

  // Get single payment with detailed information
  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.get(`${this.baseUrl}/${id}`, {
      cacheKey: `payment_${id}`,
      retry: {
        retries: 2,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Don't retry on 404 (payment not found)
          return error.response?.status !== 404;
        }
      }
    });
  }

  // Create new payment with comprehensive validation
  async createPayment(paymentData: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    // Validate required fields
    const requiredFields = ['amount', 'type', 'payment_method', 'description'];
    const missingFields = requiredFields.filter(field => !(paymentData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    // Validate amount
    if (paymentData.amount <= 0) {
      throw {
        message: 'Payment amount must be greater than 0',
        code: 'VALIDATION_ERROR',
        details: { field: 'amount', value: paymentData.amount }
      } as ApiError;
    }

    // Validate payment method
    const validMethods = ['credit_card', 'bank_transfer', 'e_wallet'];
    if (!validMethods.includes(paymentData.payment_method)) {
      throw {
        message: 'Invalid payment method',
        code: 'VALIDATION_ERROR',
        details: { field: 'payment_method', value: paymentData.payment_method, validValues: validMethods }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}`, paymentData, {
      cacheKey: 'create_payment',
      retry: {
        retries: 2,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on validation errors (422) or conflicts (409)
          return ![422, 409].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Update payment status (admin only)
  async updatePaymentStatus(
    id: string, 
    status: Payment['status'], 
    notes?: string
  ): Promise<ApiResponse<Payment>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw {
        message: 'Invalid payment status',
        code: 'VALIDATION_ERROR',
        details: { field: 'status', value: status, validValues: validStatuses }
      } as ApiError;
    }

    return enhancedApi.put(`${this.baseUrl}/${id}/status`, { status, notes }, {
      cacheKey: `update_payment_status_${id}`,
      retry: {
        retries: 1,
        retryDelay: 1500
      }
    });
  }

  // Cancel payment with reason
  async cancelPayment(id: string, reason?: string): Promise<ApiResponse<Payment>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${id}/cancel`, { reason }, {
      cacheKey: `cancel_payment_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Don't retry on 404 or 409 (already cancelled)
          return ![404, 409].includes(error.response?.status || 0);
        }
      }
    });
  }

  // Check payment status with polling capability
  async checkPaymentStatus(id: string): Promise<ApiResponse<{ status: string; gateway_status?: string }>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.get(`${this.baseUrl}/${id}/status`, {
      cacheKey: `payment_status_${id}`,
      retry: {
        retries: 3,
        retryDelay: 1000
      }
    });
  }

  // Poll payment status until completion or timeout
  async pollPaymentStatus(
    id: string, 
    options: { 
      maxAttempts?: number; 
      interval?: number; 
      onUpdate?: (status: string) => void 
    } = {}
  ): Promise<ApiResponse<{ status: string; gateway_status?: string }>> {
    const { maxAttempts = 30, interval = 2000, onUpdate } = options;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.checkPaymentStatus(id);
        const status = response.data.status;
        
        if (onUpdate) {
          onUpdate(status);
        }

        // Stop polling if payment is completed, failed, or cancelled
        if (['completed', 'failed', 'cancelled'].includes(status)) {
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
      message: 'Payment status polling timeout',
      code: 'TIMEOUT_ERROR',
      details: { paymentId: id, maxAttempts }
    } as ApiError;
  }

  // Process webhook (internal use)
  async processWebhook(gateway: string, payload: any): Promise<ApiResponse<void>> {
    if (!gateway) {
      throw {
        message: 'Gateway is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/webhook/${gateway}`, payload, {
      skipErrorHandling: true, // Let webhook handler manage errors
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Get payment methods
  async getPaymentMethods(): Promise<ApiResponse<{ method: string; name: string; enabled: boolean }[]>> {
    return enhancedApi.get(`${this.baseUrl}/methods`, {
      cacheKey: 'payment_methods',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Get payment statistics
  async getPaymentStats(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<PaymentStats>> {
    return enhancedApi.get(`${this.baseUrl}/stats`, {
      params: { period },
      cacheKey: `payment_stats_${period}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Retry failed payment
  async retryPayment(id: string): Promise<ApiResponse<PaymentResponse>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${id}/retry`, {}, {
      cacheKey: `retry_payment_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  // Get payment receipt
  async getPaymentReceipt(id: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    const response = await enhancedApi.request({
      method: 'GET',
      url: `${this.baseUrl}/${id}/receipt`,
      params: { format },
      responseType: 'blob',
      cacheKey: `payment_receipt_${id}_${format}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });

    return response.data as Blob;
  }

  // Bulk operations
  async bulkUpdatePayments(
    paymentIds: string[], 
    updateData: { status?: Payment['status']; notes?: string }
  ): Promise<ApiResponse<{ updated: number; failed: number; errors: any[] }>> {
    if (!paymentIds || paymentIds.length === 0) {
      throw {
        message: 'At least one payment ID is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'paymentIds' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/bulk-update`, 
      { payment_ids: paymentIds, ...updateData }, 
      {
        cacheKey: `bulk_update_${paymentIds.length}_payments`,
        timeout: 60000,
        retry: {
          retries: 1,
          retryDelay: 3000
        }
      }
    );
  }

  // Export payments
  async exportPayments(
    params: any = {}, 
    format: 'csv' | 'excel' | 'pdf' = 'csv'
  ): Promise<Blob> {
    const response = await enhancedApi.request({
      method: 'GET',
      url: `${this.baseUrl}/export`,
      params: { ...params, format },
      responseType: 'blob',
      timeout: 60000,
      cacheKey: `export_payments_${format}`,
      retry: {
        retries: 1,
        retryDelay: 3000
      }
    });

    return response.data as Blob;
  }

  // Customer-specific methods
  async createTopUpPayment(
    meterId: string, 
    amount: number, 
    paymentMethod: string
  ): Promise<ApiResponse<PaymentResponse>> {
    if (!meterId) {
      throw {
        message: 'Meter ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return this.createPayment({
      meter_id: meterId,
      amount,
      type: 'topup',
      payment_method: paymentMethod as any,
      description: `Credit top-up for meter ${meterId}`
    });
  }

  async getTopUpHistory(meterId?: string): Promise<ApiResponse<Payment[]>> {
    const params = meterId ? { meter_id: meterId, type: 'topup' } : { type: 'topup' };
    return this.getMyPayments(params);
  }

  // Payment verification and reconciliation
  async verifyPayment(id: string): Promise<ApiResponse<{ verified: boolean; discrepancies: any[] }>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${id}/verify`, {}, {
      cacheKey: `verify_payment_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  // Payment refund
  async refundPayment(
    id: string, 
    refundData: { 
      amount?: number; 
      reason: string; 
      refund_method?: string 
    }
  ): Promise<ApiResponse<{ refund_id: string; status: string }>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    if (!refundData.reason) {
      throw {
        message: 'Refund reason is required',
        code: 'VALIDATION_ERROR',
        details: { field: 'reason' }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${id}/refund`, refundData, {
      cacheKey: `refund_payment_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  // Payment disputes
  async createDispute(
    id: string, 
    disputeData: { 
      reason: string; 
      description: string; 
      evidence?: string[] 
    }
  ): Promise<ApiResponse<{ dispute_id: string }>> {
    if (!id) {
      throw {
        message: 'Payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    const requiredFields = ['reason', 'description'];
    const missingFields = requiredFields.filter(field => !(disputeData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/${id}/dispute`, disputeData, {
      cacheKey: `create_dispute_${id}`,
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  // Payment notifications
  async getPaymentNotifications(paymentId?: string): Promise<ApiResponse<any[]>> {
    const url = paymentId ? `${this.baseUrl}/${paymentId}/notifications` : `${this.baseUrl}/notifications`;
    
    return enhancedApi.get(url, {
      cacheKey: `payment_notifications_${paymentId || 'all'}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Payment analytics
  async getPaymentAnalytics(
    filters: {
      date_from?: string;
      date_to?: string;
      customer_id?: string;
      meter_id?: string;
      payment_method?: string;
      status?: string;
    } = {}
  ): Promise<ApiResponse<{
    summary: PaymentStats;
    trends: any[];
    breakdown: any;
  }>> {
    return enhancedApi.get(`${this.baseUrl}/analytics`, {
      params: filters,
      cacheKey: `payment_analytics_${JSON.stringify(filters)}`,
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  // Recurring payments
  async createRecurringPayment(
    paymentData: PaymentRequest & {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      start_date: string;
      end_date?: string;
      max_occurrences?: number;
    }
  ): Promise<ApiResponse<{ recurring_payment_id: string }>> {
    const requiredFields = ['amount', 'type', 'payment_method', 'frequency', 'start_date'];
    const missingFields = requiredFields.filter(field => !(paymentData as any)[field]);
    
    if (missingFields.length > 0) {
      throw {
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR',
        details: { missingFields }
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/recurring`, paymentData, {
      cacheKey: 'create_recurring_payment',
      retry: {
        retries: 1,
        retryDelay: 2000
      }
    });
  }

  async getRecurringPayments(): Promise<ApiResponse<any[]>> {
    return enhancedApi.get(`${this.baseUrl}/recurring`, {
      cacheKey: 'recurring_payments',
      retry: {
        retries: 2,
        retryDelay: 1000
      }
    });
  }

  async cancelRecurringPayment(id: string, reason?: string): Promise<ApiResponse<void>> {
    if (!id) {
      throw {
        message: 'Recurring payment ID is required',
        code: 'VALIDATION_ERROR'
      } as ApiError;
    }

    return enhancedApi.post(`${this.baseUrl}/recurring/${id}/cancel`, { reason }, {
      cacheKey: `cancel_recurring_${id}`,
      retry: {
        retries: 1,
        retryDelay: 1000
      }
    });
  }
}

// Create and export service instance
const enhancedPaymentService = new EnhancedPaymentService();
export default enhancedPaymentService;

// Export class for testing
export { EnhancedPaymentService };