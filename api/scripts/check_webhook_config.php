<?php

/**
 * Webhook Configuration Checker
 * 
 * This script validates your webhook configuration and environment setup.
 * Run this before deploying to production.
 * 
 * Usage: php scripts/check_webhook_config.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

function checkEnvVar($name, $required = true) {
    $value = $_ENV[$name] ?? null;
    $status = $value ? '✓' : ($required ? '✗' : '⚠');
    $message = $value ? 'Set' : ($required ? 'Missing (Required)' : 'Not set (Optional)');
    
    return [
        'status' => $status,
        'message' => $message,
        'value' => $value ? (strlen($value) > 20 ? substr($value, 0, 20) . '...' : $value) : null
    ];
}

function checkFilePermissions($path) {
    if (!file_exists($path)) {
        return ['status' => '✗', 'message' => 'File does not exist'];
    }
    
    $perms = fileperms($path);
    $readable = is_readable($path);
    $writable = is_writable($path);
    
    return [
        'status' => ($readable && $writable) ? '✓' : '⚠',
        'message' => sprintf('Permissions: %o, Readable: %s, Writable: %s', 
            $perms & 0777, 
            $readable ? 'Yes' : 'No', 
            $writable ? 'Yes' : 'No'
        )
    ];
}

function testWebhookEndpoint($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['status' => '✗', 'message' => "Error: {$error}"];
    }
    
    if ($httpCode >= 200 && $httpCode < 400) {
        return ['status' => '✓', 'message' => "HTTP {$httpCode} - Accessible"];
    } else {
        return ['status' => '⚠', 'message' => "HTTP {$httpCode} - Check configuration"];
    }
}

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

echo "=== Webhook Configuration Checker ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";

// Check environment variables
echo "=== Environment Variables ===\n";
$envChecks = [
    'APP_URL' => checkEnvVar('APP_URL', true),
    'MIDTRANS_SERVER_KEY' => checkEnvVar('MIDTRANS_SERVER_KEY', true),
    'MIDTRANS_CLIENT_KEY' => checkEnvVar('MIDTRANS_CLIENT_KEY', true),
    'MIDTRANS_IS_PRODUCTION' => checkEnvVar('MIDTRANS_IS_PRODUCTION', false),
    'DOKU_SHARED_KEY' => checkEnvVar('DOKU_SHARED_KEY', true),
    'DOKU_CLIENT_ID' => checkEnvVar('DOKU_CLIENT_ID', true),
    'DOKU_IS_PRODUCTION' => checkEnvVar('DOKU_IS_PRODUCTION', false),
    'WEBHOOK_SECRET_KEY' => checkEnvVar('WEBHOOK_SECRET_KEY', false),
    'DB_HOST' => checkEnvVar('DB_HOST', true),
    'DB_NAME' => checkEnvVar('DB_NAME', true),
    'DB_USER' => checkEnvVar('DB_USER', true),
    'DB_PASS' => checkEnvVar('DB_PASS', true),
];

foreach ($envChecks as $var => $check) {
    echo sprintf("%-20s %s %s", $var, $check['status'], $check['message']);
    if ($check['value']) {
        echo " (Value: {$check['value']})";
    }
    echo "\n";
}

// Check file permissions
echo "\n=== File Permissions ===\n";
$fileChecks = [
    'Logs Directory' => __DIR__ . '/../logs',
    'Cache Directory' => __DIR__ . '/../cache',
    'Config Directory' => __DIR__ . '/../config',
    'Scripts Directory' => __DIR__,
];

foreach ($fileChecks as $name => $path) {
    $check = checkFilePermissions($path);
    echo sprintf("%-20s %s %s\n", $name, $check['status'], $check['message']);
}

// Check webhook endpoints
$baseUrl = $_ENV['APP_URL'] ?? 'http://localhost';
if ($baseUrl !== 'http://localhost') {
    echo "\n=== Webhook Endpoint Accessibility ===\n";
    
    $endpoints = [
        'Status Endpoint' => rtrim($baseUrl, '/') . '/api/webhooks/status',
        'Midtrans Webhook' => rtrim($baseUrl, '/') . '/api/webhooks/payment/midtrans',
        'DOKU Webhook' => rtrim($baseUrl, '/') . '/api/webhooks/payment/doku',
    ];
    
    foreach ($endpoints as $name => $url) {
        $check = testWebhookEndpoint($url);
        echo sprintf("%-20s %s %s\n", $name, $check['status'], $check['message']);
    }
} else {
    echo "\n=== Webhook Endpoint Accessibility ===\n";
    echo "⚠ APP_URL not configured - skipping endpoint checks\n";
    echo "  Set APP_URL in .env to test endpoint accessibility\n";
}

// Check PHP extensions
echo "\n=== PHP Extensions ===\n";
$requiredExtensions = ['curl', 'json', 'pdo', 'pdo_mysql', 'openssl', 'hash'];
foreach ($requiredExtensions as $ext) {
    $loaded = extension_loaded($ext);
    echo sprintf("%-15s %s %s\n", $ext, $loaded ? '✓' : '✗', $loaded ? 'Loaded' : 'Missing');
}

// Check composer dependencies
echo "\n=== Composer Dependencies ===\n";
$composerFile = __DIR__ . '/../composer.json';
if (file_exists($composerFile)) {
    $composer = json_decode(file_get_contents($composerFile), true);
    $requiredPackages = [
        'midtrans/midtrans-php' => 'Midtrans SDK',
        'doku/doku-php-library' => 'DOKU SDK',
        'slim/slim' => 'Slim Framework',
        'php-di/php-di' => 'Dependency Injection',
        'monolog/monolog' => 'Logging'
    ];
    
    foreach ($requiredPackages as $package => $description) {
        $installed = isset($composer['require'][$package]);
        echo sprintf("%-25s %s %s\n", $package, $installed ? '✓' : '✗', $installed ? 'Installed' : 'Missing');
    }
} else {
    echo "✗ composer.json not found\n";
}

// Configuration recommendations
echo "\n=== Configuration Recommendations ===\n";

$recommendations = [];

// Check if in production mode
$isProduction = ($_ENV['MIDTRANS_IS_PRODUCTION'] ?? 'false') === 'true' || 
                ($_ENV['DOKU_IS_PRODUCTION'] ?? 'false') === 'true';

if ($isProduction) {
    $recommendations[] = "✓ Production mode detected - ensure all credentials are production keys";
} else {
    $recommendations[] = "⚠ Sandbox mode detected - switch to production keys when ready";
}

// Check HTTPS
$appUrl = $_ENV['APP_URL'] ?? '';
if (strpos($appUrl, 'https://') === 0) {
    $recommendations[] = "✓ HTTPS configured - webhooks will work with payment gateways";
} else {
    $recommendations[] = "⚠ HTTP detected - payment gateways require HTTPS for webhooks";
}

// Check webhook secret
if (empty($_ENV['WEBHOOK_SECRET_KEY'])) {
    $recommendations[] = "⚠ Consider setting WEBHOOK_SECRET_KEY for additional security";
}

// Check log rotation
$logDir = __DIR__ . '/../logs';
if (is_dir($logDir)) {
    $logFiles = glob($logDir . '/*.log');
    $largeFiles = array_filter($logFiles, function($file) {
        return filesize($file) > 50 * 1024 * 1024; // 50MB
    });
    
    if (!empty($largeFiles)) {
        $recommendations[] = "⚠ Large log files detected - consider setting up log rotation";
    }
}

foreach ($recommendations as $rec) {
    echo $rec . "\n";
}

// Final summary
echo "\n=== Summary ===\n";
$totalIssues = 0;

// Count issues
foreach ($envChecks as $check) {
    if ($check['status'] === '✗') $totalIssues++;
}

if ($totalIssues === 0) {
    echo "✓ Configuration looks good! Ready for webhook processing.\n";
} else {
    echo "⚠ Found {$totalIssues} configuration issues that need attention.\n";
}

echo "\n=== Next Steps ===\n";
echo "1. Fix any configuration issues shown above\n";
echo "2. Configure webhook URLs in payment gateway dashboards:\n";
echo "   - Midtrans: {$baseUrl}/api/webhooks/payment/midtrans\n";
echo "   - DOKU: {$baseUrl}/api/webhooks/payment/doku\n";
echo "3. Set up cron job for retry processing:\n";
echo "   */5 * * * * {$_SERVER['PWD']}/scripts/webhook_cron.sh\n";
echo "4. Test webhooks using: php scripts/test_webhooks.php\n";
echo "5. Monitor webhook health: php scripts/webhook_monitor.php\n";

exit($totalIssues > 0 ? 1 : 0);