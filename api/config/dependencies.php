<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Email;
use GuzzleHttp\Client;
use Firebase\JWT\JWT;
use Doctrine\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;
use Predis\Client as RedisClient;
use IndoWater\Api\Services\CacheService;
use IndoWater\Api\Services\PaymentService;
use IndoWater\Api\Services\EmailService;
use IndoWater\Api\Services\RealtimeService;
use IndoWater\Api\Services\ServiceFeeService;
use IndoWater\Api\Models\Payment;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        // Logger
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $loggerSettings = $settings['log'];

            $logger = new Logger($settings['app']['name']);
            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler(
                __DIR__ . '/../logs/' . $loggerSettings['channel'] . '.log',
                Logger::getLevelName(strtoupper($loggerSettings['level']))
            );
            $logger->pushHandler($handler);

            return $logger;
        },

        // Database Connection
        PDO::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $dbSettings = $settings['db'];

            $dsn = sprintf(
                '%s:host=%s;port=%s;dbname=%s;charset=%s',
                $dbSettings['driver'],
                $dbSettings['host'],
                $dbSettings['port'],
                $dbSettings['database'],
                $dbSettings['charset']
            );

            $pdo = new PDO(
                $dsn,
                $dbSettings['username'],
                $dbSettings['password']
            );

            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

            return $pdo;
        },

        // Doctrine Entity Manager
        EntityManager::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $dbSettings = $settings['db'];

            $config = ORMSetup::createAttributeMetadataConfiguration(
                [__DIR__ . '/../src/Entities'],
                $settings['app']['debug']
            );

            $connectionParams = [
                'driver' => $dbSettings['driver'],
                'host' => $dbSettings['host'],
                'port' => $dbSettings['port'],
                'dbname' => $dbSettings['database'],
                'user' => $dbSettings['username'],
                'password' => $dbSettings['password'],
                'charset' => $dbSettings['charset'],
            ];

            $connection = DriverManager::getConnection($connectionParams, $config);
            return new EntityManager($connection, $config);
        },

        // Twig Templates
        Twig::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            
            $twig = Twig::create(__DIR__ . '/../templates', [
                'cache' => $settings['app']['debug'] ? false : __DIR__ . '/../var/cache/twig',
                'auto_reload' => $settings['app']['debug'],
                'debug' => $settings['app']['debug'],
            ]);
            
            // Add extensions if needed
            if ($settings['app']['debug']) {
                $twig->addExtension(new \Twig\Extension\DebugExtension());
            }
            
            return $twig;
        },

        // Twig Middleware
        TwigMiddleware::class => function (ContainerInterface $c) {
            return TwigMiddleware::createFromContainer(
                $c->get(\Slim\App::class),
                Twig::class
            );
        },

        // Mailer
        Mailer::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $mailSettings = $settings['mail'];
            
            $dsn = sprintf(
                '%s://%s:%s@%s:%s',
                $mailSettings['driver'],
                $mailSettings['username'],
                $mailSettings['password'],
                $mailSettings['host'],
                $mailSettings['port']
            );
            
            $transport = Transport::fromDsn($dsn);
            return new Mailer($transport);
        },

        // HTTP Client
        Client::class => function (ContainerInterface $c) {
            return new Client([
                'timeout' => 5.0,
                'verify' => false,
            ]);
        },

        // JWT
        JWT::class => function (ContainerInterface $c) {
            return new JWT();
        },

        // Redis Client
        RedisClient::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $redisSettings = $settings['redis'] ?? [
                'scheme' => 'tcp',
                'host' => '127.0.0.1',
                'port' => 6379,
                'database' => 0,
            ];

            return new RedisClient([
                'scheme' => $redisSettings['scheme'],
                'host' => $redisSettings['host'],
                'port' => $redisSettings['port'],
                'database' => $redisSettings['database'],
                'password' => $redisSettings['password'] ?? null,
            ]);
        },

        // Cache Service
        CacheService::class => function (ContainerInterface $c) {
            $redis = $c->get(RedisClient::class);
            $logger = $c->get(LoggerInterface::class);
            $settings = $c->get('settings');
            
            $prefix = $settings['cache']['prefix'] ?? 'indowater:';
            $defaultTtl = $settings['cache']['default_ttl'] ?? 3600;
            
            return new CacheService($redis, $logger, $prefix, $defaultTtl);
        },

        // Payment Service
        PaymentService::class => function (ContainerInterface $c) {
            $settings = $c->get('settings');
            $paymentModel = $c->get(Payment::class);
            
            // Get optional services if they exist
            $meterModel = null;
            $emailService = null;
            $realtimeService = null;
            $serviceFeeService = null;
            
            try {
                $emailService = $c->get(EmailService::class);
            } catch (\Exception $e) {
                // EmailService not available
            }
            
            try {
                $realtimeService = $c->get(RealtimeService::class);
            } catch (\Exception $e) {
                // RealtimeService not available
            }
            
            try {
                $serviceFeeService = $c->get(ServiceFeeService::class);
            } catch (\Exception $e) {
                // ServiceFeeService not available
            }
            
            return new PaymentService(
                $paymentModel,
                $settings['midtrans'],
                $settings['doku'],
                $meterModel,
                $emailService,
                $realtimeService,
                $serviceFeeService
            );
        },
    ]);
};