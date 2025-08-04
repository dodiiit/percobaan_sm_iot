<?php

/**
 * Webhook Monitoring Dashboard
 * 
 * This script provides a simple monitoring interface for webhook health.
 * Can be run from command line or accessed via web interface.
 * 
 * Usage: php scripts/webhook_monitor.php [--json] [--check-endpoints]
 */

require_once __DIR__ . '/../vendor/autoload.php';

use DI\ContainerBuilder;
use IndoWater\Api\Services\WebhookRetryService;
use IndoWater\Api\Services\CacheService;

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

// Parse command line arguments
$options = getopt('', ['json', 'check-endpoints', 'help']);

if (isset($options['help'])) {
    echo "Webhook Monitoring Dashboard\n\n";
    echo "Usage: php webhook_monitor.php [options]\n\n";
    echo "Options:\n";
    echo "  --json             Output in JSON format\n";
    echo "  --check-endpoints  Test webhook endpoint accessibility\n";
    echo "  --help             Show this help message\n\n";
    exit(0);
}

function checkEndpointHealth($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing only
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'accessible' => $result !== false && $httpCode < 400,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

function formatBytes($size, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }
    return round($size, $precision) . ' ' . $units[$i];
}

try {
    // Get services
    $retryService = $container->get(WebhookRetryService::class);
    $cacheService = $container->get(CacheService::class);
    
    // Collect monitoring data
    $monitoringData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'system_status' => 'operational',
        'webhook_stats' => $retryService->getRetryStats(),
        'endpoints' => [
            'midtrans' => '/api/webhooks/payment/midtrans',
            'doku' => '/api/webhooks/payment/doku',
            'status' => '/api/webhooks/status'
        ]
    ];
    
    // Check log file sizes
    $logDir = __DIR__ . '/../logs';
    $logFiles = ['app.log', 'webhook_retry.log', 'error.log'];
    $logStats = [];
    
    foreach ($logFiles as $logFile) {
        $filePath = $logDir . '/' . $logFile;
        if (file_exists($filePath)) {
            $size = filesize($filePath);
            $logStats[$logFile] = [
                'size' => $size,
                'size_formatted' => formatBytes($size),
                'last_modified' => date('Y-m-d H:i:s', filemtime($filePath))
            ];
        } else {
            $logStats[$logFile] = [
                'size' => 0,
                'size_formatted' => '0 B',
                'last_modified' => 'N/A'
            ];
        }
    }
    
    $monitoringData['log_stats'] = $logStats;
    
    // Check endpoint accessibility if requested
    if (isset($options['check-endpoints'])) {
        $baseUrl = $_ENV['APP_URL'] ?? 'http://localhost';
        $endpointChecks = [];
        
        foreach ($monitoringData['endpoints'] as $name => $path) {
            $url = rtrim($baseUrl, '/') . $path;
            $endpointChecks[$name] = array_merge(
                ['url' => $url],
                checkEndpointHealth($url)
            );
        }
        
        $monitoringData['endpoint_health'] = $endpointChecks;
    }
    
    // Check system resources
    $monitoringData['system_info'] = [
        'php_version' => PHP_VERSION,
        'memory_usage' => formatBytes(memory_get_usage(true)),
        'memory_peak' => formatBytes(memory_get_peak_usage(true)),
        'disk_free' => formatBytes(disk_free_space(__DIR__)),
        'load_average' => function_exists('sys_getloadavg') ? sys_getloadavg() : 'N/A'
    ];
    
    // Output results
    if (isset($options['json'])) {
        echo json_encode($monitoringData, JSON_PRETTY_PRINT) . "\n";
    } else {
        // Human-readable output
        echo "=== Webhook System Monitoring Dashboard ===\n";
        echo "Timestamp: " . $monitoringData['timestamp'] . "\n";
        echo "System Status: " . strtoupper($monitoringData['system_status']) . "\n\n";
        
        // Webhook Statistics
        echo "=== Webhook Statistics ===\n";
        $stats = $monitoringData['webhook_stats'];
        echo "Total Pending Retries: " . $stats['total_pending'] . "\n";
        
        if (!empty($stats['by_method'])) {
            echo "\nRetries by Payment Method:\n";
            foreach ($stats['by_method'] as $method => $count) {
                echo "  {$method}: {$count}\n";
            }
        }
        
        if (!empty($stats['by_attempt'])) {
            echo "\nRetries by Attempt Number:\n";
            foreach ($stats['by_attempt'] as $attempt => $count) {
                echo "  Attempt {$attempt}: {$count}\n";
            }
        }
        
        // Log Statistics
        echo "\n=== Log File Statistics ===\n";
        foreach ($monitoringData['log_stats'] as $file => $stats) {
            echo "{$file}: {$stats['size_formatted']} (modified: {$stats['last_modified']})\n";
        }
        
        // Endpoint Health
        if (isset($monitoringData['endpoint_health'])) {
            echo "\n=== Endpoint Health Check ===\n";
            foreach ($monitoringData['endpoint_health'] as $name => $health) {
                $status = $health['accessible'] ? '✓ ACCESSIBLE' : '✗ FAILED';
                echo "{$name}: {$status} (HTTP {$health['http_code']})\n";
                echo "  URL: {$health['url']}\n";
                if (!empty($health['error'])) {
                    echo "  Error: {$health['error']}\n";
                }
            }
        }
        
        // System Information
        echo "\n=== System Information ===\n";
        $sysInfo = $monitoringData['system_info'];
        echo "PHP Version: {$sysInfo['php_version']}\n";
        echo "Memory Usage: {$sysInfo['memory_usage']}\n";
        echo "Memory Peak: {$sysInfo['memory_peak']}\n";
        echo "Disk Free: {$sysInfo['disk_free']}\n";
        
        if (is_array($sysInfo['load_average'])) {
            echo "Load Average: " . implode(', ', array_map(function($load) {
                return number_format($load, 2);
            }, $sysInfo['load_average'])) . "\n";
        }
        
        echo "\n=== Webhook Endpoints ===\n";
        foreach ($monitoringData['endpoints'] as $name => $path) {
            echo "{$name}: {$path}\n";
        }
        
        // Health Summary
        echo "\n=== Health Summary ===\n";
        $totalRetries = $stats['total_pending'];
        
        if ($totalRetries == 0) {
            echo "✓ All webhooks processing successfully\n";
        } elseif ($totalRetries < 10) {
            echo "⚠ Low retry queue ({$totalRetries} pending)\n";
        } else {
            echo "⚠ High retry queue ({$totalRetries} pending) - investigate issues\n";
        }
        
        // Check log file sizes
        foreach ($monitoringData['log_stats'] as $file => $stats) {
            if ($stats['size'] > 100 * 1024 * 1024) { // 100MB
                echo "⚠ Large log file: {$file} ({$stats['size_formatted']})\n";
            }
        }
    }
    
} catch (\Exception $e) {
    $error = [
        'timestamp' => date('Y-m-d H:i:s'),
        'system_status' => 'error',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ];
    
    if (isset($options['json'])) {
        echo json_encode($error, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "=== Webhook Monitoring Error ===\n";
        echo "Timestamp: " . $error['timestamp'] . "\n";
        echo "Error: " . $error['error'] . "\n";
    }
    
    exit(1);
}