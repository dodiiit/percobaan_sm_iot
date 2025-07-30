<?php

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Log\LoggerInterface;

/**
 * Security Middleware
 * 
 * This middleware adds security headers to the response.
 */
class SecurityMiddleware implements MiddlewareInterface
{
    /**
     * @var LoggerInterface
     */
    protected $logger;

    /**
     * @var array
     */
    protected $config;

    /**
     * Constructor
     * 
     * @param LoggerInterface $logger
     * @param array $config
     */
    public function __construct(LoggerInterface $logger, array $config = [])
    {
        $this->logger = $logger;
        $this->config = array_merge([
            'content_security_policy' => "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self'; img-src 'self'; media-src 'self'; frame-src 'none'; font-src 'self'; connect-src 'self'",
            'x_content_type_options' => 'nosniff',
            'x_frame_options' => 'DENY',
            'x_xss_protection' => '1; mode=block',
            'strict_transport_security' => 'max-age=31536000; includeSubDomains; preload',
            'referrer_policy' => 'strict-origin-when-cross-origin',
            'feature_policy' => "camera 'none'; microphone 'none'; geolocation 'none'",
            'permissions_policy' => "camera=(), microphone=(), geolocation=()",
            'cache_control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'pragma' => 'no-cache',
            'rate_limit' => 60, // requests per minute
        ], $config);
    }

    /**
     * Process the request
     * 
     * @param ServerRequestInterface $request
     * @param RequestHandlerInterface $handler
     * 
     * @return ResponseInterface
     */
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Check rate limiting
        if (!$this->checkRateLimit($request)) {
            $response = new \Slim\Psr7\Response();
            $response = $response->withStatus(429);
            $response = $response->withHeader('Content-Type', 'application/json');
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Too many requests',
                'code' => 'RATE_LIMIT_EXCEEDED',
            ], JSON_PRETTY_PRINT));
            return $response;
        }

        // Process the request
        $response = $handler->handle($request);

        // Add security headers
        $response = $this->addSecurityHeaders($response);

        return $response;
    }

    /**
     * Add security headers to the response
     * 
     * @param ResponseInterface $response
     * 
     * @return ResponseInterface
     */
    protected function addSecurityHeaders(ResponseInterface $response): ResponseInterface
    {
        // Content Security Policy
        if ($this->config['content_security_policy']) {
            $response = $response->withHeader('Content-Security-Policy', $this->config['content_security_policy']);
        }

        // X-Content-Type-Options
        if ($this->config['x_content_type_options']) {
            $response = $response->withHeader('X-Content-Type-Options', $this->config['x_content_type_options']);
        }

        // X-Frame-Options
        if ($this->config['x_frame_options']) {
            $response = $response->withHeader('X-Frame-Options', $this->config['x_frame_options']);
        }

        // X-XSS-Protection
        if ($this->config['x_xss_protection']) {
            $response = $response->withHeader('X-XSS-Protection', $this->config['x_xss_protection']);
        }

        // Strict-Transport-Security
        if ($this->config['strict_transport_security']) {
            $response = $response->withHeader('Strict-Transport-Security', $this->config['strict_transport_security']);
        }

        // Referrer-Policy
        if ($this->config['referrer_policy']) {
            $response = $response->withHeader('Referrer-Policy', $this->config['referrer_policy']);
        }

        // Feature-Policy
        if ($this->config['feature_policy']) {
            $response = $response->withHeader('Feature-Policy', $this->config['feature_policy']);
        }

        // Permissions-Policy
        if ($this->config['permissions_policy']) {
            $response = $response->withHeader('Permissions-Policy', $this->config['permissions_policy']);
        }

        // Cache-Control
        if ($this->config['cache_control']) {
            $response = $response->withHeader('Cache-Control', $this->config['cache_control']);
        }

        // Pragma
        if ($this->config['pragma']) {
            $response = $response->withHeader('Pragma', $this->config['pragma']);
        }

        return $response;
    }

    /**
     * Check rate limiting
     * 
     * @param ServerRequestInterface $request
     * 
     * @return bool
     */
    protected function checkRateLimit(ServerRequestInterface $request): bool
    {
        // Get client IP
        $ip = $this->getClientIp($request);

        // Get rate limit from config
        $rateLimit = $this->config['rate_limit'];

        // Check if rate limiting is disabled
        if ($rateLimit <= 0) {
            return true;
        }

        // Get current timestamp
        $now = time();

        // Get cache key
        $cacheKey = 'rate_limit:' . $ip;

        // Get rate limit data from cache
        $rateData = $this->getRateLimitData($cacheKey);

        // If no rate limit data, create new
        if (!$rateData) {
            $rateData = [
                'count' => 1,
                'reset' => $now + 60,
            ];
            $this->setRateLimitData($cacheKey, $rateData, 60);
            return true;
        }

        // If rate limit reset time has passed, reset count
        if ($now > $rateData['reset']) {
            $rateData = [
                'count' => 1,
                'reset' => $now + 60,
            ];
            $this->setRateLimitData($cacheKey, $rateData, 60);
            return true;
        }

        // Increment count
        $rateData['count']++;

        // Check if rate limit exceeded
        if ($rateData['count'] > $rateLimit) {
            // Log rate limit exceeded
            $this->logger->warning('Rate limit exceeded', [
                'ip' => $ip,
                'count' => $rateData['count'],
                'limit' => $rateLimit,
                'reset' => $rateData['reset'],
            ]);
            return false;
        }

        // Update rate limit data
        $this->setRateLimitData($cacheKey, $rateData, $rateData['reset'] - $now);

        return true;
    }

    /**
     * Get rate limit data from cache
     * 
     * @param string $key
     * 
     * @return array|null
     */
    protected function getRateLimitData(string $key): ?array
    {
        // In a real application, this would use a cache system like Redis or Memcached
        // For simplicity, we'll use a file-based cache
        $cacheFile = sys_get_temp_dir() . '/' . md5($key) . '.cache';

        if (!file_exists($cacheFile)) {
            return null;
        }

        $data = file_get_contents($cacheFile);
        $data = json_decode($data, true);

        return $data;
    }

    /**
     * Set rate limit data in cache
     * 
     * @param string $key
     * @param array $data
     * @param int $ttl
     * 
     * @return void
     */
    protected function setRateLimitData(string $key, array $data, int $ttl): void
    {
        // In a real application, this would use a cache system like Redis or Memcached
        // For simplicity, we'll use a file-based cache
        $cacheFile = sys_get_temp_dir() . '/' . md5($key) . '.cache';

        file_put_contents($cacheFile, json_encode($data));
    }

    /**
     * Get client IP address
     * 
     * @param ServerRequestInterface $request
     * 
     * @return string
     */
    protected function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        
        $headers = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        ];
        
        foreach ($headers as $header) {
            if (isset($serverParams[$header])) {
                $ips = explode(',', $serverParams[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return 'unknown';
    }
}