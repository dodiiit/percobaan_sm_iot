<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class CacheMiddleware
{
    private CacheService $cache;
    private LoggerInterface $logger;
    private array $cacheableRoutes;
    private array $cacheTtls;

    public function __construct(CacheService $cache, LoggerInterface $logger)
    {
        $this->cache = $cache;
        $this->logger = $logger;
        
        // Define cacheable routes and their TTLs (in seconds)
        $this->cacheableRoutes = [
            'GET' => [
                '/api/meters' => true,
                '/api/meters/{id}' => true,
                '/api/meters/{id}/consumption' => true,
                '/api/meters/{id}/balance' => true,
                '/api/tariffs' => true,
                '/api/tariffs/{id}' => true,
                '/api/service-fees' => true,
                '/api/service-fees/{id}' => true,
                '/api/properties' => true,
                '/api/properties/{id}' => true,
                '/api/users/{id}' => true,
            ]
        ];

        $this->cacheTtls = [
            '/api/meters' => 300, // 5 minutes
            '/api/meters/{id}' => 300, // 5 minutes
            '/api/meters/{id}/consumption' => 600, // 10 minutes
            '/api/meters/{id}/balance' => 60, // 1 minute (real-time data)
            '/api/tariffs' => 3600, // 1 hour (relatively static)
            '/api/tariffs/{id}' => 3600, // 1 hour
            '/api/service-fees' => 3600, // 1 hour
            '/api/service-fees/{id}' => 3600, // 1 hour
            '/api/properties' => 1800, // 30 minutes
            '/api/properties/{id}' => 1800, // 30 minutes
            '/api/users/{id}' => 900, // 15 minutes
        ];
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $method = $request->getMethod();
        $uri = $request->getUri()->getPath();
        
        // Only cache GET requests
        if ($method !== 'GET') {
            $response = $handler->handle($request);
            
            // Invalidate related cache on write operations
            if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
                $this->invalidateRelatedCache($uri);
            }
            
            return $response;
        }

        // Check if route is cacheable
        if (!$this->isCacheable($method, $uri)) {
            return $handler->handle($request);
        }

        // Generate cache key
        $cacheKey = $this->generateCacheKey($request);
        
        // Try to get from cache
        $cachedResponse = $this->cache->get($cacheKey);
        if ($cachedResponse !== null) {
            $this->logger->info("Cache hit for key: {$cacheKey}");
            return $this->createResponseFromCache($cachedResponse);
        }

        // Process request
        $response = $handler->handle($request);
        
        // Cache successful responses
        if ($response->getStatusCode() === 200) {
            $this->cacheResponse($cacheKey, $response, $uri);
        }

        // Add cache headers
        $response = $this->addCacheHeaders($response, $uri);

        return $response;
    }

    private function isCacheable(string $method, string $uri): bool
    {
        if (!isset($this->cacheableRoutes[$method])) {
            return false;
        }

        foreach ($this->cacheableRoutes[$method] as $pattern => $cacheable) {
            if ($this->matchRoute($pattern, $uri)) {
                return $cacheable;
            }
        }

        return false;
    }

    private function matchRoute(string $pattern, string $uri): bool
    {
        // Convert route pattern to regex
        $regex = preg_replace('/\{[^}]+\}/', '[^/]+', $pattern);
        $regex = '#^' . $regex . '$#';
        
        return preg_match($regex, $uri) === 1;
    }

    private function generateCacheKey(Request $request): string
    {
        $uri = $request->getUri()->getPath();
        $queryParams = $request->getQueryParams();
        $userId = $request->getAttribute('user_id');
        
        return $this->cache->generateApiKey($uri, $queryParams, $userId);
    }

    private function createResponseFromCache(array $cachedData): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write($cachedData['body']);
        
        foreach ($cachedData['headers'] as $name => $value) {
            $response = $response->withHeader($name, $value);
        }
        
        return $response
            ->withStatus($cachedData['status'])
            ->withHeader('X-Cache', 'HIT');
    }

    private function cacheResponse(string $cacheKey, Response $response, string $uri): void
    {
        try {
            $body = (string) $response->getBody();
            $headers = $response->getHeaders();
            $status = $response->getStatusCode();
            
            $cacheData = [
                'body' => $body,
                'headers' => $headers,
                'status' => $status,
                'cached_at' => time()
            ];
            
            $ttl = $this->getTtlForRoute($uri);
            $this->cache->set($cacheKey, $cacheData, $ttl);
            
            $this->logger->info("Cached response for key: {$cacheKey} with TTL: {$ttl}");
        } catch (\Exception $e) {
            $this->logger->error("Failed to cache response: " . $e->getMessage());
        }
    }

    private function getTtlForRoute(string $uri): int
    {
        foreach ($this->cacheTtls as $pattern => $ttl) {
            if ($this->matchRoute($pattern, $uri)) {
                return $ttl;
            }
        }
        
        return 300; // Default 5 minutes
    }

    private function addCacheHeaders(Response $response, string $uri): Response
    {
        $ttl = $this->getTtlForRoute($uri);
        
        return $response
            ->withHeader('Cache-Control', "public, max-age={$ttl}")
            ->withHeader('Expires', gmdate('D, d M Y H:i:s', time() + $ttl) . ' GMT')
            ->withHeader('X-Cache', 'MISS')
            ->withHeader('Vary', 'Authorization, Accept-Encoding');
    }

    private function invalidateRelatedCache(string $uri): void
    {
        try {
            // Extract resource type from URI
            $parts = explode('/', trim($uri, '/'));
            
            if (count($parts) >= 2) {
                $resource = $parts[1]; // e.g., 'meters', 'tariffs', etc.
                
                // Invalidate all cache entries for this resource
                $pattern = "api:/{$parts[0]}/{$resource}*";
                $deleted = $this->cache->deletePattern($pattern);
                
                if ($deleted > 0) {
                    $this->logger->info("Invalidated {$deleted} cache entries for pattern: {$pattern}");
                }
            }
        } catch (\Exception $e) {
            $this->logger->error("Failed to invalidate cache: " . $e->getMessage());
        }
    }

    /**
     * Manually invalidate cache for specific patterns
     */
    public function invalidateCache(array $patterns): int
    {
        $totalDeleted = 0;
        
        foreach ($patterns as $pattern) {
            try {
                $deleted = $this->cache->deletePattern($pattern);
                $totalDeleted += $deleted;
                $this->logger->info("Invalidated {$deleted} cache entries for pattern: {$pattern}");
            } catch (\Exception $e) {
                $this->logger->error("Failed to invalidate cache pattern {$pattern}: " . $e->getMessage());
            }
        }
        
        return $totalDeleted;
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        return $this->cache->getStats();
    }
}