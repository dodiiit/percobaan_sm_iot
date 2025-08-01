<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Container\ContainerInterface;

class SessionMiddleware implements MiddlewareInterface
{
    private array $sessionSettings;

    public function __construct(ContainerInterface $container)
    {
        $settings = $container->get('settings');
        $this->sessionSettings = $settings['session'];
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            $sessionName = 'indowater_session';
            $lifetime = $this->sessionSettings['lifetime'] * 60; // Convert minutes to seconds
            
            session_name($sessionName);
            session_set_cookie_params([
                'lifetime' => $lifetime,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }

        return $handler->handle($request);
    }
}