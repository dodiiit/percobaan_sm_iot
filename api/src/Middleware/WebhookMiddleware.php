<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Log\LoggerInterface;

class WebhookMiddleware
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $startTime = microtime(true);
        $method = $request->getMethod();
        $uri = $request->getUri()->getPath();
        $clientIp = $this->getClientIp($request);

        // Log incoming webhook request
        $this->logger->info('Webhook request received', [
            'method' => $method,
            'uri' => $uri,
            'client_ip' => $clientIp,
            'user_agent' => $request->getHeaderLine('User-Agent'),
            'content_type' => $request->getHeaderLine('Content-Type'),
            'content_length' => $request->getHeaderLine('Content-Length')
        ]);

        try {
            // Process the request
            $response = $handler->handle($request);
            
            $processingTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Log successful webhook processing
            $this->logger->info('Webhook processed successfully', [
                'uri' => $uri,
                'status_code' => $response->getStatusCode(),
                'processing_time_ms' => $processingTime,
                'client_ip' => $clientIp
            ]);

            return $response;

        } catch (\Exception $e) {
            $processingTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Log webhook processing error
            $this->logger->error('Webhook processing failed', [
                'uri' => $uri,
                'client_ip' => $clientIp,
                'processing_time_ms' => $processingTime,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return a generic error response
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Webhook processing failed'
            ]));
            
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

    /**
     * Get client IP address from request
     */
    private function getClientIp(Request $request): string
    {
        $serverParams = $request->getServerParams();
        
        // Check for IP from various headers (in order of preference)
        $ipHeaders = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_REAL_IP',            // Nginx
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];

        foreach ($ipHeaders as $header) {
            if (!empty($serverParams[$header])) {
                $ip = $serverParams[$header];
                // Handle comma-separated IPs (take the first one)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $serverParams['REMOTE_ADDR'] ?? 'unknown';
    }
}