<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use IndoWater\Api\Services\AuthService;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->unauthorizedResponse();
        }

        $token = $matches[1];

        try {
            $user = $this->authService->verifyToken($token);
            $request = $request->withAttribute('user', $user);
            
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorizedResponse($e->getMessage());
        }
    }

    private function unauthorizedResponse(string $message = 'Unauthorized'): Response
    {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => $message
        ]));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}