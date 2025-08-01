<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Log\LoggerInterface;

class LoggerMiddleware implements MiddlewareInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $start = microtime(true);
        
        // Get request details
        $method = $request->getMethod();
        $uri = $request->getUri()->getPath();
        $query = $request->getUri()->getQuery();
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';
        $userAgent = $request->getHeaderLine('User-Agent');
        
        // Log request
        $this->logger->info("Request: {$method} {$uri}" . ($query ? "?{$query}" : ''), [
            'method' => $method,
            'uri' => $uri,
            'query' => $query,
            'ip' => $ip,
            'user_agent' => $userAgent,
        ]);
        
        // Handle request
        $response = $handler->handle($request);
        
        // Calculate execution time
        $time = microtime(true) - $start;
        
        // Log response
        $this->logger->info("Response: {$response->getStatusCode()} in {$time}s", [
            'status' => $response->getStatusCode(),
            'time' => $time,
        ]);
        
        return $response;
    }
}