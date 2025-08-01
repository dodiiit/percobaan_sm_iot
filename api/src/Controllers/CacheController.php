<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Controllers\BaseController;
use IndoWater\Api\Services\CacheService;
use IndoWater\Api\Services\CacheConfigService;
use Psr\Log\LoggerInterface;

class CacheController extends BaseController
{
    public function __construct(CacheService $cache, LoggerInterface $logger)
    {
        parent::__construct($cache, $logger);
    }

    /**
     * Get cache statistics
     */
    public function stats(Request $request, Response $response): Response
    {
        try {
            $stats = $this->cache->getStats();
            
            return $this->successResponse($response, [
                'redis_stats' => $stats,
                'cache_config' => [
                    'default_ttl' => 300,
                    'total_cache_types' => count(CacheConfigService::CACHE_TTLS),
                    'cache_ttls' => CacheConfigService::CACHE_TTLS
                ]
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Clear all cache
     */
    public function clear(Request $request, Response $response): Response
    {
        try {
            // Check if user has admin role
            if (!$this->hasPermission($request, ['superadmin'])) {
                return $this->errorResponse($response, 'Insufficient permissions', 403);
            }

            $result = $this->cache->flush();
            
            if ($result) {
                $this->logger->info('Cache cleared by user: ' . $this->getUserId($request));
                return $this->successResponse($response, null, 'Cache cleared successfully');
            } else {
                return $this->errorResponse($response, 'Failed to clear cache');
            }

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Clear cache by pattern
     */
    public function clearPattern(Request $request, Response $response): Response
    {
        try {
            // Check if user has admin role
            if (!$this->hasPermission($request, ['superadmin'])) {
                return $this->errorResponse($response, 'Insufficient permissions', 403);
            }

            $data = $request->getParsedBody();
            $pattern = $data['pattern'] ?? '';

            if (empty($pattern)) {
                return $this->errorResponse($response, 'Pattern is required', 400);
            }

            $deleted = $this->cache->deletePattern($pattern);
            
            $this->logger->info("Cache pattern '{$pattern}' cleared by user: " . $this->getUserId($request) . ", deleted: {$deleted} keys");
            
            return $this->successResponse($response, [
                'pattern' => $pattern,
                'deleted_keys' => $deleted
            ], 'Cache pattern cleared successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Warm up cache for frequently accessed data
     */
    public function warmup(Request $request, Response $response): Response
    {
        try {
            // Check if user has admin role
            if (!$this->hasPermission($request, ['superadmin'])) {
                return $this->errorResponse($response, 'Insufficient permissions', 403);
            }

            $warmupConfig = CacheConfigService::getWarmCacheConfig();
            $warmedRoutes = [];

            foreach ($warmupConfig as $resource => $config) {
                foreach ($config['params'] as $params) {
                    $cacheKey = $this->cache->generateApiKey($config['route'], $params);
                    
                    // This would typically make internal API calls to warm the cache
                    // For now, we'll just log the warming attempt
                    $this->logger->info("Warming cache for {$resource} with params: " . json_encode($params));
                    $warmedRoutes[] = [
                        'resource' => $resource,
                        'route' => $config['route'],
                        'params' => $params,
                        'cache_key' => $cacheKey
                    ];
                }
            }

            return $this->successResponse($response, [
                'warmed_routes' => $warmedRoutes,
                'total_routes' => count($warmedRoutes)
            ], 'Cache warmup initiated');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get cache key information
     */
    public function keyInfo(Request $request, Response $response, array $args): Response
    {
        try {
            $key = $args['key'] ?? '';

            if (empty($key)) {
                return $this->errorResponse($response, 'Cache key is required', 400);
            }

            $exists = $this->cache->exists($key);
            $ttl = $this->cache->ttl($key);
            $value = null;

            if ($exists) {
                $value = $this->cache->get($key);
            }

            return $this->successResponse($response, [
                'key' => $key,
                'exists' => $exists,
                'ttl' => $ttl,
                'value' => $value,
                'size' => $value ? strlen(json_encode($value)) : 0
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Invalidate cache for specific operations
     */
    public function invalidate(Request $request, Response $response): Response
    {
        try {
            // Check if user has admin role
            if (!$this->hasPermission($request, ['superadmin', 'admin'])) {
                return $this->errorResponse($response, 'Insufficient permissions', 403);
            }

            $data = $request->getParsedBody();
            $operation = $data['operation'] ?? '';

            if (empty($operation)) {
                return $this->errorResponse($response, 'Operation is required', 400);
            }

            $patterns = CacheConfigService::getInvalidationPatterns($operation);
            
            if (empty($patterns)) {
                return $this->errorResponse($response, 'Unknown operation', 400);
            }

            $totalDeleted = 0;
            foreach ($patterns as $pattern) {
                $deleted = $this->cache->deletePattern($pattern);
                $totalDeleted += $deleted;
            }

            $this->logger->info("Cache invalidated for operation '{$operation}' by user: " . $this->getUserId($request) . ", deleted: {$totalDeleted} keys");

            return $this->successResponse($response, [
                'operation' => $operation,
                'patterns' => $patterns,
                'deleted_keys' => $totalDeleted
            ], 'Cache invalidated successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get cache health status
     */
    public function health(Request $request, Response $response): Response
    {
        try {
            $stats = $this->cache->getStats();
            
            // Calculate cache hit ratio
            $hits = $stats['keyspace_hits'] ?? 0;
            $misses = $stats['keyspace_misses'] ?? 0;
            $total = $hits + $misses;
            $hitRatio = $total > 0 ? ($hits / $total) * 100 : 0;

            $health = [
                'status' => 'healthy',
                'redis_connected' => true,
                'memory_usage' => $stats['used_memory_human'] ?? '0B',
                'hit_ratio' => round($hitRatio, 2),
                'total_commands' => $stats['total_commands_processed'] ?? 0,
                'connected_clients' => $stats['connected_clients'] ?? 0,
            ];

            // Determine health status based on metrics
            if ($hitRatio < 50) {
                $health['status'] = 'warning';
                $health['warnings'][] = 'Low cache hit ratio';
            }

            if (($stats['connected_clients'] ?? 0) > 100) {
                $health['status'] = 'warning';
                $health['warnings'][] = 'High number of connected clients';
            }

            return $this->successResponse($response, $health);

        } catch (\Exception $e) {
            return $this->errorResponse($response, 'Cache health check failed: ' . $e->getMessage());
        }
    }
}