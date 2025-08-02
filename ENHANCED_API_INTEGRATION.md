# Enhanced API Integration Documentation

## Overview

This document describes the enhanced API integration system that provides comprehensive error handling, loading state management, retry mechanisms, and real-time capabilities for the IoT Smart Meter application.

## Features

### 1. Enhanced Error Handling
- **Comprehensive Error Categorization**: Errors are automatically categorized by type (network, authentication, validation, etc.)
- **Severity Assessment**: Each error is assigned a severity level (low, medium, high, critical)
- **User-Friendly Messages**: Technical errors are converted to user-friendly messages
- **Contextual Suggestions**: Provides actionable suggestions for error resolution
- **Error Logging and Reporting**: Automatic error logging with optional server-side reporting

### 2. Advanced Loading State Management
- **Global Loading States**: Centralized loading state management across the application
- **Component-Level States**: Individual loading states for specific components
- **Real-time Updates**: Loading states update in real-time across all subscribers
- **Cache Integration**: Loading states integrate with caching mechanisms

### 3. Intelligent Retry Mechanisms
- **Configurable Retry Logic**: Customizable retry attempts, delays, and conditions
- **Exponential Backoff**: Automatic exponential backoff for failed requests
- **Conditional Retries**: Smart retry logic based on error types
- **Retry Callbacks**: Optional callbacks for retry events

### 4. Real-time Data Management
- **Polling-based Updates**: Efficient polling for real-time data
- **Subscription Management**: Easy subscription and unsubscription to real-time updates
- **Connection Health Monitoring**: Automatic connection health checks
- **Graceful Reconnection**: Automatic reconnection with configurable attempts

## Architecture

### Core Components

#### 1. EnhancedApi (`enhancedApi.ts`)
The main API client with enhanced capabilities:

```typescript
import { enhancedApi } from './services/enhancedApi';

// Basic usage
const response = await enhancedApi.get('/meters');

// With retry configuration
const response = await enhancedApi.get('/meters', {
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => error.response?.status >= 500
  }
});

// With loading state management
const response = await enhancedApi.get('/meters', {
  cacheKey: 'meters_list'
});
```

#### 2. Service Classes
Enhanced service classes for different API endpoints:

- **EnhancedMeterService**: Meter management with validation and error handling
- **EnhancedPaymentService**: Payment processing with comprehensive validation
- **EnhancedAuthService**: Authentication with security features
- **EnhancedRealtimeService**: Real-time data management

#### 3. Error Handler (`errorHandler.ts`)
Centralized error processing and handling:

```typescript
import { handleApiError } from './services/errorHandler';

try {
  await apiCall();
} catch (error) {
  const processedError = handleApiError(error, {
    showToast: true,
    logError: true,
    redirectOnAuth: true
  }, {
    component: 'MyComponent',
    action: 'fetchData'
  });
}
```

#### 4. React Hooks
Custom hooks for API state management:

```typescript
import { useApiState, usePaginatedApiState, usePollingApiState } from './hooks/useApiState';

// Basic API state
const { data, loading, error, execute } = useApiState(
  () => meterService.getMeters(),
  { immediate: true }
);

// Paginated data
const { data, pagination, loadMore } = usePaginatedApiState(
  (page, limit) => meterService.getMeters({ page, limit })
);

// Polling data
const { data, isPolling, startPolling, stopPolling } = usePollingApiState(
  () => meterService.getMeterStatus(meterId),
  { interval: 5000, enabled: true }
);
```

## Usage Examples

### 1. Basic API Call with Error Handling

```typescript
import enhancedMeterService from './services/enhancedMeterService';
import { handleApiError } from './services/errorHandler';

const fetchMeterData = async (meterId: string) => {
  try {
    const response = await enhancedMeterService.getMeter(meterId);
    return response.data;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logError: true
    }, {
      component: 'MeterComponent',
      action: 'fetchMeter'
    });
    throw error;
  }
};
```

### 2. React Component with Enhanced API Integration

```typescript
import React from 'react';
import { useApiState } from '../hooks/useApiState';
import enhancedMeterService from '../services/enhancedMeterService';

const MeterList: React.FC = () => {
  const {
    data: meters,
    loading,
    error,
    retry
  } = useApiState(
    () => enhancedMeterService.getMeters(),
    {
      immediate: true,
      errorConfig: {
        showToast: true,
        logError: true
      }
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div>
      Error: {error.message}
      <button onClick={retry}>Retry</button>
    </div>
  );

  return (
    <div>
      {meters?.map(meter => (
        <div key={meter.id}>{meter.meter_number}</div>
      ))}
    </div>
  );
};
```

### 3. Real-time Data Subscription

```typescript
import enhancedRealtimeService from './services/enhancedRealtimeService';

const subscribeToMeterUpdates = async (meterId: string) => {
  const subscriptionId = await enhancedRealtimeService.subscribeMeterUpdates(
    meterId,
    (data) => {
      console.log('Meter update:', data);
      // Update UI with real-time data
    },
    (error) => {
      console.error('Real-time error:', error);
      // Handle real-time errors
    }
  );

  // Cleanup
  return () => enhancedRealtimeService.unsubscribe(subscriptionId);
};
```

### 4. Batch Operations with Progress Tracking

```typescript
import enhancedMeterService from './services/enhancedMeterService';

const bulkUpdateMeters = async (meterIds: string[], updateData: any) => {
  try {
    const response = await enhancedMeterService.bulkUpdateMeters(meterIds, updateData);
    
    console.log(`Updated ${response.data.updated} meters`);
    if (response.data.failed > 0) {
      console.warn(`Failed to update ${response.data.failed} meters:`, response.data.errors);
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logError: true
    });
    throw error;
  }
};
```

## Configuration

### API Integration Configuration

```typescript
import apiIntegration from './services/apiIntegration';

// Update configuration
apiIntegration.updateConfig({
  baseURL: '/api/v2',
  timeout: 45000,
  retryConfig: {
    retries: 5,
    retryDelay: 2000
  },
  enableRealtime: true,
  enableCaching: true,
  enableErrorReporting: true
});
```

### Retry Configuration

```typescript
const retryConfig = {
  retries: 3,                    // Number of retry attempts
  retryDelay: 1000,             // Initial delay between retries (ms)
  retryCondition: (error) => {   // Custom retry condition
    return error.response?.status >= 500;
  },
  onRetry: (retryCount, error) => { // Retry callback
    console.log(`Retry ${retryCount}:`, error.message);
  }
};
```

### Error Handler Configuration

```typescript
const errorConfig = {
  showToast: true,              // Show toast notifications
  logError: true,               // Log errors to console
  redirectOnAuth: true,         // Redirect on auth errors
  customHandler: (error) => {   // Custom error handler
    // Custom error handling logic
  }
};
```

## Testing

### Running Tests

```bash
# Run all API integration tests
npm test -- --testPathPattern="services|hooks"

# Run specific test suites
npm test enhancedApi.test.ts
npm test enhancedMeterService.test.ts
npm test errorHandler.test.ts
npm test useApiState.test.ts
```

### Test Coverage

The enhanced API integration includes comprehensive tests for:

- ✅ API request/response handling
- ✅ Error categorization and processing
- ✅ Retry mechanisms and conditions
- ✅ Loading state management
- ✅ React hooks functionality
- ✅ Service method validation
- ✅ Real-time subscription management

## Monitoring and Diagnostics

### System Health Monitoring

```typescript
import apiIntegration from './services/apiIntegration';

// Get system health
const health = apiIntegration.getSystemHealth();
console.log('System health:', health);

// Perform full health check
const healthCheck = await apiIntegration.performFullHealthCheck();
console.log('Health check results:', healthCheck);
```

### API Metrics

```typescript
// Get API metrics
const metrics = apiIntegration.getMetrics();
console.log('API metrics:', {
  totalRequests: metrics.totalRequests,
  errorRate: metrics.errorRate,
  averageResponseTime: metrics.averageResponseTime
});
```

### Error Statistics

```typescript
import errorHandler from './services/errorHandler';

// Get error statistics
const errorStats = errorHandler.getErrorStats();
console.log('Error statistics:', errorStats);

// Get errors by category
const networkErrors = errorHandler.getErrorsByCategory(ErrorCategory.NETWORK);
const authErrors = errorHandler.getErrorsByCategory(ErrorCategory.AUTHENTICATION);
```

### Export Diagnostics

```typescript
// Export complete system diagnostics
const diagnostics = apiIntegration.exportDiagnostics();

// Save to file or send to support
console.log('System diagnostics:', diagnostics);
```

## Best Practices

### 1. Error Handling
- Always use the enhanced services instead of direct API calls
- Provide meaningful error contexts for better debugging
- Use appropriate error configurations for different scenarios
- Handle errors gracefully with user-friendly messages

### 2. Loading States
- Use loading states to provide user feedback
- Implement skeleton loading for better UX
- Handle loading states consistently across components
- Avoid blocking UI during background operations

### 3. Retry Logic
- Configure retries based on operation criticality
- Use exponential backoff for server errors
- Don't retry on client errors (4xx status codes)
- Implement circuit breaker patterns for critical failures

### 4. Real-time Data
- Subscribe only to necessary real-time updates
- Implement proper cleanup to avoid memory leaks
- Handle connection failures gracefully
- Use polling as fallback for WebSocket failures

### 5. Performance
- Use caching for frequently accessed data
- Implement pagination for large datasets
- Batch API calls when possible
- Monitor API performance metrics

## Migration Guide

### From Basic API to Enhanced API

1. **Replace API imports**:
```typescript
// Before
import api from './services/api';

// After
import enhancedMeterService from './services/enhancedMeterService';
```

2. **Update API calls**:
```typescript
// Before
const response = await api.get('/meters');
const meters = response.data.data;

// After
const response = await enhancedMeterService.getMeters();
const meters = response.data.data;
```

3. **Add error handling**:
```typescript
// Before
try {
  const response = await api.get('/meters');
  setMeters(response.data.data);
} catch (error) {
  console.error(error);
}

// After
const { data: meters, loading, error } = useApiState(
  () => enhancedMeterService.getMeters(),
  { immediate: true }
);
```

4. **Implement loading states**:
```typescript
// Before
const [loading, setLoading] = useState(false);

// After
// Loading state is automatically managed by useApiState
```

## Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check network connectivity
   - Verify API endpoint availability
   - Review retry configurations
   - Check server logs for issues

2. **Slow Response Times**
   - Enable caching for frequently accessed data
   - Optimize API queries
   - Check network latency
   - Review server performance

3. **Real-time Connection Issues**
   - Verify real-time service health
   - Check subscription configurations
   - Review network firewall settings
   - Monitor connection stability

4. **Memory Leaks**
   - Ensure proper cleanup of subscriptions
   - Clear unused cache entries
   - Unsubscribe from real-time updates
   - Monitor component unmounting

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// Enable debug logging
localStorage.setItem('api_debug', 'true');

// View detailed error information
console.log('Error details:', errorHandler.getErrorStats());

// Monitor loading states
console.log('Loading states:', loadingStateManager.getStats());
```

## Support

For issues or questions regarding the enhanced API integration:

1. Check the error logs and diagnostics
2. Review the test cases for usage examples
3. Consult the API documentation
4. Contact the development team with diagnostic information

## Changelog

### Version 1.0.0
- Initial implementation of enhanced API integration
- Comprehensive error handling system
- Loading state management
- Retry mechanisms with exponential backoff
- Real-time data management
- React hooks for API state management
- Comprehensive test coverage
- System health monitoring
- Performance metrics collection