<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load test environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

// Set test environment
$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = ':memory:';
$_ENV['CACHE_DRIVER'] = 'array';

// Initialize Mockery
if (class_exists('Mockery')) {
    register_shutdown_function(function () {
        Mockery::close();
    });
}