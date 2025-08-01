<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Container\ContainerInterface;
use Slim\Psr7\Response;

class CsrfMiddleware implements MiddlewareInterface
{
    private string $tokenName;
    private int $tokenExpiry;
    private array $excludedRoutes;

    public function __construct(ContainerInterface $container)
    {
        $settings = $container->get('settings');
        $this->tokenName = $settings['security']['csrf_token_name'] ?? 'csrf_token';
        $this->tokenExpiry = (int) ($settings['security']['csrf_token_expiry'] ?? 3600); // 1 hour default
        $this->excludedRoutes = $settings['security']['csrf_excluded_routes'] ?? ['/api/realtime/stream', '/health', '/webhook'];
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Skip CSRF check for excluded routes
        $path = $request->getUri()->getPath();
        foreach ($this->excludedRoutes as $excludedRoute) {
            if (strpos($path, $excludedRoute) === 0) {
                return $handler->handle($request);
            }
        }

        // Skip CSRF check for GET, HEAD, OPTIONS requests
        $method = strtoupper($request->getMethod());
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'])) {
            return $handler->handle($request);
        }

        // Check if session is active
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        // Get CSRF token from request
        $requestToken = $this->getTokenFromRequest($request);
        
        // Get stored token from session
        $storedToken = $_SESSION[$this->tokenName] ?? null;
        $storedTokenExpiry = $_SESSION[$this->tokenName . '_expiry'] ?? 0;

        // Validate token
        if (!$requestToken || !$storedToken || $requestToken !== $storedToken || time() > $storedTokenExpiry) {
            $response = new Response();
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'CSRF token validation failed',
            ]));
            
            return $response
                ->withStatus(403)
                ->withHeader('Content-Type', 'application/json');
        }

        // Generate new token for next request
        $this->generateToken();
        
        return $handler->handle($request);
    }

    private function getTokenFromRequest(ServerRequestInterface $request): ?string
    {
        // Check header first
        $token = $request->getHeaderLine('X-CSRF-Token');
        if (!empty($token)) {
            return $token;
        }

        // Check form data
        $parsedBody = $request->getParsedBody();
        if (is_array($parsedBody) && isset($parsedBody[$this->tokenName])) {
            return $parsedBody[$this->tokenName];
        }

        // Check cookies
        $cookies = $request->getCookieParams();
        if (isset($cookies[$this->tokenName])) {
            return $cookies[$this->tokenName];
        }

        return null;
    }

    public function generateToken(): string
    {
        // Generate a random token
        $token = bin2hex(random_bytes(32));
        
        // Store in session
        $_SESSION[$this->tokenName] = $token;
        $_SESSION[$this->tokenName . '_expiry'] = time() + $this->tokenExpiry;
        
        return $token;
    }
}