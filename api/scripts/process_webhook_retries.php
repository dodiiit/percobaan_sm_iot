<?php

/**
 * Webhook Retry Processor
 * 
 * This script processes pending webhook retries.
 * Should be run periodically via cron job.
 * 
 * Usage: php scripts/process_webhook_retries.php [--stats] [--clear]
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DI\ContainerBuilder;
use IndoWater\Api\Services\WebhookRetryService;
use IndoWater\Api\Services\PaymentService;

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Build container
$containerBuilder = new ContainerBuilder();

// Load dependencies
$dependencies = require __DIR__ . '/../config/dependencies.php';
$dependencies($containerBuilder);

// Load settings
$settings = require __DIR__ . '/../config/settings.php';
$containerBuilder->addDefinitions(['settings' => $settings]);

$container = $containerBuilder->build();

// Get services
$retryService = $container->get(WebhookRetryService::class);
$paymentService = $container->get(PaymentService::class);

// Parse command line arguments
$options = getopt('', ['stats', 'clear', 'help']);

if (isset($options['help'])) {
    echo "Webhook Retry Processor\n\n";
    echo "Usage: php process_webhook_retries.php [options]\n\n";
    echo "Options:\n";
    echo "  --stats    Show retry statistics\n";
    echo "  --clear    Clear all pending retries\n";
    echo "  --help     Show this help message\n\n";
    echo "Examples:\n";
    echo "  php process_webhook_retries.php           # Process pending retries\n";
    echo "  php process_webhook_retries.php --stats   # Show statistics\n";
    echo "  php process_webhook_retries.php --clear   # Clear all retries\n";
    exit(0);
}

if (isset($options['stats'])) {
    echo "=== Webhook Retry Statistics ===\n";
    $stats = $retryService->getRetryStats();
    
    echo "Total pending retries: " . $stats['total_pending'] . "\n";
    
    if (!empty($stats['by_method'])) {
        echo "\nBy payment method:\n";
        foreach ($stats['by_method'] as $method => $count) {
            echo "  {$method}: {$count}\n";
        }
    }
    
    if (!empty($stats['by_attempt'])) {
        echo "\nBy attempt number:\n";
        foreach ($stats['by_attempt'] as $attempt => $count) {
            echo "  Attempt {$attempt}: {$count}\n";
        }
    }
    
    if (isset($stats['error'])) {
        echo "\nError: " . $stats['error'] . "\n";
    }
    
    exit(0);
}

if (isset($options['clear'])) {
    echo "Clearing all pending webhook retries...\n";
    $cleared = $retryService->clearAllRetries();
    echo "Cleared {$cleared} pending retries.\n";
    exit(0);
}

// Process pending retries
echo "Processing pending webhook retries...\n";

try {
    $processed = $retryService->processPendingRetries($paymentService);
    echo "Processed {$processed} webhook retries.\n";
    
    // Show current stats
    $stats = $retryService->getRetryStats();
    echo "Remaining pending retries: " . $stats['total_pending'] . "\n";
    
    exit(0);
    
} catch (\Exception $e) {
    echo "Error processing webhook retries: " . $e->getMessage() . "\n";
    exit(1);
}