# Caching Strategy Documentation

## Overview

This document outlines the comprehensive caching strategies implemented in the IndoWater IoT Smart Monitoring system to improve performance, reduce database load, and enhance user experience.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Caching (PHP API)](#backend-caching-php-api)
3. [Frontend Caching (React)](#frontend-caching-react)
4. [Cache Configuration](#cache-configuration)
5. [Cache Management](#cache-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

The caching system implements a multi-layered approach:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Frontend      │    │   Backend       │
│   Cache         │    │   Cache         │    │   Cache         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • HTTP Cache    │    │ • Memory Cache  │    │ • Redis Cache   │
│ • Local Storage │    │ • Session Cache │    │ • Response Cache│
│ • Session Cache │    │ • Local Storage │    │ • Query Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Cache Layers

1. **Browser Cache**: HTTP headers control browser caching
2. **Frontend Cache**: Client-side caching using memory, localStorage, and sessionStorage
3. **Backend Cache**: Server-side caching using Redis for API responses and database queries

## Backend Caching (PHP API)

### Redis Configuration

The backend uses Redis as the primary caching store with the following configuration:

```php
// config/settings.php
'redis' => [
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
    'database' => 0,
    'password' => null,
],
'cache' => [
    'driver' => 'redis',
    'prefix' => 'indowater:',
    'default_ttl' => 3600,
    'enabled' => true,
],
```

### Cache Service

The `CacheService` class provides a unified interface for caching operations:

```php
// Basic usage
$cache->set('key', $data, 300); // Cache for 5 minutes
$data = $cache->get('key');
$cache->delete('key');

// Advanced usage
$data = $cache->remember('key', function() {
    return $this->expensiveOperation();
}, 600);
```

### Cache Middleware

The `CacheMiddleware` automatically caches GET requests based on route patterns:

#### Cacheable Routes and TTLs

| Route Pattern | TTL | Description |
|---------------|-----|-------------|
| `/api/meters` | 5 minutes | Meter listings |
| `/api/meters/{id}` | 5 minutes | Individual meter data |
| `/api/meters/{id}/consumption` | 10 minutes | Consumption data |
| `/api/meters/{id}/balance` | 1 minute | Real-time balance |
| `/api/tariffs` | 1 hour | Tariff data (relatively static) |
| `/api/service-fees` | 1 hour | Service fee data |
| `/api/properties` | 30 minutes | Property data |
| `/api/users/{id}` | 15 minutes | User profile data |

#### Non-Cacheable Routes

- Authentication endpoints (`/api/auth/*`)
- Real-time endpoints (`/api/realtime/*`)
- Control endpoints (`/api/meters/*/ota`, `/api/meters/*/control`)
- Cache management endpoints (`/api/cache/*`)

### Cache Invalidation

Cache invalidation occurs automatically on write operations:

```php
// Invalidation patterns for different operations
'meter_create' => ['meters*', 'properties*'],
'meter_update' => ['meters*', 'meter:*', 'meter_balance:*'],
'meter_topup' => ['meter_balance:*', 'meter_credits:*'],
'tariff_update' => ['tariffs*', 'tariff:*'],
```

### Base Controller Integration

Controllers extend `BaseController` for easy caching:

```php
// Cached response example
return $this->cachedJsonResponse($response, $cacheKey, function() {
    return $this->expensiveDataRetrieval();
}, 300);

// Cache invalidation
$this->invalidateCache(['meters*', 'properties*']);
```

## Frontend Caching (React)

### Cache Service

The frontend implements a sophisticated caching system with multiple storage options:

```typescript
// Cache configurations for different data types
const CACHE_CONFIGS = {
  METER_BALANCE: { ttl: 60 * 1000, storage: 'memory' }, // 1 minute
  METER_STATUS: { ttl: 30 * 1000, storage: 'memory' }, // 30 seconds
  METERS: { ttl: 10 * 60 * 1000, storage: 'sessionStorage' }, // 10 minutes
  TARIFFS: { ttl: 60 * 60 * 1000, storage: 'localStorage' }, // 1 hour
};
```

### Storage Types

1. **Memory Cache**: Fast access, cleared on page refresh
2. **Session Storage**: Persists during browser session
3. **Local Storage**: Persists across browser sessions

### Cached API Client

The `cachedApi` client automatically handles caching:

```typescript
import { cachedApi, cacheManager } from './services/api';

// Automatic caching based on route configuration
const meters = await cachedApi.get('/meters');

// Manual cache management
cacheManager.clearPattern('meters*');
cacheManager.preload([
  { url: '/meters', params: { limit: 20 } },
  { url: '/tariffs' }
]);
```

### ETag Support

The frontend supports HTTP ETag validation for efficient cache revalidation:

```typescript
// Automatic ETag handling
// If cached data exists with ETag, sends If-None-Match header
// Server responds with 304 Not Modified if data unchanged
```

## Cache Configuration

### TTL Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Real-time data (balance, status) | 15-60 seconds | Frequently changing |
| Consumption data | 5-10 minutes | Updated periodically |
| User/Property data | 15-30 minutes | Moderately changing |
| Configuration data | 1-2 hours | Rarely changing |
| Static data | 2+ hours | Very stable |

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_PASSWORD=

# Cache Configuration
CACHE_DRIVER=redis
CACHE_PREFIX=indowater:
CACHE_DEFAULT_TTL=3600
CACHE_ENABLED=true
```

## Cache Management

### API Endpoints

The system provides administrative endpoints for cache management:

#### GET `/api/cache/stats`
Returns cache statistics and health information.

#### GET `/api/cache/health`
Returns cache health status and performance metrics.

#### POST `/api/cache/clear`
Clears all cache (requires superadmin role).

#### POST `/api/cache/clear-pattern`
Clears cache matching a specific pattern.

```json
{
  "pattern": "meters*"
}
```

#### POST `/api/cache/invalidate`
Invalidates cache for specific operations.

```json
{
  "operation": "meter_update"
}
```

#### POST `/api/cache/warmup`
Pre-loads frequently accessed data into cache.

### Frontend Cache Management

```typescript
import { cacheManager } from './services/api';

// Clear all cache
cacheManager.clearAll();

// Clear specific patterns
cacheManager.clearPattern('meters*');

// Get cache statistics
const stats = cacheManager.getStats();

// Preload data
await cacheManager.preload([
  { url: '/meters', params: { limit: 20 } },
  { url: '/tariffs' }
]);
```

## Performance Monitoring

### Metrics to Monitor

1. **Cache Hit Ratio**: Target > 80%
2. **Response Times**: Cached vs uncached requests
3. **Memory Usage**: Redis memory consumption
4. **Cache Size**: Number of cached items
5. **Invalidation Frequency**: Cache churn rate

### Monitoring Tools

1. **Redis CLI**: `redis-cli info stats`
2. **API Endpoints**: `/api/cache/stats`, `/api/cache/health`
3. **Browser DevTools**: Network tab shows cache headers
4. **Application Logs**: Cache hit/miss logging

### Performance Indicators

```bash
# Redis statistics
redis-cli info stats
# keyspace_hits:1000
# keyspace_misses:200
# Hit ratio: 83.3%

# Memory usage
redis-cli info memory
# used_memory_human:10.5M
```

## Best Practices

### Backend Caching

1. **Use appropriate TTLs** based on data volatility
2. **Implement cache warming** for critical data
3. **Monitor cache hit ratios** and adjust strategies
4. **Use cache tags** for efficient invalidation
5. **Handle cache failures gracefully** with fallbacks

### Frontend Caching

1. **Choose appropriate storage** based on data lifecycle
2. **Implement cache size limits** to prevent memory issues
3. **Use ETag validation** for efficient revalidation
4. **Clear cache on authentication changes**
5. **Preload critical data** on application startup

### General Guidelines

1. **Cache at multiple layers** for maximum efficiency
2. **Invalidate proactively** on data changes
3. **Monitor performance metrics** regularly
4. **Test cache behavior** in different scenarios
5. **Document cache strategies** for team understanding

## Troubleshooting

### Common Issues

#### High Cache Miss Rate
- **Symptoms**: Low hit ratio, slow response times
- **Causes**: Inappropriate TTLs, frequent invalidation
- **Solutions**: Adjust TTLs, optimize invalidation patterns

#### Memory Issues
- **Symptoms**: Redis memory warnings, OOM errors
- **Causes**: Large cache items, no eviction policy
- **Solutions**: Implement LRU eviction, reduce cache size

#### Stale Data
- **Symptoms**: Users see outdated information
- **Causes**: Insufficient invalidation, long TTLs
- **Solutions**: Improve invalidation logic, reduce TTLs

#### Cache Stampede
- **Symptoms**: Multiple requests for same data
- **Causes**: Simultaneous cache misses
- **Solutions**: Implement cache locking, staggered TTLs

### Debugging Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis commands
redis-cli monitor

# Check cache keys
redis-cli keys "indowater:*"

# Get cache statistics
redis-cli info stats

# Clear specific cache
redis-cli del "indowater:api:meters"
```

### Log Analysis

```bash
# Check cache hit/miss logs
tail -f api/logs/app.log | grep -i cache

# Monitor response times
tail -f api/logs/app.log | grep -i "response_time"
```

## Security Considerations

1. **Access Control**: Cache management endpoints require admin privileges
2. **Data Sensitivity**: Avoid caching sensitive user data in browser storage
3. **Cache Poisoning**: Validate data before caching
4. **Memory Limits**: Implement cache size limits to prevent DoS
5. **Encryption**: Consider encrypting cached sensitive data

## Deployment Considerations

1. **Redis Persistence**: Configure appropriate persistence settings
2. **Memory Allocation**: Allocate sufficient memory for Redis
3. **Network Latency**: Co-locate Redis with application servers
4. **Backup Strategy**: Include cache in backup/restore procedures
5. **Monitoring**: Set up alerts for cache performance metrics

## Future Enhancements

1. **Distributed Caching**: Implement cache clustering for scalability
2. **Smart Invalidation**: Use event-driven invalidation
3. **Predictive Caching**: Pre-load data based on usage patterns
4. **Cache Analytics**: Detailed cache usage analytics
5. **A/B Testing**: Test different caching strategies

---

For technical support or questions about the caching system, please contact the development team or refer to the API documentation.