<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class RoleMiddleware implements MiddlewareInterface
{
    private array $roles;

    public function __construct(array $roles)
    {
        $this->roles = $roles;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $user = $request->getAttribute('user');
        
        if (!$user) {
            return $this->forbidden('User not authenticated');
        }
        
        if (!in_array($user['role'], $this->roles)) {
            return $this->forbidden('Insufficient permissions');
        }
        
        return $handler->handle($request);
    }

    private function forbidden(string $message = 'Forbidden'): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => $message,
        ]));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(403);
    }
}