<?php

declare(strict_types=1);

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use IndoWater\Api\Controllers\AuthController;
use IndoWater\Api\Controllers\UserController;
use IndoWater\Api\Controllers\ClientController;
use IndoWater\Api\Controllers\CustomerController;
use IndoWater\Api\Controllers\PropertyController;
use IndoWater\Api\Controllers\MeterController;
use IndoWater\Api\Controllers\PaymentController;
use IndoWater\Api\Controllers\CreditController;
use IndoWater\Api\Controllers\ReportController;
use IndoWater\Api\Controllers\NotificationController;
use IndoWater\Api\Controllers\DashboardController;
use IndoWater\Api\Controllers\SettingController;
use IndoWater\Api\Controllers\WebhookController;
use IndoWater\Api\Controllers\HealthController;

return function (App $app) {
    // Health Check
    $app->get('/health', [HealthController::class, 'check']);

    // API Routes
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Auth Routes
        $group->group('/auth', function (RouteCollectorProxy $group) {
            $group->post('/login', [AuthController::class, 'login']);
            $group->post('/register', [AuthController::class, 'register']);
            $group->post('/logout', [AuthController::class, 'logout']);
            $group->post('/refresh', [AuthController::class, 'refresh']);
            $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
            $group->post('/reset-password', [AuthController::class, 'resetPassword']);
            $group->get('/verify-email/{token}', [AuthController::class, 'verifyEmail']);
            $group->post('/resend-verification', [AuthController::class, 'resendVerification']);
        });

        // User Routes
        $group->group('/users', function (RouteCollectorProxy $group) {
            // Routes accessible only by superadmin
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [UserController::class, 'index']);
                $group->get('/{id}', [UserController::class, 'show']);
                $group->post('', [UserController::class, 'store']);
                $group->put('/{id}', [UserController::class, 'update']);
                $group->delete('/{id}', [UserController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin']));
            
            // Routes accessible by any authenticated user
            $group->get('/me', [UserController::class, 'me']);
            $group->put('/me', [UserController::class, 'updateProfile']);
            $group->put('/me/password', [UserController::class, 'updatePassword']);
        });

        // Client Routes
        $group->group('/clients', function (RouteCollectorProxy $group) {
            // Routes accessible only by superadmin
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [ClientController::class, 'index']);
                $group->post('', [ClientController::class, 'store']);
                $group->put('/{id}/activate', [ClientController::class, 'activate']);
                $group->put('/{id}/deactivate', [ClientController::class, 'deactivate']);
                $group->delete('/{id}', [ClientController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin']));
            
            // Routes accessible by superadmin and client (with appropriate checks in controller)
            $group->get('/{id}', [ClientController::class, 'show']);
            $group->put('/{id}', [ClientController::class, 'update']);
            $group->get('/{id}/properties', [ClientController::class, 'properties']);
            $group->get('/{id}/customers', [ClientController::class, 'customers']);
            $group->get('/{id}/meters', [ClientController::class, 'meters']);
            $group->get('/{id}/payments', [ClientController::class, 'payments']);
            $group->get('/{id}/reports', [ClientController::class, 'reports']);
            $group->get('/{id}/invoices', [ClientController::class, 'invoices']);
        });

        // Customer Routes
        $group->group('/customers', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [CustomerController::class, 'index']);
                $group->post('', [CustomerController::class, 'store']);
                $group->put('/{id}/activate', [CustomerController::class, 'activate']);
                $group->put('/{id}/deactivate', [CustomerController::class, 'deactivate']);
                $group->delete('/{id}', [CustomerController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users (with appropriate checks in controller)
            $group->get('/{id}', [CustomerController::class, 'show']);
            $group->put('/{id}', [CustomerController::class, 'update']);
            $group->get('/{id}/meters', [CustomerController::class, 'meters']);
            $group->get('/{id}/payments', [CustomerController::class, 'payments']);
            $group->get('/{id}/credits', [CustomerController::class, 'credits']);
            $group->get('/{id}/consumption', [CustomerController::class, 'consumption']);
            $group->get('/{id}/notifications', [CustomerController::class, 'notifications']);
        });

        // Property Routes
        $group->group('/properties', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [PropertyController::class, 'index']);
                $group->post('', [PropertyController::class, 'store']);
                $group->put('/{id}', [PropertyController::class, 'update']);
                $group->delete('/{id}', [PropertyController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users (with appropriate checks in controller)
            $group->get('/{id}', [PropertyController::class, 'show']);
            $group->get('/{id}/meters', [PropertyController::class, 'meters']);
            $group->get('/{id}/customers', [PropertyController::class, 'customers']);
        });

        // Meter Routes
        $group->group('/meters', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [MeterController::class, 'index']);
                $group->post('', [MeterController::class, 'store']);
                $group->put('/{id}', [MeterController::class, 'update']);
                $group->delete('/{id}', [MeterController::class, 'delete']);
                $group->post('/{id}/ota', [MeterController::class, 'ota']);
                $group->post('/{id}/control', [MeterController::class, 'control']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users (with appropriate checks in controller)
            $group->get('/{id}', [MeterController::class, 'show']);
            $group->get('/{id}/consumption', [MeterController::class, 'consumption']);
            $group->get('/{id}/credits', [MeterController::class, 'credits']);
            $group->post('/{id}/topup', [MeterController::class, 'topup']);
            $group->get('/{id}/status', [MeterController::class, 'status']);
        });

        // Payment Routes
        $group->group('/payments', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [PaymentController::class, 'index']);
                $group->put('/{id}', [PaymentController::class, 'update']);
                $group->delete('/{id}', [PaymentController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users (with appropriate checks in controller)
            $group->get('/{id}', [PaymentController::class, 'show']);
            $group->post('', [PaymentController::class, 'store']);
            $group->post('/midtrans', [PaymentController::class, 'midtrans']);
            $group->post('/doku', [PaymentController::class, 'doku']);
            $group->get('/{id}/receipt', [PaymentController::class, 'receipt']);
        });

        // Credit Routes
        $group->group('/credits', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [CreditController::class, 'index']);
                $group->put('/{id}', [CreditController::class, 'update']);
                $group->delete('/{id}', [CreditController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users (with appropriate checks in controller)
            $group->get('/{id}', [CreditController::class, 'show']);
            $group->post('', [CreditController::class, 'store']);
            $group->get('/denominations', [CreditController::class, 'denominations']);
        });

        // Report Routes
        $group->group('/reports', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin only
            $group->group('/admin', function (RouteCollectorProxy $group) {
                $group->get('/service-fees', [ReportController::class, 'serviceFees']);
                $group->get('/all-clients', [ReportController::class, 'allClients']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin']));
            
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('/revenue', [ReportController::class, 'revenue']);
                $group->get('/consumption', [ReportController::class, 'consumption']);
                $group->get('/customers', [ReportController::class, 'customers']);
                $group->get('/payments', [ReportController::class, 'payments']);
                $group->get('/credits', [ReportController::class, 'credits']);
                $group->get('/export/{type}', [ReportController::class, 'export']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
        });

        // Notification Routes
        $group->group('/notifications', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin and client
            $group->group('/admin', function (RouteCollectorProxy $group) {
                $group->post('', [NotificationController::class, 'store']);
                $group->put('/{id}', [NotificationController::class, 'update']);
                $group->delete('/{id}', [NotificationController::class, 'delete']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
            
            // Routes accessible by all authenticated users
            $group->get('', [NotificationController::class, 'index']);
            $group->get('/{id}', [NotificationController::class, 'show']);
            $group->put('/{id}/read', [NotificationController::class, 'markAsRead']);
            $group->put('/read-all', [NotificationController::class, 'markAllAsRead']);
        });

        // Dashboard Routes
        $group->group('/dashboard', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin only
            $group->group('/superadmin', function (RouteCollectorProxy $group) {
                $group->get('', [DashboardController::class, 'superadmin']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin']));
            
            // Routes accessible by client only
            $group->group('/client', function (RouteCollectorProxy $group) {
                $group->get('', [DashboardController::class, 'client']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['client']));
            
            // Routes accessible by customer only
            $group->group('/customer', function (RouteCollectorProxy $group) {
                $group->get('', [DashboardController::class, 'customer']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['customer']));
            
            // Routes accessible by all authenticated users
            $group->get('/stats', [DashboardController::class, 'stats']);
            $group->get('/charts', [DashboardController::class, 'charts']);
        });

        // Setting Routes
        $group->group('/settings', function (RouteCollectorProxy $group) {
            // Routes accessible by superadmin only
            $group->group('/global', function (RouteCollectorProxy $group) {
                $group->get('', [SettingController::class, 'globalSettings']);
                $group->put('', [SettingController::class, 'updateGlobalSettings']);
                $group->get('/service-fees', [SettingController::class, 'serviceFees']);
                $group->put('/service-fees', [SettingController::class, 'updateServiceFees']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin']));
            
            // Routes accessible by superadmin and client
            $group->group('', function (RouteCollectorProxy $group) {
                $group->get('', [SettingController::class, 'index']);
                $group->put('', [SettingController::class, 'update']);
                $group->get('/payment-gateways', [SettingController::class, 'paymentGateways']);
                $group->put('/payment-gateways', [SettingController::class, 'updatePaymentGateways']);
                $group->get('/notifications', [SettingController::class, 'notifications']);
                $group->put('/notifications', [SettingController::class, 'updateNotifications']);
            })->add(new \IndoWater\Api\Middleware\RoleMiddleware(['superadmin', 'client']));
        });
    });

    // Webhook Routes
    $app->group('/webhooks', function (RouteCollectorProxy $group) {
        $group->post('/midtrans', [WebhookController::class, 'midtrans']);
        $group->post('/doku', [WebhookController::class, 'doku']);
        $group->post('/meter', [WebhookController::class, 'meter']);
    });

    // Fallback for undefined routes
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        return $response->withJson([
            'status' => 'error',
            'message' => 'Route not found',
        ], 404);
    });
};