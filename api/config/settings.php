<?php

declare(strict_types=1);

use DI\ContainerBuilder;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        'settings' => [
            'app' => [
                'name' => $_ENV['APP_NAME'] ?? 'IndoWater',
                'env' => $_ENV['APP_ENV'] ?? 'development',
                'debug' => $_ENV['APP_DEBUG'] === 'true',
                'url' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
                'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Asia/Jakarta',
                'locale' => $_ENV['APP_LOCALE'] ?? 'id',
                'key' => $_ENV['APP_KEY'] ?? null,
            ],
            'db' => [
                'driver' => $_ENV['DB_CONNECTION'] ?? 'mysql',
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? '3306',
                'database' => $_ENV['DB_DATABASE'] ?? 'indowater',
                'username' => $_ENV['DB_USERNAME'] ?? 'root',
                'password' => $_ENV['DB_PASSWORD'] ?? '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
            ],
            'jwt' => [
                'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key',
                'ttl' => (int) ($_ENV['JWT_TTL'] ?? 3600),
                'refresh_ttl' => (int) ($_ENV['JWT_REFRESH_TTL'] ?? 604800),
            ],
            'mail' => [
                'driver' => $_ENV['MAIL_DRIVER'] ?? 'smtp',
                'host' => $_ENV['MAIL_HOST'] ?? 'smtp.mailtrap.io',
                'port' => $_ENV['MAIL_PORT'] ?? '2525',
                'username' => $_ENV['MAIL_USERNAME'] ?? null,
                'password' => $_ENV['MAIL_PASSWORD'] ?? null,
                'encryption' => $_ENV['MAIL_ENCRYPTION'] ?? null,
                'from' => [
                    'address' => $_ENV['MAIL_FROM_ADDRESS'] ?? 'info@indowater.example.com',
                    'name' => $_ENV['MAIL_FROM_NAME'] ?? 'IndoWater',
                ],
            ],
            'midtrans' => [
                'client_key' => $_ENV['MIDTRANS_CLIENT_KEY'] ?? null,
                'server_key' => $_ENV['MIDTRANS_SERVER_KEY'] ?? null,
                'merchant_id' => $_ENV['MIDTRANS_MERCHANT_ID'] ?? null,
                'environment' => $_ENV['MIDTRANS_ENVIRONMENT'] ?? 'sandbox',
            ],
            'doku' => [
                'client_id' => $_ENV['DOKU_CLIENT_ID'] ?? null,
                'secret_key' => $_ENV['DOKU_SECRET_KEY'] ?? null,
                'private_key' => $_ENV['DOKU_PRIVATE_KEY'] ?? null,
                'public_key' => $_ENV['DOKU_PUBLIC_KEY'] ?? null,
                'doku_public_key' => $_ENV['DOKU_PUBLIC_KEY_DOKU'] ?? null,
                'issuer' => $_ENV['DOKU_ISSUER'] ?? 'IndoWater',
                'partner_service_id' => $_ENV['DOKU_PARTNER_SERVICE_ID'] ?? '8129014',
                'environment' => $_ENV['DOKU_ENVIRONMENT'] ?? 'sandbox',
            ],
            'whatsapp' => [
                'api_url' => $_ENV['WHATSAPP_API_URL'] ?? null,
                'api_key' => $_ENV['WHATSAPP_API_KEY'] ?? null,
            ],
            'sms' => [
                'api_url' => $_ENV['SMS_API_URL'] ?? null,
                'api_key' => $_ENV['SMS_API_KEY'] ?? null,
                'sender_id' => $_ENV['SMS_SENDER_ID'] ?? null,
            ],
            'security' => [
                'cors_allowed_origins' => explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3000,http://localhost:8000'),
                'rate_limit_requests' => (int) ($_ENV['RATE_LIMIT_REQUESTS'] ?? 60),
                'rate_limit_per_minute' => (int) ($_ENV['RATE_LIMIT_PER_MINUTE'] ?? 1),
            ],
            'redis' => [
                'scheme' => $_ENV['REDIS_SCHEME'] ?? 'tcp',
                'host' => $_ENV['REDIS_HOST'] ?? '127.0.0.1',
                'port' => (int) ($_ENV['REDIS_PORT'] ?? 6379),
                'database' => (int) ($_ENV['REDIS_DATABASE'] ?? 0),
                'password' => $_ENV['REDIS_PASSWORD'] ?? null,
            ],
            'cache' => [
                'driver' => $_ENV['CACHE_DRIVER'] ?? 'redis',
                'prefix' => $_ENV['CACHE_PREFIX'] ?? 'indowater:',
                'default_ttl' => (int) ($_ENV['CACHE_DEFAULT_TTL'] ?? 3600),
                'enabled' => $_ENV['CACHE_ENABLED'] !== 'false',
            ],
            'session' => [
                'driver' => $_ENV['SESSION_DRIVER'] ?? 'file',
                'lifetime' => (int) ($_ENV['SESSION_LIFETIME'] ?? 120),
            ],
            'log' => [
                'channel' => $_ENV['LOG_CHANNEL'] ?? 'stack',
                'level' => $_ENV['LOG_LEVEL'] ?? 'debug',
            ],
            'storage' => [
                'driver' => $_ENV['STORAGE_DRIVER'] ?? 'local',
                'path' => $_ENV['STORAGE_PATH'] ?? 'storage',
                'url' => $_ENV['STORAGE_URL'] ?? 'http://localhost:8000/storage',
            ],
            'features' => [
                'registration' => $_ENV['FEATURE_REGISTRATION'] === 'true',
                'password_reset' => $_ENV['FEATURE_PASSWORD_RESET'] === 'true',
                'email_verification' => $_ENV['FEATURE_EMAIL_VERIFICATION'] === 'true',
                'social_login' => $_ENV['FEATURE_SOCIAL_LOGIN'] === 'true',
                'two_factor_auth' => $_ENV['FEATURE_TWO_FACTOR_AUTH'] === 'true',
            ],
        ],
    ]);
};