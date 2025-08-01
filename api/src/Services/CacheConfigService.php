<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

class CacheConfigService
{
    /**
     * Cache TTL configurations for different data types
     */
    public const CACHE_TTLS = [
        // Real-time data (short cache)
        'meter_balance' => 60,          // 1 minute
        'meter_status' => 30,           // 30 seconds
        'realtime_data' => 15,          // 15 seconds
        
        // Frequently changing data
        'meter_consumption' => 300,     // 5 minutes
        'meter_credits' => 300,         // 5 minutes
        'payment_history' => 300,       // 5 minutes
        
        // Moderately changing data
        'meters' => 600,                // 10 minutes
        'users' => 900,                 // 15 minutes
        'properties' => 1800,           // 30 minutes
        
        // Relatively static data
        'tariffs' => 3600,              // 1 hour
        'service_fees' => 3600,         // 1 hour
        'system_settings' => 3600,      // 1 hour
        
        // Static data
        'user_roles' => 7200,           // 2 hours
        'system_config' => 7200,        // 2 hours
    ];

    /**
     * Cache invalidation patterns for different operations
     */
    public const INVALIDATION_PATTERNS = [
        'meter_create' => ['meters*', 'properties*'],
        'meter_update' => ['meters*', 'meter:*', 'meter_balance:*', 'meter_consumption:*'],
        'meter_delete' => ['meters*', 'meter:*', 'meter_balance:*', 'meter_consumption:*', 'meter_credits:*'],
        'meter_topup' => ['meter_balance:*', 'meter_credits:*', 'meter:*'],
        
        'tariff_create' => ['tariffs*'],
        'tariff_update' => ['tariffs*', 'tariff:*'],
        'tariff_delete' => ['tariffs*', 'tariff:*'],
        
        'service_fee_create' => ['service_fees*'],
        'service_fee_update' => ['service_fees*', 'service_fee:*'],
        'service_fee_delete' => ['service_fees*', 'service_fee:*'],
        
        'property_create' => ['properties*'],
        'property_update' => ['properties*', 'property:*', 'meters*'],
        'property_delete' => ['properties*', 'property:*', 'meters*'],
        
        'user_create' => ['users*'],
        'user_update' => ['users*', 'user:*'],
        'user_delete' => ['users*', 'user:*'],
        
        'payment_create' => ['payment_history:*', 'meter_balance:*', 'meter_credits:*'],
    ];

    /**
     * Cache warming strategies
     */
    public const WARM_CACHE_ROUTES = [
        'meters' => [
            'route' => '/api/meters',
            'params' => [
                ['limit' => 20, 'offset' => 0],
                ['limit' => 20, 'offset' => 0, 'status' => 'active'],
                ['limit' => 20, 'offset' => 0, 'status' => 'inactive'],
            ]
        ],
        'tariffs' => [
            'route' => '/api/tariffs',
            'params' => [
                ['limit' => 50, 'offset' => 0],
            ]
        ],
        'service_fees' => [
            'route' => '/api/service-fees',
            'params' => [
                ['limit' => 50, 'offset' => 0],
            ]
        ],
    ];

    /**
     * Get TTL for a specific cache type
     */
    public static function getTtl(string $type): int
    {
        return self::CACHE_TTLS[$type] ?? 300; // Default 5 minutes
    }

    /**
     * Get invalidation patterns for an operation
     */
    public static function getInvalidationPatterns(string $operation): array
    {
        return self::INVALIDATION_PATTERNS[$operation] ?? [];
    }

    /**
     * Get cache warming configuration
     */
    public static function getWarmCacheConfig(): array
    {
        return self::WARM_CACHE_ROUTES;
    }

    /**
     * Check if a route should be cached
     */
    public static function shouldCache(string $method, string $route): bool
    {
        // Only cache GET requests
        if ($method !== 'GET') {
            return false;
        }

        // Define non-cacheable routes
        $nonCacheableRoutes = [
            '/api/auth/login',
            '/api/auth/logout',
            '/api/auth/refresh',
            '/api/meters/*/ota',
            '/api/meters/*/control',
            '/api/realtime/*',
        ];

        foreach ($nonCacheableRoutes as $pattern) {
            if (fnmatch($pattern, $route)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get cache headers for a route
     */
    public static function getCacheHeaders(string $route): array
    {
        $ttl = 300; // Default 5 minutes

        // Determine TTL based on route
        if (strpos($route, '/balance') !== false || strpos($route, '/status') !== false) {
            $ttl = self::getTtl('meter_balance');
        } elseif (strpos($route, '/consumption') !== false) {
            $ttl = self::getTtl('meter_consumption');
        } elseif (strpos($route, '/tariffs') !== false) {
            $ttl = self::getTtl('tariffs');
        } elseif (strpos($route, '/service-fees') !== false) {
            $ttl = self::getTtl('service_fees');
        } elseif (strpos($route, '/meters') !== false) {
            $ttl = self::getTtl('meters');
        }

        return [
            'Cache-Control' => "public, max-age={$ttl}",
            'Expires' => gmdate('D, d M Y H:i:s', time() + $ttl) . ' GMT',
            'Vary' => 'Authorization, Accept-Encoding',
        ];
    }

    /**
     * Generate cache tags for a resource
     */
    public static function generateCacheTags(string $resource, array $data = []): array
    {
        $tags = [$resource];

        switch ($resource) {
            case 'meter':
                if (isset($data['id'])) {
                    $tags[] = "meter:{$data['id']}";
                }
                if (isset($data['property_id'])) {
                    $tags[] = "property:{$data['property_id']}";
                }
                break;

            case 'property':
                if (isset($data['id'])) {
                    $tags[] = "property:{$data['id']}";
                }
                break;

            case 'user':
                if (isset($data['id'])) {
                    $tags[] = "user:{$data['id']}";
                }
                if (isset($data['role'])) {
                    $tags[] = "role:{$data['role']}";
                }
                break;
        }

        return $tags;
    }
}