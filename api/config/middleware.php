<?php

declare(strict_types=1);

use Slim\App;
use Slim\Views\TwigMiddleware;
use Slim\Middleware\ContentLengthMiddleware;
use IndoWater\Api\Middleware\SimpleJwtMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use IndoWater\Api\Middleware\CorsMiddleware;
use IndoWater\Api\Middleware\JsonBodyParserMiddleware;
use IndoWater\Api\Middleware\SessionMiddleware;
use IndoWater\Api\Middleware\RateLimitMiddleware;
use IndoWater\Api\Middleware\LoggerMiddleware;
use IndoWater\Api\Middleware\SecurityHeadersMiddleware;
use IndoWater\Api\Middleware\CacheMiddleware;

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

    // Add cache middleware (before authentication)
    if ($settings['cache']['enabled']) {
        $app->add(CacheMiddleware::class);
    }

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
    $app->add(new SimpleJwtMiddleware([
        'path' => '/api',
        'ignore' => [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/device/register_device.php',
            '/api/device/credit.php',
            '/api/device/MeterReading.php',
            '/api/device/get_commands.php',
            '/api/device/ack_command.php',
        ],
        'secret' => $settings['jwt']['secret'],
        'algorithm' => 'HS256',
    ]));
};