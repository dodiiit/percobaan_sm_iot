<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

abstract class BaseController
{
    protected CacheService $cache;
    protected LoggerInterface $logger;

    public function __construct(CacheService $cache, LoggerInterface $logger)
    {
        $this->cache = $cache;
        $this->logger = $logger;
    }

    /**
     * Create JSON response with proper headers
     */
    protected function jsonResponse(Response $response, array $data, int $status = 200, array $headers = []): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        
        $response = $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);

        foreach ($headers as $name => $value) {
            $response = $response->withHeader($name, $value);
        }

        return $response;
    }

    /**
     * Create cached JSON response
     */
    protected function cachedJsonResponse(
        Response $response, 
        string $cacheKey, 
        callable $dataCallback, 
        int $ttl = 300,
        int $status = 200,
        array $headers = []
    ): Response {
        try {
            $data = $this->cache->remember($cacheKey, $dataCallback, $ttl);
            return $this->jsonResponse($response, $data, $status, $headers);
        } catch (\Exception $e) {
            $this->logger->error("Cached response error: " . $e->getMessage());
            // Fallback to direct data retrieval
            $data = $dataCallback();
            return $this->jsonResponse($response, $data, $status, $headers);
        }
    }

    /**
     * Invalidate cache patterns
     */
    protected function invalidateCache(array $patterns): void
    {
        foreach ($patterns as $pattern) {
            $this->cache->deletePattern($pattern);
        }
    }

    /**
     * Get paginated cache key
     */
    protected function getPaginatedCacheKey(string $resource, array $conditions = [], int $limit = 20, int $offset = 0): string
    {
        $params = array_merge($conditions, ['limit' => $limit, 'offset' => $offset]);
        return $this->cache->generateApiKey($resource, $params);
    }

    /**
     * Handle error response
     */
    protected function errorResponse(Response $response, string $message, int $status = 500, array $details = []): Response
    {
        $data = [
            'status' => 'error',
            'message' => $message
        ];

        if (!empty($details)) {
            $data['details'] = $details;
        }

        return $this->jsonResponse($response, $data, $status);
    }

    /**
     * Handle success response
     */
    protected function successResponse(Response $response, mixed $data = null, string $message = null, int $status = 200): Response
    {
        $responseData = ['status' => 'success'];

        if ($message) {
            $responseData['message'] = $message;
        }

        if ($data !== null) {
            $responseData['data'] = $data;
        }

        return $this->jsonResponse($response, $responseData, $status);
    }

    /**
     * Handle paginated response
     */
    protected function paginatedResponse(
        Response $response, 
        array $items, 
        int $total, 
        int $limit, 
        int $offset,
        array $meta = []
    ): Response {
        $data = [
            'status' => 'success',
            'data' => [
                'items' => $items,
                'pagination' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $total,
                    'current_page' => intval($offset / $limit) + 1,
                    'total_pages' => intval(ceil($total / $limit))
                ]
            ]
        ];

        if (!empty($meta)) {
            $data['meta'] = $meta;
        }

        return $this->jsonResponse($response, $data);
    }

    /**
     * Validate required fields
     */
    protected function validateRequired(array $data, array $required): array
    {
        $missing = [];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                $missing[] = $field;
            }
        }

        return $missing;
    }

    /**
     * Sanitize input data
     */
    protected function sanitizeInput(array $data): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = trim(strip_tags($value));
            } elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitizeInput($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Get user ID from request
     */
    protected function getUserId($request): ?string
    {
        return $request->getAttribute('user_id');
    }

    /**
     * Get user role from request
     */
    protected function getUserRole($request): ?string
    {
        return $request->getAttribute('user_role');
    }

    /**
     * Check if user has permission
     */
    protected function hasPermission($request, array $allowedRoles): bool
    {
        $userRole = $this->getUserRole($request);
        return in_array($userRole, $allowedRoles);
    }
}