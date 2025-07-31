<?php

declare(strict_types=1);

namespace IndoWater\Api;

use Slim\Factory\AppFactory;
use Slim\App as SlimApp;
use DI\Container;
use IndoWater\Api\Database\Connection;
use IndoWater\Api\Models\User;
use IndoWater\Api\Models\Client;
use IndoWater\Api\Models\Customer;
use IndoWater\Api\Models\Meter;
use IndoWater\Api\Services\AuthService;
use IndoWater\Api\Services\EmailService;
use IndoWater\Api\Services\PaymentService;
use IndoWater\Api\Services\RealtimeService;
use IndoWater\Api\Controllers\AuthController;
use IndoWater\Api\Controllers\UserController;
use IndoWater\Api\Controllers\MeterController;
use IndoWater\Api\Controllers\RealtimeController;
use IndoWater\Api\Middleware\AuthMiddleware;
use IndoWater\Api\Middleware\CorsMiddleware;
use IndoWater\Api\Middleware\RateLimitMiddleware;

class App
{
    private SlimApp $app;
    private Container $container;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->container = new Container();
        $this->setupDependencies();
        
        AppFactory::setContainer($this->container);
        $this->app = AppFactory::create();
        
        $this->setupMiddleware();
        $this->setupRoutes();
    }

    private function setupDependencies(): void
    {
        // Database
        $this->container->set('db', function () {
            return Connection::getInstance([
                'host' => $this->config['db_host'],
                'port' => $this->config['db_port'],
                'database' => $this->config['db_database'],
                'username' => $this->config['db_username'],
                'password' => $this->config['db_password']
            ]);
        });

        // Models
        $this->container->set(User::class, function ($container) {
            return new User($container->get('db'));
        });

        $this->container->set(Client::class, function ($container) {
            return new Client($container->get('db'));
        });

        $this->container->set(Customer::class, function ($container) {
            return new Customer($container->get('db'));
        });

        $this->container->set(Meter::class, function ($container) {
            return new Meter($container->get('db'));
        });

        // Services
        $this->container->set(AuthService::class, function ($container) {
            return new AuthService(
                $container->get(User::class),
                $this->config['jwt_secret'],
                (int) $this->config['jwt_ttl'],
                (int) $this->config['jwt_refresh_ttl']
            );
        });

        $this->container->set(EmailService::class, function () {
            return new EmailService([
                'mail_host' => $this->config['mail_host'],
                'mail_port' => $this->config['mail_port'],
                'mail_username' => $this->config['mail_username'],
                'mail_password' => $this->config['mail_password'],
                'mail_encryption' => $this->config['mail_encryption'],
                'mail_from_address' => $this->config['mail_from_address'],
                'mail_from_name' => $this->config['mail_from_name'],
                'app_url' => $this->config['app_url']
            ]);
        });

        $this->container->set(RealtimeService::class, function ($container) {
            return new RealtimeService(
                $container->get(Meter::class),
                $container->get(Customer::class)
            );
        });

        // Controllers
        $this->container->set(AuthController::class, function ($container) {
            return new AuthController(
                $container->get(AuthService::class),
                $container->get(EmailService::class)
            );
        });

        $this->container->set(UserController::class, function ($container) {
            return new UserController($container->get(User::class));
        });

        $this->container->set(MeterController::class, function ($container) {
            return new MeterController(
                $container->get(Meter::class),
                $container->get(RealtimeService::class)
            );
        });

        $this->container->set(RealtimeController::class, function ($container) {
            return new RealtimeController($container->get(RealtimeService::class));
        });

        // Middleware
        $this->container->set(AuthMiddleware::class, function ($container) {
            return new AuthMiddleware($container->get(AuthService::class));
        });

        $this->container->set(CorsMiddleware::class, function () {
            return new CorsMiddleware([
                'allowed_origins' => explode(',', $this->config['cors_allowed_origins']),
                'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With']
            ]);
        });

        $this->container->set(RateLimitMiddleware::class, function () {
            return new RateLimitMiddleware(
                (int) $this->config['rate_limit_requests'],
                (int) $this->config['rate_limit_per_minute']
            );
        });
    }

    private function setupMiddleware(): void
    {
        // Add error middleware
        $this->app->addErrorMiddleware(
            $this->config['app_debug'] === 'true',
            true,
            true
        );

        // Add CORS middleware
        $this->app->add($this->container->get(CorsMiddleware::class));

        // Add rate limiting middleware
        $this->app->add($this->container->get(RateLimitMiddleware::class));
    }

    private function setupRoutes(): void
    {
        $authMiddleware = $this->container->get(AuthMiddleware::class);

        // Health check
        $this->app->get('/health', function ($request, $response) {
            $response->getBody()->write(json_encode([
                'status' => 'ok',
                'timestamp' => date('Y-m-d H:i:s'),
                'version' => '1.0.0'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        });

        // Auth routes
        $this->app->group('/auth', function ($group) {
            $group->post('/login', [AuthController::class, 'login']);
            $group->post('/register', [AuthController::class, 'register']);
            $group->post('/logout', [AuthController::class, 'logout']);
            $group->post('/refresh', [AuthController::class, 'refresh']);
            $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
            $group->post('/reset-password', [AuthController::class, 'resetPassword']);
            $group->get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
            $group->post('/resend-verification', [AuthController::class, 'resendVerification']);
        });

        // Protected routes
        $this->app->group('/api', function ($group) {
            // User routes
            $group->group('/users', function ($group) {
                $group->get('', [UserController::class, 'index']);
                $group->get('/me', [UserController::class, 'me']);
                $group->put('/me', [UserController::class, 'updateProfile']);
                $group->put('/me/password', [UserController::class, 'updatePassword']);
                $group->get('/{id}', [UserController::class, 'show']);
                $group->post('', [UserController::class, 'store']);
                $group->put('/{id}', [UserController::class, 'update']);
                $group->delete('/{id}', [UserController::class, 'delete']);
            });

            // Meter routes
            $group->group('/meters', function ($group) {
                $group->get('', [MeterController::class, 'index']);
                $group->get('/{id}', [MeterController::class, 'show']);
                $group->post('', [MeterController::class, 'store']);
                $group->put('/{id}', [MeterController::class, 'update']);
                $group->delete('/{id}', [MeterController::class, 'delete']);
                $group->get('/{id}/consumption', [MeterController::class, 'consumption']);
                $group->get('/{id}/credits', [MeterController::class, 'credits']);
                $group->post('/{id}/topup', [MeterController::class, 'topup']);
                $group->get('/{id}/status', [MeterController::class, 'status']);
                $group->post('/{id}/ota', [MeterController::class, 'ota']);
                $group->post('/{id}/control', [MeterController::class, 'control']);
            });

            // Real-time routes
            $group->group('/realtime', function ($group) {
                $group->get('/stream/meters', [RealtimeController::class, 'streamMeterData']);
                $group->get('/stream/notifications', [RealtimeController::class, 'streamNotifications']);
                $group->get('/poll/updates', [RealtimeController::class, 'pollUpdates']);
                $group->get('/meter/{meter_id}/status', [RealtimeController::class, 'meterStatus']);
            });

        })->add($authMiddleware);

        // Webhook routes (no auth required)
        $this->app->post('/webhook/realtime', [RealtimeController::class, 'webhook']);
    }

    public function getApp(): SlimApp
    {
        return $this->app;
    }

    public function run(): void
    {
        $this->app->run();
    }
}