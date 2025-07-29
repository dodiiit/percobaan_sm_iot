<?php

declare(strict_types=1);

use Slim\App;
use Slim\Views\TwigMiddleware;
use Slim\Middleware\ContentLengthMiddleware;
use Tuupola\Middleware\JwtAuthentication;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use IndoWater\Api\Middleware\CorsMiddleware;
use IndoWater\Api\Middleware\JsonBodyParserMiddleware;
use IndoWater\Api\Middleware\SessionMiddleware;
use IndoWater\Api\Middleware\RateLimitMiddleware;
use IndoWater\Api\Middleware\LoggerMiddleware;
use IndoWater\Api\Middleware\SecurityHeadersMiddleware;

return function (App $app) {
    $container = $app->getContainer();
    $settings = $container->get('settings');

    // Parse json, form data and xml
    $app->addBodyParsingMiddleware();

    // Add Content-Length header to response
    $app->add(new ContentLengthMiddleware());

    // Add CORS middleware
    $app->add(CorsMiddleware::class);

    // Add JSON body parser middleware
    $app->add(JsonBodyParserMiddleware::class);

    // Add session middleware
    $app->add(SessionMiddleware::class);

    // Add rate limiting middleware
    $app->add(RateLimitMiddleware::class);

    // Add logger middleware
    $app->add(LoggerMiddleware::class);

    // Add security headers middleware
    $app->add(SecurityHeadersMiddleware::class);

    // Add Twig middleware
    $app->add(TwigMiddleware::class);

    // Add JWT authentication middleware
    $app->add(new JwtAuthentication([
        'path' => '/api',
        'ignore' => [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
        ],
        'secret' => $settings['jwt']['secret'],
        'algorithm' => 'HS256',
        'secure' => $settings['app']['env'] !== 'development',
        'relaxed' => ['localhost', '127.0.0.1'],
        'error' => function (Response $response, array $arguments) {
            $data = [
                'status' => 'error',
                'message' => $arguments['message'],
            ];
            $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        },
        'before' => function (Request $request, $arguments) {
            return $request->withAttribute('jwt', $arguments['decoded']);
        },
    ]));
};