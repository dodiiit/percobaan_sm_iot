import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import enhanced services without errors', async () => {
    const { default: enhancedMeterService } = await import('../../services/enhancedMeterService');
    const { default: enhancedPaymentService } = await import('../../services/enhancedPaymentService');
    const { default: enhancedAuthService } = await import('../../services/enhancedAuthService');
    const { default: enhancedRealtimeService } = await import('../../services/enhancedRealtimeService');
    const { default: errorHandler } = await import('../../services/errorHandler');
    const { enhancedApi } = await import('../../services/enhancedApi');

    expect(enhancedMeterService).toBeDefined();
    expect(enhancedPaymentService).toBeDefined();
    expect(enhancedAuthService).toBeDefined();
    expect(enhancedRealtimeService).toBeDefined();
    expect(errorHandler).toBeDefined();
    expect(enhancedApi).toBeDefined();
  });

  it('should import React hooks without errors', async () => {
    const { useApiState, usePaginatedApiState, usePollingApiState } = await import('../../hooks/useApiState');

    expect(useApiState).toBeDefined();
    expect(usePaginatedApiState).toBeDefined();
    expect(usePollingApiState).toBeDefined();
  });

  it('should validate service method signatures', async () => {
    const { default: enhancedMeterService } = await import('../../services/enhancedMeterService');

    // Check that key methods exist
    expect(typeof enhancedMeterService.getMeters).toBe('function');
    expect(typeof enhancedMeterService.getMeter).toBe('function');
    expect(typeof enhancedMeterService.createMeter).toBe('function');
    expect(typeof enhancedMeterService.updateMeter).toBe('function');
    expect(typeof enhancedMeterService.deleteMeter).toBe('function');
    expect(typeof enhancedMeterService.topUpCredit).toBe('function');
    expect(typeof enhancedMeterService.controlMeter).toBe('function');
  });

  it('should validate error handler functionality', async () => {
    const { default: errorHandler } = await import('../../services/errorHandler');

    // Check that key methods exist
    expect(typeof errorHandler.handleError).toBe('function');
    expect(typeof errorHandler.processError).toBe('function');
    expect(typeof errorHandler.getErrorStats).toBe('function');
    expect(typeof errorHandler.clearErrorLog).toBe('function');
  });

  it('should validate API integration exports', async () => {
    const apiIntegration = await import('../../services/apiIntegration');

    expect(apiIntegration.default).toBeDefined();
    expect(apiIntegration.enhancedApi).toBeDefined();
    expect(apiIntegration.enhancedAuthService).toBeDefined();
    expect(apiIntegration.enhancedMeterService).toBeDefined();
    expect(apiIntegration.enhancedPaymentService).toBeDefined();
    expect(apiIntegration.enhancedRealtimeService).toBeDefined();
    expect(apiIntegration.errorHandler).toBeDefined();
    expect(apiIntegration.loadingStateManager).toBeDefined();
  });
});