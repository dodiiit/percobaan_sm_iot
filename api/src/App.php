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
use IndoWater\Api\Models\Payment;
use IndoWater\Api\Models\Property;
use IndoWater\Api\Models\PropertyDocument;
use IndoWater\Api\Models\ServiceFeePlan;
use IndoWater\Api\Models\ServiceFeeComponent;
use IndoWater\Api\Models\ServiceFeeTransaction;
use IndoWater\Api\Models\ServiceFeeInvoice;
use IndoWater\Api\Services\AuthService;
use IndoWater\Api\Services\EmailService;
use IndoWater\Api\Services\PaymentService;
use IndoWater\Api\Services\RealtimeService;
use IndoWater\Api\Services\ServiceFeeService;
use IndoWater\Api\Services\InternalMonitoringService;
use IndoWater\Api\Controllers\AuthController;
use IndoWater\Api\Controllers\UserController;
use IndoWater\Api\Controllers\MeterController;
use IndoWater\Api\Controllers\PaymentController;
use IndoWater\Api\Controllers\PropertyController;
use IndoWater\Api\Controllers\RealtimeController;
use IndoWater\Api\Controllers\TariffController;
use IndoWater\Api\Controllers\ServiceFeeController;
use IndoWater\Api\Middleware\AuthMiddleware;
use IndoWater\Api\Middleware\CorsMiddleware;
use IndoWater\Api\Middleware\CsrfMiddleware;
use IndoWater\Api\Middleware\LoggerMiddleware;
use IndoWater\Api\Middleware\RateLimitMiddleware;
use IndoWater\Api\Middleware\SecurityHeadersMiddleware;
use IndoWater\Api\Middleware\SessionMiddleware;
use IndoWater\Api\Services\EncryptionService;

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

        $this->container->set(Property::class, function ($container) {
            return new Property($container->get('db'));
        });

        $this->container->set(PropertyDocument::class, function ($container) {
            return new PropertyDocument($container->get('db'));
        });

        $this->container->set(Payment::class, function ($container) {
            return new Payment($container->get('db'));
        });
        
        $this->container->set(ServiceFeePlan::class, function ($container) {
            return new ServiceFeePlan($container->get('db'));
        });
        
        $this->container->set(ServiceFeeComponent::class, function ($container) {
            return new ServiceFeeComponent($container->get('db'));
        });
        
        $this->container->set(ServiceFeeTransaction::class, function ($container) {
            return new ServiceFeeTransaction($container->get('db'));
        });
        
        $this->container->set(ServiceFeeInvoice::class, function ($container) {
            return new ServiceFeeInvoice($container->get('db'));
        });

        // Services
        $this->container->set(EncryptionService::class, function () {
            return new EncryptionService($this->config['app_key']);
        });
        
        $this->container->set(AuthService::class, function ($container) {
            return new AuthService(
                $container->get(User::class),
                $this->config['jwt_secret'],
                (int) $this->config['jwt_ttl'],
                (int) $this->config['jwt_refresh_ttl'],
                $container->get(EncryptionService::class)
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

        $this->container->set(PaymentService::class, function ($container) {
            return new PaymentService(
                $container->get(Payment::class),
                [
                    'server_key' => $this->config['midtrans_server_key'],
                    'client_key' => $this->config['midtrans_client_key'],
                    'environment' => $this->config['midtrans_environment']
                ],
                [
                    'client_id' => $this->config['doku_client_id'],
                    'shared_key' => $this->config['doku_shared_key'],
                    'environment' => $this->config['doku_environment']
                ],
                $container->get(Meter::class),
                $container->get(EmailService::class),
                $container->get(RealtimeService::class),
                $container->get(ServiceFeeService::class)
            );
        });

        $this->container->set(RealtimeService::class, function ($container) {
            return new RealtimeService(
                $container->get(Meter::class),
                $container->get(Customer::class)
            );
        });
        
        $this->container->set(ServiceFeeService::class, function ($container) {
            return new ServiceFeeService(
                $container->get(Client::class),
                $container->get(ServiceFeePlan::class),
                $container->get(ServiceFeeComponent::class),
                $container->get(ServiceFeeTransaction::class),
                $container->get(ServiceFeeInvoice::class),
                $container->get('db')
            );
        });

        // Monitoring Service
        $this->container->set(InternalMonitoringService::class, function ($container) {
            return new InternalMonitoringService(
                $container->get('db'),
                $container->get('logger'),
                [
                    'alert_email' => $this->config['alert_email'] ?? 'admin@lingindustri.com',
                    'alert_thresholds' => [
                        'error_rate' => (int)($this->config['alert_error_rate'] ?? 10),
                        'response_time' => (int)($this->config['alert_response_time'] ?? 5000),
                        'memory_usage' => (int)($this->config['alert_memory_usage'] ?? 80),
                        'disk_usage' => (int)($this->config['alert_disk_usage'] ?? 90),
                    ],
                    'retention_days' => (int)($this->config['monitoring_retention_days'] ?? 30),
                ]
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

        $this->container->set(PaymentController::class, function ($container) {
            return new PaymentController(
                $container->get(Payment::class),
                $container->get(PaymentService::class)
            );
        });

        $this->container->set(PropertyController::class, function ($container) {
            return new PropertyController(
                $container->get(Property::class),
                $container->get(PropertyDocument::class),
                $container->get(EmailService::class),
                $container->get(RealtimeService::class)
            );
        });
        
        $this->container->set(ServiceFeeController::class, function ($container) {
            return new ServiceFeeController(
                $container->get(ServiceFeePlan::class),
                $container->get(ServiceFeeComponent::class),
                $container->get(ServiceFeeTransaction::class),
                $container->get(ServiceFeeInvoice::class),
                $container->get(ServiceFeeService::class)
            );
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

        $this->container->set(RateLimitMiddleware::class, function ($container) {
            return new RateLimitMiddleware($container);
        });
        
        $this->container->set(SecurityHeadersMiddleware::class, function ($container) {
            return new SecurityHeadersMiddleware($container);
        });
        
        $this->container->set(SessionMiddleware::class, function ($container) {
            return new SessionMiddleware($container);
        });
        
        $this->container->set(CsrfMiddleware::class, function ($container) {
            return new CsrfMiddleware($container);
        });

        $this->container->set(LoggerMiddleware::class, function ($container) {
            return new LoggerMiddleware($container->get('logger'));
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

        // Add logging middleware (first to capture all requests)
        $this->app->add($this->container->get(LoggerMiddleware::class));

        // Add security headers middleware
        $this->app->add($this->container->get(SecurityHeadersMiddleware::class));

        // Add CORS middleware
        $this->app->add($this->container->get(CorsMiddleware::class));

        // Add rate limiting middleware
        $this->app->add($this->container->get(RateLimitMiddleware::class));
        
        // Add session middleware
        $this->app->add($this->container->get(SessionMiddleware::class));
        
        // Add CSRF protection middleware
        $this->app->add($this->container->get(CsrfMiddleware::class));
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
                $group->get('/{id}/balance', [MeterController::class, 'balance']);
                $group->get('/{id}/consumption', [MeterController::class, 'consumption']);
                $group->get('/{id}/credits', [MeterController::class, 'credits']);
                $group->post('/{id}/topup', [MeterController::class, 'topup']);
                $group->get('/{id}/status', [MeterController::class, 'status']);
                $group->post('/{id}/ota', [MeterController::class, 'ota']);
                $group->post('/{id}/control', [MeterController::class, 'control']);
            });

            // Property routes
            $group->group('/properties', function ($group) {
                $group->get('', [PropertyController::class, 'index']);
                $group->get('/types', [PropertyController::class, 'getTypes']);
                $group->get('/verification-statuses', [PropertyController::class, 'getVerificationStatuses']);
                $group->get('/pending-verification', [PropertyController::class, 'pendingVerification']);
                $group->get('/statistics', [PropertyController::class, 'statistics']);
                $group->get('/{id}', [PropertyController::class, 'show']);
                $group->post('', [PropertyController::class, 'create']);
                $group->put('/{id}', [PropertyController::class, 'update']);
                $group->delete('/{id}', [PropertyController::class, 'delete']);
                $group->put('/{id}/verification-status', [PropertyController::class, 'updateVerificationStatus']);
                $group->post('/{id}/meters', [PropertyController::class, 'associateMeter']);
                $group->delete('/{id}/meters/{meter_id}', [PropertyController::class, 'dissociateMeter']);
            });

            // Payment routes
            $group->group('/payments', function ($group) {
                $group->get('', [PaymentController::class, 'index']);
                $group->get('/{id}', [PaymentController::class, 'show']);
                $group->post('', [PaymentController::class, 'store']);
                $group->put('/{id}', [PaymentController::class, 'update']);
                $group->delete('/{id}', [PaymentController::class, 'delete']);
                $group->post('/{id}/process', [PaymentController::class, 'process']);
            });

            // Real-time routes
            $group->group('/realtime', function ($group) {
                $group->get('/stream/meters', [RealtimeController::class, 'streamMeterData']);
                $group->get('/stream/notifications', [RealtimeController::class, 'streamNotifications']);
                $group->get('/poll/updates', [RealtimeController::class, 'pollUpdates']);
                $group->get('/meter/{meter_id}/status', [RealtimeController::class, 'meterStatus']);
            });
            
            // Tariff and Rate Management routes
            $group->group('/tariffs', function ($group) {
                // Tariff routes
                $group->get('/client/{clientId}', [TariffController::class, 'getAllTariffs']);
                $group->get('/{id}', [TariffController::class, 'getTariff']);
                $group->get('/{id}/complete', [TariffController::class, 'getCompleteTariff']);
                $group->post('', [TariffController::class, 'createTariff']);
                $group->put('/{id}', [TariffController::class, 'updateTariff']);
                $group->delete('/{id}', [TariffController::class, 'deleteTariff']);
                $group->post('/{id}/calculate-price', [TariffController::class, 'calculatePrice']);
                
                // Seasonal rates routes
                $group->get('/{tariffId}/seasonal-rates', [TariffController::class, 'getSeasonalRates']);
                $group->post('/{tariffId}/seasonal-rates', [TariffController::class, 'createSeasonalRate']);
                $group->put('/seasonal-rates/{id}', [TariffController::class, 'updateSeasonalRate']);
                $group->delete('/seasonal-rates/{id}', [TariffController::class, 'deleteSeasonalRate']);
                
                // Bulk discount tiers routes
                $group->get('/{tariffId}/bulk-discounts', [TariffController::class, 'getBulkDiscountTiers']);
                $group->post('/{tariffId}/bulk-discounts', [TariffController::class, 'createBulkDiscountTier']);
                $group->put('/bulk-discounts/{id}', [TariffController::class, 'updateBulkDiscountTier']);
                $group->delete('/bulk-discounts/{id}', [TariffController::class, 'deleteBulkDiscountTier']);
                
                // Dynamic discount rules routes
                $group->get('/{tariffId}/dynamic-discounts', [TariffController::class, 'getDynamicDiscountRules']);
                $group->post('/{tariffId}/dynamic-discounts', [TariffController::class, 'createDynamicDiscountRule']);
                $group->put('/dynamic-discounts/{id}', [TariffController::class, 'updateDynamicDiscountRule']);
                $group->delete('/dynamic-discounts/{id}', [TariffController::class, 'deleteDynamicDiscountRule']);
            });
            
            // Property tariff assignment routes
            $group->group('/property-tariffs', function ($group) {
                $group->get('/property/{propertyId}', [TariffController::class, 'getPropertyTariffs']);
                $group->get('/property/{propertyId}/current', [TariffController::class, 'getCurrentPropertyTariff']);
                $group->post('/property/{propertyId}', [TariffController::class, 'assignTariffToProperty']);
                $group->put('/{id}', [TariffController::class, 'updatePropertyTariff']);
                $group->delete('/{id}', [TariffController::class, 'deletePropertyTariff']);
            });
            
            // Applied discounts routes
            $group->group('/discounts', function ($group) {
                $group->get('/customer/{customerId}', [TariffController::class, 'getCustomerDiscounts']);
                $group->get('/customer/{customerId}/stats', [TariffController::class, 'getCustomerDiscountStats']);
            });
            
            // Service Fee Management routes
            $group->group('/service-fees', function ($group) {
                // Plans routes
                $group->get('/plans', [ServiceFeeController::class, 'getPlans']);
                $group->get('/plans/{id}', [ServiceFeeController::class, 'getPlan']);
                $group->get('/plans/{id}/complete', [ServiceFeeController::class, 'getPlanWithComponents']);
                $group->post('/plans', [ServiceFeeController::class, 'createPlan']);
                $group->put('/plans/{id}', [ServiceFeeController::class, 'updatePlan']);
                $group->delete('/plans/{id}', [ServiceFeeController::class, 'deletePlan']);
                
                // Components routes
                $group->get('/plans/{planId}/components', [ServiceFeeController::class, 'getComponents']);
                $group->post('/plans/{planId}/components', [ServiceFeeController::class, 'createComponent']);
                $group->put('/components/{id}', [ServiceFeeController::class, 'updateComponent']);
                $group->delete('/components/{id}', [ServiceFeeController::class, 'deleteComponent']);
                
                // Client plan assignment routes
                $group->get('/client/{clientId}/plan', [ServiceFeeController::class, 'getClientPlan']);
                $group->post('/client/{clientId}/plan', [ServiceFeeController::class, 'assignPlanToClient']);
                $group->get('/client/{clientId}/plan-assignments', [ServiceFeeController::class, 'getClientPlanAssignments']);
                
                // Transactions routes
                $group->get('/client/{clientId}/transactions', [ServiceFeeController::class, 'getClientTransactions']);
                
                // Invoices routes
                $group->get('/client/{clientId}/invoices', [ServiceFeeController::class, 'getClientInvoices']);
                $group->get('/invoices/{id}', [ServiceFeeController::class, 'getInvoice']);
                $group->post('/client/{clientId}/invoices/monthly', [ServiceFeeController::class, 'generateMonthlyInvoice']);
                $group->post('/client/{clientId}/invoices/custom', [ServiceFeeController::class, 'generateCustomInvoice']);
                $group->put('/invoices/{id}/issue', [ServiceFeeController::class, 'issueInvoice']);
                $group->put('/invoices/{id}/mark-paid', [ServiceFeeController::class, 'markInvoiceAsPaid']);
                $group->put('/invoices/{id}/cancel', [ServiceFeeController::class, 'cancelInvoice']);
                
                // Reports routes
                $group->get('/client/{clientId}/report', [ServiceFeeController::class, 'getClientFeeReport']);
                $group->get('/reports/accrual', [ServiceFeeController::class, 'getAccrualReport']);
            });

        })->add($authMiddleware);

        // Public webhook routes (no auth required)
        $this->app->group('/webhooks', function ($group) {
            $group->post('/midtrans', [PaymentController::class, 'midtransWebhook']);
            $group->post('/doku', [PaymentController::class, 'dokuWebhook']);
        });

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