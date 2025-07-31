import api from './api';

// Tariff Management
export const getAllTariffs = (clientId: string) => {
  return api.get(`/api/tariffs/client/${clientId}`);
};

export const getTariff = (id: string) => {
  return api.get(`/api/tariffs/${id}`);
};

export const getCompleteTariff = (id: string) => {
  return api.get(`/api/tariffs/${id}/complete`);
};

export const createTariff = (data: any) => {
  return api.post('/api/tariffs', data);
};

export const updateTariff = (id: string, data: any) => {
  return api.put(`/api/tariffs/${id}`, data);
};

export const deleteTariff = (id: string) => {
  return api.delete(`/api/tariffs/${id}`);
};

export const calculatePrice = (id: string, data: any) => {
  return api.post(`/api/tariffs/${id}/calculate-price`, data);
};

// Seasonal Rates
export const getSeasonalRates = (tariffId: string) => {
  return api.get(`/api/tariffs/${tariffId}/seasonal-rates`);
};

export const createSeasonalRate = (tariffId: string, data: any) => {
  return api.post(`/api/tariffs/${tariffId}/seasonal-rates`, data);
};

export const updateSeasonalRate = (id: string, data: any) => {
  return api.put(`/api/tariffs/seasonal-rates/${id}`, data);
};

export const deleteSeasonalRate = (id: string) => {
  return api.delete(`/api/tariffs/seasonal-rates/${id}`);
};

// Bulk Discount Tiers
export const getBulkDiscountTiers = (tariffId: string) => {
  return api.get(`/api/tariffs/${tariffId}/bulk-discounts`);
};

export const createBulkDiscountTier = (tariffId: string, data: any) => {
  return api.post(`/api/tariffs/${tariffId}/bulk-discounts`, data);
};

export const updateBulkDiscountTier = (id: string, data: any) => {
  return api.put(`/api/tariffs/bulk-discounts/${id}`, data);
};

export const deleteBulkDiscountTier = (id: string) => {
  return api.delete(`/api/tariffs/bulk-discounts/${id}`);
};

// Dynamic Discount Rules
export const getDynamicDiscountRules = (tariffId: string) => {
  return api.get(`/api/tariffs/${tariffId}/dynamic-discounts`);
};

export const createDynamicDiscountRule = (tariffId: string, data: any) => {
  return api.post(`/api/tariffs/${tariffId}/dynamic-discounts`, data);
};

export const updateDynamicDiscountRule = (id: string, data: any) => {
  return api.put(`/api/tariffs/dynamic-discounts/${id}`, data);
};

export const deleteDynamicDiscountRule = (id: string) => {
  return api.delete(`/api/tariffs/dynamic-discounts/${id}`);
};

// Property Tariff Assignment
export const getPropertyTariffs = (propertyId: string) => {
  return api.get(`/api/property-tariffs/property/${propertyId}`);
};

export const getCurrentPropertyTariff = (propertyId: string) => {
  return api.get(`/api/property-tariffs/property/${propertyId}/current`);
};

export const assignTariffToProperty = (propertyId: string, data: any) => {
  return api.post(`/api/property-tariffs/property/${propertyId}`, data);
};

export const updatePropertyTariff = (id: string, data: any) => {
  return api.put(`/api/property-tariffs/${id}`, data);
};

export const deletePropertyTariff = (id: string) => {
  return api.delete(`/api/property-tariffs/${id}`);
};

// Applied Discounts
export const getCustomerDiscounts = (customerId: string) => {
  return api.get(`/api/discounts/customer/${customerId}`);
};

export const getCustomerDiscountStats = (customerId: string) => {
  return api.get(`/api/discounts/customer/${customerId}/stats`);
};