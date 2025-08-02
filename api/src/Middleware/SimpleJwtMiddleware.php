<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class SimpleJwtMiddleware implements MiddlewareInterface
{
    private array $settings;

    public function __construct(array $settings)
    {
        $this->settings = $settings;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $uri = $request->getUri()->getPath();
        
        // Check if this path should be ignored
        foreach ($this->settings['ignore'] as $ignorePath) {
            if (strpos($uri, $ignorePath) === 0) {
                return $handler->handle($request);
            }
        }

        // Check if this path requires JWT
        if (strpos($uri, $this->settings['path']) !== 0) {
            return $handler->handle($request);
        }

        // Get JWT token from Authorization header
        $authorization = $request->getHeaderLine('Authorization');
        
        if (empty($authorization)) {
            return $this->unauthorizedResponse('Token not provided');
        }

        if (!preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
            return $this->unauthorizedResponse('Invalid token format');
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key($this->settings['secret'], $this->settings['algorithm']));
            $request = $request->withAttribute('jwt', $decoded);
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorizedResponse('Invalid token: ' . $e->getMessage());
        }
    }

    private function unauthorizedResponse(string $message): Response
    {
        $response = new SlimResponse();
        $data = [
            'status' => 'error',
            'message' => $message,
        ];
        
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}