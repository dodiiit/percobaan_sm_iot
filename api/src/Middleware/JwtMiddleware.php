<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Container\ContainerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use IndoWater\Api\Models\User;
use PDO;

class JwtMiddleware implements MiddlewareInterface
{
    private ContainerInterface $container;
    private PDO $db;
    private array $options;

    public function __construct(ContainerInterface $container, PDO $db, array $options = [])
    {
        $this->container = $container;
        $this->db = $db;
        $this->options = array_merge([
            'path' => null,
            'ignore' => [],
            'required' => true,
            'roles' => [],
        ], $options);
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $path = $request->getUri()->getPath();
        
        // Check if path should be ignored
        if (!empty($this->options['ignore'])) {
            foreach ($this->options['ignore'] as $ignorePath) {
                if (strpos($path, $ignorePath) === 0) {
                    return $handler->handle($request);
                }
            }
        }
        
        // Check if path should be processed
        if (!empty($this->options['path'])) {
            $shouldProcess = false;
            
            foreach ((array) $this->options['path'] as $processPath) {
                if (strpos($path, $processPath) === 0) {
                    $shouldProcess = true;
                    break;
                }
            }
            
            if (!$shouldProcess) {
                return $handler->handle($request);
            }
        }
        
        // Get token from header
        $token = $this->getTokenFromHeader($request);
        
        // If token is not found and it's required, return unauthorized
        if (!$token && $this->options['required']) {
            return $this->unauthorized();
        }
        
        // If token is not found and it's not required, continue
        if (!$token && !$this->options['required']) {
            return $handler->handle($request);
        }
        
        try {
            // Decode token
            $settings = $this->container->get('settings');
            $jwtSettings = $settings['jwt'];
            
            $decoded = JWT::decode($token, new Key($jwtSettings['secret'], $jwtSettings['algorithm']));
            
            // Check if token is expired
            if ($decoded->exp < time()) {
                return $this->unauthorized('Token has expired');
            }
            
            // Get user from database
            $userModel = new User($this->db);
            $user = $userModel->findById($decoded->sub);
            
            if (!$user) {
                return $this->unauthorized('User not found');
            }
            
            // Check if user is active
            if ($user['status'] !== 'active') {
                return $this->unauthorized('User is not active');
            }
            
            // Check if user has required role
            if (!empty($this->options['roles']) && !in_array($user['role'], $this->options['roles'])) {
                return $this->forbidden('Insufficient permissions');
            }
            
            // Add user to request attributes
            $request = $request->withAttribute('user', $user);
            $request = $request->withAttribute('token', $token);
            
            // Continue with request
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->unauthorized($e->getMessage());
        }
    }

    private function getTokenFromHeader(Request $request): ?string
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (!$authHeader) {
            return null;
        }
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    private function unauthorized(string $message = 'Unauthorized'): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => $message,
        ]));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
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