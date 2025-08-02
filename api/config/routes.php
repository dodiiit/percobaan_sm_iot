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
use IndoWater\Api\Controllers\ValveController;
use IndoWater\Api\Controllers\PaymentController;
use IndoWater\Api\Controllers\WebhookController;
use IndoWater\Api\Controllers\CreditController;
use IndoWater\Api\Controllers\ReportController;
use IndoWater\Api\Controllers\NotificationController;
use IndoWater\Api\Controllers\DashboardController;
use IndoWater\Api\Controllers\SettingController;
use IndoWater\Api\Controllers\HealthController;
use IndoWater\Api\Controllers\CacheController;
use IndoWater\Api\Middleware\WebhookMiddleware;

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
            $group->get('', [UserController::class, 'index']);
            $group->get('/{id}', [UserController::class, 'show']);
            $group->post('', [UserController::class, 'store']);
            $group->put('/{id}', [UserController::class, 'update']);
            $group->delete('/{id}', [UserController::class, 'delete']);
            $group->get('/me', [UserController::class, 'me']);
            $group->put('/me', [UserController::class, 'updateProfile']);
            $group->put('/me/password', [UserController::class, 'updatePassword']);
        });

        // Client Routes
        $group->group('/clients', function (RouteCollectorProxy $group) {
            $group->get('', [ClientController::class, 'index']);
            $group->get('/{id}', [ClientController::class, 'show']);
            $group->post('', [ClientController::class, 'store']);
            $group->put('/{id}', [ClientController::class, 'update']);
            $group->delete('/{id}', [ClientController::class, 'delete']);
            $group->put('/{id}/activate', [ClientController::class, 'activate']);
            $group->put('/{id}/deactivate', [ClientController::class, 'deactivate']);
            $group->get('/{id}/properties', [ClientController::class, 'properties']);
            $group->get('/{id}/customers', [ClientController::class, 'customers']);
            $group->get('/{id}/meters', [ClientController::class, 'meters']);
            $group->get('/{id}/payments', [ClientController::class, 'payments']);
            $group->get('/{id}/reports', [ClientController::class, 'reports']);
            $group->get('/{id}/invoices', [ClientController::class, 'invoices']);
        });

        // Customer Routes
        $group->group('/customers', function (RouteCollectorProxy $group) {
            $group->get('', [CustomerController::class, 'index']);
            $group->get('/{id}', [CustomerController::class, 'show']);
            $group->post('', [CustomerController::class, 'store']);
            $group->put('/{id}', [CustomerController::class, 'update']);
            $group->delete('/{id}', [CustomerController::class, 'delete']);
            $group->put('/{id}/activate', [CustomerController::class, 'activate']);
            $group->put('/{id}/deactivate', [CustomerController::class, 'deactivate']);
            $group->get('/{id}/meters', [CustomerController::class, 'meters']);
            $group->get('/{id}/payments', [CustomerController::class, 'payments']);
            $group->get('/{id}/credits', [CustomerController::class, 'credits']);
            $group->get('/{id}/consumption', [CustomerController::class, 'consumption']);
            $group->get('/{id}/notifications', [CustomerController::class, 'notifications']);
        });

        // Property Routes
        $group->group('/properties', function (RouteCollectorProxy $group) {
            $group->get('', [PropertyController::class, 'index']);
            $group->get('/{id}', [PropertyController::class, 'show']);
            $group->post('', [PropertyController::class, 'store']);
            $group->put('/{id}', [PropertyController::class, 'update']);
            $group->delete('/{id}', [PropertyController::class, 'delete']);
            $group->get('/{id}/meters', [PropertyController::class, 'meters']);
            $group->get('/{id}/customers', [PropertyController::class, 'customers']);
        });

        // Meter Routes
        $group->group('/meters', function (RouteCollectorProxy $group) {
            $group->get('', [MeterController::class, 'index']);
            $group->get('/{id}', [MeterController::class, 'show']);
            $group->post('', [MeterController::class, 'store']);
            $group->put('/{id}', [MeterController::class, 'update']);
            $group->delete('/{id}', [MeterController::class, 'delete']);
            $group->get('/{id}/consumption', [MeterController::class, 'consumption']);
            $group->get('/{id}/credits', [MeterController::class, 'credits']);
            $group->post('/{id}/topup', [MeterController::class, 'topup']);
            $group->post('/{id}/ota', [MeterController::class, 'ota']);
            $group->post('/{id}/control', [MeterController::class, 'control']);
            $group->get('/{id}/status', [MeterController::class, 'status']);
            $group->get('/{id}/balance', [MeterController::class, 'balance']);
        });

        // Valve Control Routes
        $group->group('/valves', function (RouteCollectorProxy $group) {
            // Valve management
            $group->get('', [ValveController::class, 'index']);
            $group->get('/overview', [ValveController::class, 'overview']);
            $group->get('/statistics', [ValveController::class, 'statistics']);
            $group->get('/failed-commands', [ValveController::class, 'failedCommands']);
            $group->get('/{id}', [ValveController::class, 'show']);
            $group->post('', [ValveController::class, 'store']);
            $group->put('/{id}', [ValveController::class, 'update']);
            $group->delete('/{id}', [ValveController::class, 'delete']);
            
            // Valve control operations
            $group->post('/{id}/open', [ValveController::class, 'open']);
            $group->post('/{id}/close', [ValveController::class, 'close']);
            $group->post('/{id}/partial-open', [ValveController::class, 'partialOpen']);
            $group->post('/{id}/emergency-close', [ValveController::class, 'emergencyClose']);
            $group->post('/{id}/status-check', [ValveController::class, 'status']);
            
            // Valve monitoring
            $group->get('/{id}/commands', [ValveController::class, 'commands']);
            $group->get('/{id}/history', [ValveController::class, 'history']);
            $group->get('/{id}/alerts', [ValveController::class, 'alerts']);
            
            // Manual override
            $group->post('/{id}/enable-override', [ValveController::class, 'enableOverride']);
            $group->post('/{id}/disable-override', [ValveController::class, 'disableOverride']);
            
            // Alert management
            $group->post('/alerts/{alert_id}/acknowledge', [ValveController::class, 'acknowledgeAlert']);
            $group->post('/alerts/{alert_id}/resolve', [ValveController::class, 'resolveAlert']);
            
            // Bulk operations
            $group->post('/bulk-operation', [ValveController::class, 'bulkOperation']);
            
            // Device response webhook (for IoT devices)
            $group->post('/device-response', [ValveController::class, 'deviceResponse']);
        });

        // Payment Routes
        $group->group('/payments', function (RouteCollectorProxy $group) {
            $group->get('', [PaymentController::class, 'index']);
            $group->get('/{id}', [PaymentController::class, 'show']);
            $group->post('', [PaymentController::class, 'create']);
            $group->get('/{id}/status', [PaymentController::class, 'status']);
            $group->get('/summary', [PaymentController::class, 'summary']);
        });

        // Credit Routes
        $group->group('/credits', function (RouteCollectorProxy $group) {
            $group->get('', [CreditController::class, 'index']);
            $group->get('/{id}', [CreditController::class, 'show']);
            $group->post('', [CreditController::class, 'store']);
            $group->put('/{id}', [CreditController::class, 'update']);
            $group->delete('/{id}', [CreditController::class, 'delete']);
            $group->get('/denominations', [CreditController::class, 'denominations']);
        });

        // Report Routes
        $group->group('/reports', function (RouteCollectorProxy $group) {
            $group->get('/revenue', [ReportController::class, 'revenue']);
            $group->get('/consumption', [ReportController::class, 'consumption']);
            $group->get('/customers', [ReportController::class, 'customers']);
            $group->get('/payments', [ReportController::class, 'payments']);
            $group->get('/credits', [ReportController::class, 'credits']);
            $group->get('/service-fees', [ReportController::class, 'serviceFees']);
            $group->get('/export/{type}', [ReportController::class, 'export']);
        });

        // Notification Routes
        $group->group('/notifications', function (RouteCollectorProxy $group) {
            $group->get('', [NotificationController::class, 'index']);
            $group->get('/{id}', [NotificationController::class, 'show']);
            $group->post('', [NotificationController::class, 'store']);
            $group->put('/{id}', [NotificationController::class, 'update']);
            $group->delete('/{id}', [NotificationController::class, 'delete']);
            $group->put('/{id}/read', [NotificationController::class, 'markAsRead']);
            $group->put('/read-all', [NotificationController::class, 'markAllAsRead']);
        });

        // Dashboard Routes
        $group->group('/dashboard', function (RouteCollectorProxy $group) {
            $group->get('/superadmin', [DashboardController::class, 'superadmin']);
            $group->get('/client', [DashboardController::class, 'client']);
            $group->get('/customer', [DashboardController::class, 'customer']);
            $group->get('/stats', [DashboardController::class, 'stats']);
            $group->get('/charts', [DashboardController::class, 'charts']);
        });

        // Setting Routes
        $group->group('/settings', function (RouteCollectorProxy $group) {
            $group->get('', [SettingController::class, 'index']);
            $group->put('', [SettingController::class, 'update']);
            $group->get('/payment-gateways', [SettingController::class, 'paymentGateways']);
            $group->put('/payment-gateways', [SettingController::class, 'updatePaymentGateways']);
            $group->get('/service-fees', [SettingController::class, 'serviceFees']);
            $group->put('/service-fees', [SettingController::class, 'updateServiceFees']);
            $group->get('/notifications', [SettingController::class, 'notifications']);
            $group->put('/notifications', [SettingController::class, 'updateNotifications']);
        });

        // Cache Management Routes (Admin only)
        $group->group('/cache', function (RouteCollectorProxy $group) {
            $group->get('/stats', [CacheController::class, 'stats']);
            $group->get('/health', [CacheController::class, 'health']);
            $group->post('/clear', [CacheController::class, 'clear']);
            $group->post('/clear-pattern', [CacheController::class, 'clearPattern']);
            $group->post('/warmup', [CacheController::class, 'warmup']);
            $group->post('/invalidate', [CacheController::class, 'invalidate']);
            $group->get('/key/{key}', [CacheController::class, 'keyInfo']);
        });
    });

    // Webhook Routes (No authentication required)
    $app->group('/webhooks', function (RouteCollectorProxy $group) {
        // Webhook status endpoint
        $group->get('/status', [WebhookController::class, 'status']);
        
        // Payment gateway webhooks
        $group->post('/payment/{method}', [WebhookController::class, 'handlePayment']);
        
        // Legacy webhook route for backward compatibility
        $group->post('/{method}', [PaymentController::class, 'webhook']);
    })->add(WebhookMiddleware::class);

    // Fallback for undefined routes
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        return $response->withJson([
            'status' => 'error',
            'message' => 'Route not found',
        ], 404);
    });
};