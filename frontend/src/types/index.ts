// Centralized type definitions to avoid conflicts

// API Response types

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

// Query parameter types
export interface QueryParams {
  page?: number;
  per_page?: number;
  limit?: number; // Add limit for compatibility
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  status?: string;
  client_id?: string;
  customer_id?: string;
  meter_id?: string;
  date_from?: string;
  date_to?: string;
  [key: string]: unknown; // Allow additional query parameters
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  client_id: string;
  client_name: string;
  status: 'active' | 'inactive' | 'pending';
  balance?: number;
  created_at: string;
  updated_at?: string;
  meters_count?: number;
  properties_count?: number;
  total_consumption?: number;
  last_payment_date?: string;
  last_payment_amount?: number;
  profile_image?: string;
}

export interface Meter {
  id: string;
  meter_id: string;
  customer_name: string;
  customer_id: string;
  property_name?: string;
  property_id?: string;
  location?: string;
  address?: string;
  client_name: string;
  client_id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  credit_balance?: number;
  balance?: number;
  last_reading: number;
  last_reading_date: string;
  installation_date: string;
  firmware_version?: string;
  model?: string;
  valve_status?: 'open' | 'closed';
  battery_level?: number;
  signal_strength?: 'strong' | 'medium' | 'weak';
}

export interface Payment {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  meter_id?: string;
  amount: number;
  consumption: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'failed' | 'refunded';
  payment_date?: string;
  due_date: string;
  created_at: string;
  updated_at?: string;
  payment_method?: string;
  transaction_id?: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'client' | 'customer';
  client_id?: string;
  customer_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  client_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}