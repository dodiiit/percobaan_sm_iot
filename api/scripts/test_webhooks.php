<?php

/**
 * Webhook Testing Script
 * 
 * This script helps test webhook endpoints for both Midtrans and DOKU payment gateways.
 * Usage: php scripts/test_webhooks.php [midtrans|doku] [webhook_url]
 */

require_once __DIR__ . '/../vendor/autoload.php';

function testMidtransWebhook($webhookUrl) {
    $orderId = 'TEST-' . time();
    $grossAmount = '100000';
    $statusCode = '200';
    $serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? 'your-server-key';
    
    // Generate signature
    $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
    
    $webhookData = [
        'transaction_time' => date('Y-m-d H:i:s'),
        'transaction_status' => 'settlement',
        'transaction_id' => 'TXN-' . time(),
        'status_message' => 'midtrans payment success',
        'status_code' => $statusCode,
        'signature_key' => $signatureKey,
        'payment_type' => 'bank_transfer',
        'order_id' => $orderId,
        'merchant_id' => 'G123456789',
        'gross_amount' => $grossAmount,
        'fraud_status' => 'accept',
        'currency' => 'IDR'
    ];
    
    return sendWebhook($webhookUrl, $webhookData, 'Midtrans');
}

function testDokuWebhook($webhookUrl) {
    $invoiceNumber = 'INV-' . time();
    $amount = '100000';
    $currency = 'IDR';
    $secretKey = $_ENV['DOKU_SECRET_KEY'] ?? 'your-secret-key';
    
    // Generate signature
    $stringToSign = $amount . $currency . $invoiceNumber . $secretKey;
    $checksum = hash('sha256', $stringToSign);
    
    $webhookData = [
        'order' => [
            'invoice_number' => $invoiceNumber,
            'amount' => $amount,
            'currency' => $currency
        ],
        'transaction' => [
            'id' => 'TXN-' . time(),
            'status' => 'SUCCESS',
            'date' => date('Y-m-d H:i:s')
        ],
        'virtual_account_info' => [
            'virtual_account_number' => '1234567890123456',
            'bank_code' => 'BCA',
            'bank_name' => 'Bank Central Asia'
        ],
        'security' => [
            'checksum' => $checksum
        ]
    ];
    
    return sendWebhook($webhookUrl, $webhookData, 'DOKU');
}

function sendWebhook($url, $data, $gateway) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'User-Agent: ' . $gateway . '-Webhook-Test/1.0'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    echo "=== {$gateway} Webhook Test ===\n";
    echo "URL: {$url}\n";
    echo "HTTP Code: {$httpCode}\n";
    
    if ($error) {
        echo "Error: {$error}\n";
    } else {
        echo "Response: {$response}\n";
    }
    
    echo "Request Data:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    echo "\n";
    
    return $httpCode === 200;
}

// Main execution
if ($argc < 2) {
    echo "Usage: php test_webhooks.php [midtrans|doku] [webhook_url]\n";
    echo "Example: php test_webhooks.php midtrans http://localhost:8080/webhooks/payment/midtrans\n";
    exit(1);
}

$gateway = $argv[1];
$webhookUrl = $argv[2] ?? 'http://localhost:8080/webhooks/payment/' . $gateway;

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

switch ($gateway) {
    case 'midtrans':
        $success = testMidtransWebhook($webhookUrl);
        break;
    case 'doku':
        $success = testDokuWebhook($webhookUrl);
        break;
    default:
        echo "Invalid gateway. Use 'midtrans' or 'doku'\n";
        exit(1);
}

echo $success ? "✓ Webhook test completed successfully\n" : "✗ Webhook test failed\n";
exit($success ? 0 : 1);