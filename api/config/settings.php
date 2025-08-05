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
                'rate_limit_excluded_routes' => explode(',', $_ENV['RATE_LIMIT_EXCLUDED_ROUTES'] ?? '/health,/webhook'),
                'api_rate_limits' => [
                    '/api/auth' => ['limit' => (int) ($_ENV['RATE_LIMIT_AUTH'] ?? 10), 'period' => 1],
                    '/api/payments' => ['limit' => (int) ($_ENV['RATE_LIMIT_PAYMENTS'] ?? 20), 'period' => 1],
                    '/api/meters' => ['limit' => (int) ($_ENV['RATE_LIMIT_METERS'] ?? 30), 'period' => 1],
                ],
                'csrf_token_name' => $_ENV['CSRF_TOKEN_NAME'] ?? 'csrf_token',
                'csrf_token_expiry' => (int) ($_ENV['CSRF_TOKEN_EXPIRY'] ?? 3600),
                'csrf_excluded_routes' => explode(',', $_ENV['CSRF_EXCLUDED_ROUTES'] ?? '/api/realtime/stream,/health,/webhook'),
                'enable_hsts' => $_ENV['ENABLE_HSTS'] === 'true',
                'enable_feature_policy' => $_ENV['ENABLE_FEATURE_POLICY'] === 'true',
                'enable_permissions_policy' => $_ENV['ENABLE_PERMISSIONS_POLICY'] === 'true',
                'csp_report_uri' => $_ENV['CSP_REPORT_URI'] ?? '/api/security/reports/csp',
                'csp_directives' => [
                    'default-src' => ["'self'"],
                    'script-src' => ["'self'", "'strict-dynamic'", "'nonce-{NONCE}'"],
                    'style-src' => ["'self'", "'unsafe-inline'"],
                    'img-src' => ["'self'", "data:", "https:"],
                    'font-src' => ["'self'", "data:"],
                    'connect-src' => ["'self'", "https://api.lingindustri.com"],
                    'frame-src' => ["'self'"],
                    'object-src' => ["'none'"],
                    'base-uri' => ["'self'"],
                    'form-action' => ["'self'"],
                    'frame-ancestors' => ["'self'"],
                    'upgrade-insecure-requests' => true
                ],
            ],
            'cache' => [
                'driver' => $_ENV['CACHE_DRIVER'] ?? 'file',
                'prefix' => $_ENV['CACHE_PREFIX'] ?? 'indowater_',
                'redis' => [
                    'host' => $_ENV['REDIS_HOST'] ?? '127.0.0.1',
                    'port' => (int) ($_ENV['REDIS_PORT'] ?? 6379),
                    'password' => $_ENV['REDIS_PASSWORD'] ?? null,
                    'database' => (int) ($_ENV['REDIS_CACHE_DB'] ?? 1),
                ],
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