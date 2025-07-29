<?php

declare(strict_types=1);

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\HealthController;
use App\Controllers\DeviceController;
use App\Controllers\OTAController;
use App\Controllers\ProvisioningController;
use App\Controllers\DeviceCommandController;

return function (App $app) {
    // Health Check
    $app->get('/health', [HealthController::class, 'check']);

    // Device API Routes (for IoT devices)
    $app->group('/device', function (RouteCollectorProxy $group) {
        // Device registration and provisioning
        $group->post('/register_device.php', [DeviceController::class, 'registerDevice']);
        
        // Credit balance endpoint
        $group->get('/credit.php', [DeviceController::class, 'getCredit']);
        
        // Meter reading submission
        $group->post('/MeterReading.php', [DeviceController::class, 'submitMeterReading']);
        
        // Command polling and acknowledgment
        $group->get('/get_commands.php', [DeviceController::class, 'getCommands']);
        $group->post('/ack_command.php', [DeviceController::class, 'acknowledgeCommand']);
    });

    // OTA (Over-The-Air) Update Routes
    $app->group('/ota', function (RouteCollectorProxy $group) {
        // Firmware download
        $group->get('/firmware.bin', [OTAController::class, 'downloadFirmware']);
        
        // Check for updates
        $group->get('/check', [OTAController::class, 'checkUpdate']);
        
        // Report update status
        $group->post('/status', [OTAController::class, 'reportStatus']);
        
        // Upload firmware (admin only)
        $group->post('/upload', [OTAController::class, 'uploadFirmware']);
    });

    // Provisioning Token Management Routes
    $app->group('/provisioning', function (RouteCollectorProxy $group) {
        // Generate provisioning token
        $group->post('/generate', [ProvisioningController::class, 'generateToken']);
        
        // List provisioning tokens
        $group->get('/tokens', [ProvisioningController::class, 'listTokens']);
        
        // Revoke provisioning token
        $group->post('/revoke', [ProvisioningController::class, 'revokeToken']);
        
        // Get token details
        $group->get('/token/{token}', [ProvisioningController::class, 'getTokenDetails']);
    });

    // Device Command Routes (for remote control)
    $app->group('/device/command', function (RouteCollectorProxy $group) {
        // Valve control
        $group->post('/valve', [DeviceCommandController::class, 'controlValve']);
        
        // Configuration update
        $group->post('/config', [DeviceCommandController::class, 'updateConfig']);
        
        // Set unlock status
        $group->post('/unlock', [DeviceCommandController::class, 'setUnlockStatus']);
        
        // Get command history
        $group->get('/history', [DeviceCommandController::class, 'getCommandHistory']);
        
        // Cancel pending command
        $group->post('/cancel', [DeviceCommandController::class, 'cancelCommand']);
    });

    // API Routes (for web/mobile applications)
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Placeholder for future web API endpoints
        $group->get('/info', function ($request, $response) {
            return $response->withJson([
                'status' => 'success',
                'message' => 'IndoWater API v1.0',
                'endpoints' => [
                    'device' => '/device/*',
                    'ota' => '/ota/*',
                    'provisioning' => '/provisioning/*',
                    'commands' => '/device/command/*'
                ]
            ]);
        });
    });

    // Fallback for undefined routes
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        return $response->withJson([
            'status' => 'error',
            'message' => 'Route not found',
        ], 404);
    });
};