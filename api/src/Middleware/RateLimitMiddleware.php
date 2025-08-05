<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Container\ContainerInterface;
use Slim\Psr7\Response;

class RateLimitMiddleware implements MiddlewareInterface
{
    private int $maxRequests;
    private int $perMinute;
    private array $excludedRoutes;
    private array $apiLimits;
    private bool $useRedis;
    private ?\Redis $redis = null;

    public function __construct(ContainerInterface $container)
    {
        $settings = $container->get('settings');
        $this->maxRequests = $settings['security']['rate_limit_requests'] ?? 60;
        $this->perMinute = $settings['security']['rate_limit_per_minute'] ?? 1;
        $this->excludedRoutes = $settings['security']['rate_limit_excluded_routes'] ?? ['/health', '/webhook'];
        
        // Different limits for different API endpoints
        $this->apiLimits = $settings['security']['api_rate_limits'] ?? [
            '/api/auth' => ['limit' => 10, 'period' => 1], // 10 requests per minute
            '/api/payments' => ['limit' => 20, 'period' => 1], // 20 requests per minute
            '/api/meters' => ['limit' => 30, 'period' => 1], // 30 requests per minute
        ];
        
        // Check if Redis is available for distributed rate limiting
        $this->useRedis = isset($settings['cache']['driver']) && $settings['cache']['driver'] === 'redis';
        
        if ($this->useRedis) {
            try {
                $this->redis = new \Redis();
                $host = $settings['cache']['redis']['host'] ?? '127.0.0.1';
                $port = $settings['cache']['redis']['port'] ?? 6379;
                $this->redis->connect($host, $port);
                
                if (isset($settings['cache']['redis']['password']) && !empty($settings['cache']['redis']['password'])) {
                    $this->redis->auth($settings['cache']['redis']['password']);
                }
            } catch (\Exception $e) {
                // Fallback to session-based rate limiting if Redis connection fails
                $this->useRedis = false;
            }
        }
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();
        
        // Skip rate limiting for excluded routes
        foreach ($this->excludedRoutes as $excludedRoute) {
            if (strpos($path, $excludedRoute) === 0) {
                return $handler->handle($request);
            }
        }
        
        // Get client IP address
        $ip = $this->getClientIp($request);
        
        // Get user ID if authenticated
        $userId = $this->getUserId($request);
        
        // Determine which rate limit to apply based on the path
        $limit = $this->maxRequests;
        $period = $this->perMinute * 60; // Convert to seconds
        
        foreach ($this->apiLimits as $apiPath => $rateConfig) {
            if (strpos($path, $apiPath) === 0) {
                $limit = $rateConfig['limit'];
                $period = $rateConfig['period'] * 60; // Convert to seconds
                break;
            }
        }
        
        // Create unique keys for rate limiting
        $ipKey = "rate_limit:ip:{$ip}:{$path}";
        $userKey = $userId ? "rate_limit:user:{$userId}:{$path}" : null;
        
        // Check rate limits
        $ipLimitExceeded = $this->isRateLimitExceeded($ipKey, $limit, $period);
        $userLimitExceeded = $userKey ? $this->isRateLimitExceeded($userKey, $limit, $period) : false;
        
        if ($ipLimitExceeded || $userLimitExceeded) {
            return $this->createRateLimitExceededResponse($period);
        }
        
        // Add rate limit headers to response
        $response = $handler->handle($request);
        $remaining = $limit - $this->getCurrentRequestCount($ipKey);
        
        return $response
            ->withHeader('X-RateLimit-Limit', (string) $limit)
            ->withHeader('X-RateLimit-Remaining', (string) max(0, $remaining))
            ->withHeader('X-RateLimit-Reset', (string) (time() + $period));
    }
    
    private function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        
        // Check for proxy headers first
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',  // Common proxy header
            'HTTP_X_REAL_IP',        // Nginx proxy
            'HTTP_CLIENT_IP',        // Client IP
            'REMOTE_ADDR'            // Direct connection
        ];
        
        foreach ($headers as $header) {
            if (isset($serverParams[$header])) {
                // If it's a comma-separated list, take the first IP
                $ips = explode(',', $serverParams[$header]);
                $ip = trim($ips[0]);
                
                // Validate IP format
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0'; // Default if no valid IP found
    }
    
    private function getUserId(ServerRequestInterface $request): ?string
    {
        // Try to get user ID from JWT token or session
        // This is a simplified example - implement according to your auth system
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        
        return $_SESSION['user_id'] ?? null;
    }
    
    private function isRateLimitExceeded(string $key, int $limit, int $period): bool
    {
        if ($this->useRedis && $this->redis) {
            return $this->isRateLimitExceededRedis($key, $limit, $period);
        } else {
            return $this->isRateLimitExceededSession($key, $limit, $period);
        }
    }
    
    private function isRateLimitExceededRedis(string $key, int $limit, int $period): bool
    {
        $current = $this->redis->incr($key);
        
        // Set expiry on first request
        if ($current === 1) {
            $this->redis->expire($key, $period);
        }
        
        return $current > $limit;
    }
    
    private function isRateLimitExceededSession(string $key, int $limit, int $period): bool
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        
        // Initialize rate limiting data if not exists
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = [
                'requests' => 0,
                'reset_time' => time() + $period,
            ];
        }
        
        // Reset counter if time has expired
        if ($_SESSION[$key]['reset_time'] <= time()) {
            $_SESSION[$key] = [
                'requests' => 0,
                'reset_time' => time() + $period,
            ];
        }
        
        // Increment request counter
        $_SESSION[$key]['requests']++;
        
        return $_SESSION[$key]['requests'] > $limit;
    }
    
    private function getCurrentRequestCount(string $key): int
    {
        if ($this->useRedis && $this->redis) {
            return (int) $this->redis->get($key) ?: 0;
        } else {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                session_start();
            }
            
            return $_SESSION[$key]['requests'] ?? 0;
        }
    }
    
    private function createRateLimitExceededResponse(int $period): ResponseInterface
    {
        $response = new Response();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => 'Rate limit exceeded. Please try again later.',
            'retry_after' => $period,
        ]));
        
        return $response
            ->withStatus(429)
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Retry-After', (string) $period);
    }
}