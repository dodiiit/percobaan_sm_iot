import api from './api';

// Service Fee Plans
export const getServiceFeePlans = () => {
  return api.get('/api/service-fees/plans');
};

export const getServiceFeePlan = (id: string) => {
  return api.get(`/api/service-fees/plans/${id}`);
};

export const getServiceFeePlanWithComponents = (id: string) => {
  return api.get(`/api/service-fees/plans/${id}/complete`);
};

export const createServiceFeePlan = (data: any) => {
  return api.post('/api/service-fees/plans', data);
};

export const updateServiceFeePlan = (id: string, data: any) => {
  return api.put(`/api/service-fees/plans/${id}`, data);
};

export const deleteServiceFeePlan = (id: string) => {
  return api.delete(`/api/service-fees/plans/${id}`);
};

// Service Fee Components
export const getServiceFeeComponents = (planId: string) => {
  return api.get(`/api/service-fees/plans/${planId}/components`);
};

export const createServiceFeeComponent = (planId: string, data: any) => {
  return api.post(`/api/service-fees/plans/${planId}/components`, data);
};

export const updateServiceFeeComponent = (id: string, data: any) => {
  return api.put(`/api/service-fees/components/${id}`, data);
};

export const deleteServiceFeeComponent = (id: string) => {
  return api.delete(`/api/service-fees/components/${id}`);
};

// Client Plan Assignment
export const getClientServiceFeePlan = (clientId: string) => {
  return api.get(`/api/service-fees/client/${clientId}/plan`);
};

export const assignServiceFeePlanToClient = (clientId: string, data: any) => {
  return api.post(`/api/service-fees/client/${clientId}/plan`, data);
};

export const getClientServiceFeePlanAssignments = (clientId: string) => {
  return api.get(`/api/service-fees/client/${clientId}/plan-assignments`);
};

// Service Fee Transactions
export const getClientServiceFeeTransactions = (clientId: string, params?: any) => {
  return api.get(`/api/service-fees/client/${clientId}/transactions`, { params });
};

// Service Fee Invoices
export const getClientServiceFeeInvoices = (clientId: string, params?: any) => {
  return api.get(`/api/service-fees/client/${clientId}/invoices`, { params });
};

export const getServiceFeeInvoice = (id: string) => {
  return api.get(`/api/service-fees/invoices/${id}`);
};

export const generateMonthlyServiceFeeInvoice = (clientId: string, data: any) => {
  return api.post(`/api/service-fees/client/${clientId}/invoices/monthly`, data);
};

export const generateCustomServiceFeeInvoice = (clientId: string, data: any) => {
  return api.post(`/api/service-fees/client/${clientId}/invoices/custom`, data);
};

export const issueServiceFeeInvoice = (id: string) => {
  return api.put(`/api/service-fees/invoices/${id}/issue`);
};

export const markServiceFeeInvoiceAsPaid = (id: string, data?: any) => {
  return api.put(`/api/service-fees/invoices/${id}/mark-paid`, data);
};

export const cancelServiceFeeInvoice = (id: string) => {
  return api.put(`/api/service-fees/invoices/${id}/cancel`);
};

// Service Fee Reports
export const getClientServiceFeeReport = (clientId: string, params: any) => {
  return api.get(`/api/service-fees/client/${clientId}/report`, { params });
};

export const getServiceFeeAccrualReport = (params: any) => {
  return api.get('/api/service-fees/reports/accrual', { params });
};