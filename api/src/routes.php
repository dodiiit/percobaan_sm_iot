<?php

use App\Controllers\DeviceController;
use App\Controllers\DeviceCommandController;
use App\Controllers\HealthController;
use App\Controllers\OTAController;
use App\Controllers\ProvisioningController;
use App\Controllers\PaymentGatewayController;
use App\Controllers\PaymentController;
use App\Middleware\AuthMiddleware;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // Health check route (public)
    $app->get('/health', HealthController::class . ':check');
    
    // API v1 routes
    $app->group('/v1', function (RouteCollectorProxy $group) {
        // Public routes
        
        // Device provisioning routes
        $group->post('/provisioning/register', ProvisioningController::class . ':registerDevice');
        $group->post('/provisioning/token', ProvisioningController::class . ':getToken');
        $group->post('/provisioning/refresh', ProvisioningController::class . ':refreshToken');
        
        // Payment notification webhooks (public)
        $group->post('/payments/notification/{gateway}', PaymentController::class . ':handleNotification');
        
        // Protected routes
        $group->group('', function (RouteCollectorProxy $protectedGroup) {
            // Device routes
            $protectedGroup->get('/devices', DeviceController::class . ':getAllDevices');
            $protectedGroup->get('/devices/{id}', DeviceController::class . ':getDeviceById');
            $protectedGroup->post('/devices', DeviceController::class . ':createDevice');
            $protectedGroup->put('/devices/{id}', DeviceController::class . ':updateDevice');
            $protectedGroup->delete('/devices/{id}', DeviceController::class . ':deleteDevice');
            
            // Device credit routes
            $protectedGroup->get('/devices/{id}/credit', DeviceController::class . ':getDeviceCredit');
            $protectedGroup->post('/devices/{id}/credit', DeviceController::class . ':addDeviceCredit');
            
            // Device meter reading routes
            $protectedGroup->get('/devices/{id}/readings', DeviceController::class . ':getDeviceReadings');
            $protectedGroup->post('/devices/{id}/readings', DeviceController::class . ':addDeviceReading');
            
            // Device command routes
            $protectedGroup->get('/devices/{id}/commands', DeviceCommandController::class . ':getDeviceCommands');
            $protectedGroup->post('/devices/{id}/commands', DeviceCommandController::class . ':createDeviceCommand');
            $protectedGroup->get('/devices/{id}/commands/{commandId}', DeviceCommandController::class . ':getDeviceCommandById');
            
            // OTA update routes
            $protectedGroup->get('/ota/firmware', OTAController::class . ':getLatestFirmware');
            $protectedGroup->post('/ota/firmware', OTAController::class . ':uploadFirmware');
            $protectedGroup->get('/ota/check', OTAController::class . ':checkForUpdates');
            
            // Payment gateway routes
            $protectedGroup->get('/payment-gateways', PaymentGatewayController::class . ':getAll');
            $protectedGroup->get('/payment-gateways/{id}', PaymentGatewayController::class . ':getById');
            $protectedGroup->post('/payment-gateways', PaymentGatewayController::class . ':create');
            $protectedGroup->put('/payment-gateways/{id}', PaymentGatewayController::class . ':update');
            $protectedGroup->delete('/payment-gateways/{id}', PaymentGatewayController::class . ':delete');
            $protectedGroup->get('/payment-gateways/{id}/test', PaymentGatewayController::class . ':testConnection');
            $protectedGroup->get('/payment-gateways-available', PaymentGatewayController::class . ':getAvailableGateways');
            
            // Payment routes
            $protectedGroup->get('/payments', PaymentController::class . ':getAll');
            $protectedGroup->get('/payments/{id}', PaymentController::class . ':getById');
            $protectedGroup->post('/payments', PaymentController::class . ':createTransaction');
            $protectedGroup->get('/payments/{id}/status', PaymentController::class . ':getStatus');
            $protectedGroup->post('/payments/{id}/cancel', PaymentController::class . ':cancelPayment');
            
        })->add(new AuthMiddleware($app->getContainer()));
    });
    
    // Legacy API routes for device compatibility
    $app->group('/api', function (RouteCollectorProxy $group) {
        // Device routes
        $group->post('/device/register.php', DeviceController::class . ':registerDeviceLegacy');
        $group->post('/device/credit.php', DeviceController::class . ':getDeviceCreditLegacy');
        $group->post('/device/MeterReading.php', DeviceController::class . ':addDeviceReadingLegacy');
        $group->post('/device/command.php', DeviceCommandController::class . ':getDeviceCommandsLegacy');
        $group->post('/device/command_ack.php', DeviceCommandController::class . ':acknowledgeCommandLegacy');
        
        // OTA routes
        $group->post('/ota/check.php', OTAController::class . ':checkForUpdatesLegacy');
        $group->post('/ota/download.php', OTAController::class . ':downloadFirmwareLegacy');
    });
};