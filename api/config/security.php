<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    |
    | This file contains security settings for the IndoWater API.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    'auth' => [
        // JWT settings
        'jwt' => [
            'secret' => env('JWT_SECRET', ''),
            'algorithm' => 'HS256',
            'expiration' => 3600, // 1 hour
            'refresh_expiration' => 604800, // 1 week
            'leeway' => 60, // 1 minute
        ],

        // Password settings
        'password' => [
            'min_length' => 10,
            'require_uppercase' => true,
            'require_lowercase' => true,
            'require_number' => true,
            'require_special' => true,
            'expiration_days' => 90,
            'history_count' => 5,
            'max_attempts' => 5,
            'lockout_time' => 900, // 15 minutes
        ],

        // Multi-factor authentication
        'mfa' => [
            'enabled' => true,
            'required_for_admin' => true,
            'methods' => ['email', 'sms', 'totp'],
            'code_expiration' => 300, // 5 minutes
            'code_length' => 6,
        ],

        // Session settings
        'session' => [
            'timeout' => 1800, // 30 minutes
            'absolute_timeout' => 28800, // 8 hours
            'regenerate_id' => true,
            'secure' => true,
            'http_only' => true,
            'same_site' => 'lax',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Data Protection
    |--------------------------------------------------------------------------
    */
    'data_protection' => [
        // Encryption settings
        'encryption' => [
            'method' => 'AES-256-CBC',
            'key' => env('ENCRYPTION_KEY', ''),
        ],

        // Hashing settings
        'hashing' => [
            'algorithm' => PASSWORD_ARGON2ID,
            'options' => [
                'memory_cost' => 65536, // 64MB
                'time_cost' => 4,
                'threads' => 3,
            ],
        ],

        // Data masking
        'masking' => [
            'enabled' => true,
            'mask_email' => true,
            'mask_phone' => true,
            'mask_credit_card' => true,
            'mask_address' => true,
        ],

        // Data retention
        'retention' => [
            'personal_data' => 365, // 1 year
            'payment_data' => 2555, // 7 years
            'logs' => 365, // 1 year
            'backups' => 90, // 3 months
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | API Security
    |--------------------------------------------------------------------------
    */
    'api' => [
        // Rate limiting
        'rate_limit' => [
            'enabled' => true,
            'requests_per_minute' => 60,
            'requests_per_day' => 1000,
            'failed_attempts_per_hour' => 5,
        ],

        // Input validation
        'input_validation' => [
            'enabled' => true,
            'sanitize_input' => true,
            'validate_input' => true,
        ],

        // Output encoding
        'output_encoding' => [
            'enabled' => true,
            'encode_html' => true,
            'encode_json' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Headers
    |--------------------------------------------------------------------------
    */
    'headers' => [
        // Content Security Policy
        'content_security_policy' => "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self'; img-src 'self'; media-src 'self'; frame-src 'none'; font-src 'self'; connect-src 'self'",

        // X-Content-Type-Options
        'x_content_type_options' => 'nosniff',

        // X-Frame-Options
        'x_frame_options' => 'DENY',

        // X-XSS-Protection
        'x_xss_protection' => '1; mode=block',

        // Strict-Transport-Security
        'strict_transport_security' => 'max-age=31536000; includeSubDomains; preload',

        // Referrer-Policy
        'referrer_policy' => 'strict-origin-when-cross-origin',

        // Feature-Policy
        'feature_policy' => "camera 'none'; microphone 'none'; geolocation 'none'",

        // Permissions-Policy
        'permissions_policy' => "camera=(), microphone=(), geolocation=()",

        // Cache-Control
        'cache_control' => 'no-store, no-cache, must-revalidate, max-age=0',

        // Pragma
        'pragma' => 'no-cache',
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Handling and Logging
    |--------------------------------------------------------------------------
    */
    'error_handling' => [
        // Error display
        'display_errors' => env('APP_DEBUG', false),
        'display_error_details' => env('APP_DEBUG', false),

        // Error logging
        'log_errors' => true,
        'log_error_details' => true,
        'log_path' => env('LOG_PATH', '/var/log/indowater'),
        'log_level' => env('LOG_LEVEL', 'error'),
        'log_max_files' => 30,
    ],

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    */
    'cors' => [
        'enabled' => true,
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'exposed_headers' => [],
        'max_age' => 86400, // 1 day
        'allow_credentials' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | CSRF Protection
    |--------------------------------------------------------------------------
    */
    'csrf' => [
        'enabled' => true,
        'token_name' => 'csrf_token',
        'header_name' => 'X-CSRF-TOKEN',
        'cookie_name' => 'XSRF-TOKEN',
        'expiration' => 7200, // 2 hours
    ],
];