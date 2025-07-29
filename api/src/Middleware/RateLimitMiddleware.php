<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Container\ContainerInterface;

class RateLimitMiddleware implements MiddlewareInterface
{
    private int $maxRequests;
    private int $perMinute;

    public function __construct(ContainerInterface $container)
    {
        $settings = $container->get('settings');
        $this->maxRequests = $settings['security']['rate_limit_requests'];
        $this->perMinute = $settings['security']['rate_limit_per_minute'];
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Get client IP address
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';
        
        // Create a unique key for this IP
        $key = "rate_limit:{$ip}";
        
        // Check if session is active
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        
        // Initialize rate limiting data if not exists
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = [
                'requests' => 0,
                'reset_time' => time() + (60 * $this->perMinute),
            ];
        }
        
        // Reset counter if time has expired
        if ($_SESSION[$key]['reset_time'] <= time()) {
            $_SESSION[$key] = [
                'requests' => 0,
                'reset_time' => time() + (60 * $this->perMinute),
            ];
        }
        
        // Increment request counter
        $_SESSION[$key]['requests']++;
        
        // Check if rate limit exceeded
        if ($_SESSION[$key]['requests'] > $this->maxRequests) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Rate limit exceeded. Please try again later.',
                'reset_time' => $_SESSION[$key]['reset_time'],
            ]));
            
            return $response
                ->withStatus(429)
                ->withHeader('Content-Type', 'application/json')
                ->withHeader('Retry-After', (string) ($_SESSION[$key]['reset_time'] - time()));
        }
        
        // Add rate limit headers to response
        $response = $handler->handle($request);
        
        return $response
            ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
            ->withHeader('X-RateLimit-Remaining', (string) ($this->maxRequests - $_SESSION[$key]['requests']))
            ->withHeader('X-RateLimit-Reset', (string) $_SESSION[$key]['reset_time']);
    }
}