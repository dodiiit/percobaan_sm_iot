<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\PaymentService;
use IndoWater\Api\Services\WebhookRetryService;
use Psr\Log\LoggerInterface;

class WebhookController
{
    private PaymentService $paymentService;
    private WebhookRetryService $retryService;
    private LoggerInterface $logger;

    public function __construct(
        PaymentService $paymentService, 
        WebhookRetryService $retryService,
        LoggerInterface $logger
    ) {
        $this->paymentService = $paymentService;
        $this->retryService = $retryService;
        $this->logger = $logger;
    }

    /**
     * Handle payment gateway webhooks
     */
    public function handlePayment(Request $request, Response $response, array $args): Response
    {
        $method = $args['method'] ?? '';
        $rawBody = (string) $request->getBody();
        $headers = $request->getHeaders();
        
        // Log incoming webhook
        $this->logger->info('Webhook received', [
            'method' => $method,
            'headers' => $headers,
            'body' => $rawBody,
            'ip' => $this->getClientIp($request)
        ]);

        try {
            // Validate payment method
            if (empty($method) || !in_array($method, ['midtrans', 'doku'])) {
                $this->logger->warning('Invalid payment method in webhook', ['method' => $method]);
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid payment method'
                ], 400);
            }

            // Parse webhook data based on content type
            $data = $this->parseWebhookData($request, $method);
            
            if (empty($data)) {
                $this->logger->warning('Empty webhook data received', ['method' => $method]);
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid webhook data'
                ], 400);
            }

            // Verify webhook authenticity
            if (!$this->verifyWebhookSignature($request, $data, $method)) {
                $this->logger->warning('Invalid webhook signature', [
                    'method' => $method,
                    'data' => $data
                ]);
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid signature'
                ], 401);
            }

            // Generate webhook ID for tracking
            $webhookId = $this->retryService->generateWebhookId($method, $data);

            try {
                // Process webhook
                $result = $this->paymentService->handleWebhook($method, $data);

                $this->logger->info('Webhook processed successfully', [
                    'webhook_id' => $webhookId,
                    'method' => $method,
                    'result' => $result
                ]);

                // Return appropriate response for each gateway
                return $this->getWebhookResponse($response, $method, $result);

            } catch (\Exception $processingError) {
                // Queue for retry if processing fails
                $this->retryService->queueRetry($webhookId, $method, $data);
                
                $this->logger->warning('Webhook processing failed, queued for retry', [
                    'webhook_id' => $webhookId,
                    'method' => $method,
                    'error' => $processingError->getMessage()
                ]);

                // Still return success to gateway to avoid immediate retries
                return $this->getWebhookResponse($response, $method, ['status' => 'queued']);
            }

        } catch (\Exception $e) {
            $this->logger->error('Webhook processing failed', [
                'method' => $method,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Webhook processing failed'
            ], 500);
        }
    }

    /**
     * Get webhook status and statistics
     */
    public function status(Request $request, Response $response): Response
    {
        try {
            $stats = $this->retryService->getRetryStats();
            
            $status = [
                'webhook_system' => 'operational',
                'retry_stats' => $stats,
                'supported_gateways' => ['midtrans', 'doku'],
                'endpoints' => [
                    'midtrans' => '/webhooks/payment/midtrans',
                    'doku' => '/webhooks/payment/doku'
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ];

            return $this->jsonResponse($response, $status);

        } catch (\Exception $e) {
            $this->logger->error('Failed to get webhook status', [
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'webhook_system' => 'error',
                'error' => 'Failed to retrieve status',
                'timestamp' => date('Y-m-d H:i:s')
            ], 500);
        }
    }

    /**
     * Parse webhook data based on content type and payment method
     */
    private function parseWebhookData(Request $request, string $method): array
    {
        $contentType = $request->getHeaderLine('Content-Type');
        $rawBody = (string) $request->getBody();

        if (strpos($contentType, 'application/json') !== false) {
            $data = json_decode($rawBody, true);
            return $data ?: [];
        }

        if (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
            parse_str($rawBody, $data);
            return $data ?: [];
        }

        // Try to parse as JSON anyway (some gateways don't set proper content-type)
        $data = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }

        // Fallback to parsed body
        return $request->getParsedBody() ?: [];
    }

    /**
     * Verify webhook signature based on payment method
     */
    private function verifyWebhookSignature(Request $request, array $data, string $method): bool
    {
        switch ($method) {
            case 'midtrans':
                return $this->verifyMidtransSignature($data);
            case 'doku':
                return $this->verifyDokuSignature($request, $data);
            default:
                return false;
        }
    }

    /**
     * Verify Midtrans webhook signature
     */
    private function verifyMidtransSignature(array $data): bool
    {
        $orderId = $data['order_id'] ?? '';
        $statusCode = $data['status_code'] ?? '';
        $grossAmount = $data['gross_amount'] ?? '';
        $serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? '';

        if (empty($orderId) || empty($statusCode) || empty($grossAmount) || empty($serverKey)) {
            return false;
        }

        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
        return hash_equals($signatureKey, $data['signature_key'] ?? '');
    }

    /**
     * Verify DOKU webhook signature
     */
    private function verifyDokuSignature(Request $request, array $data): bool
    {
        $signature = $request->getHeaderLine('X-DOKU-Signature');
        $timestamp = $request->getHeaderLine('X-DOKU-Timestamp');
        $rawBody = (string) $request->getBody();

        if (empty($signature) || empty($timestamp)) {
            // Fallback to data-based signature verification
            return $this->verifyDokuDataSignature($data);
        }

        $secretKey = $_ENV['DOKU_SECRET_KEY'] ?? '';
        if (empty($secretKey)) {
            return false;
        }

        // DOKU signature format: HMAC-SHA256 of timestamp + method + path + body
        $method = 'POST';
        $path = '/webhooks/doku';
        $stringToSign = $timestamp . $method . $path . $rawBody;
        $expectedSignature = hash_hmac('sha256', $stringToSign, $secretKey);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Verify DOKU signature from webhook data
     */
    private function verifyDokuDataSignature(array $data): bool
    {
        $checksum = $data['security']['checksum'] ?? '';
        if (empty($checksum)) {
            return false;
        }

        // Generate expected signature based on DOKU's specification
        $secretKey = $_ENV['DOKU_SECRET_KEY'] ?? '';
        $amount = $data['order']['amount'] ?? '';
        $invoiceNumber = $data['order']['invoice_number'] ?? '';
        $currency = $data['order']['currency'] ?? 'IDR';

        if (empty($secretKey) || empty($amount) || empty($invoiceNumber)) {
            return false;
        }

        $stringToSign = $amount . $currency . $invoiceNumber . $secretKey;
        $expectedSignature = hash('sha256', $stringToSign);

        return hash_equals($expectedSignature, $checksum);
    }

    /**
     * Get appropriate webhook response for each gateway
     */
    private function getWebhookResponse(Response $response, string $method, array $result): Response
    {
        switch ($method) {
            case 'midtrans':
                // Midtrans expects a simple "OK" response
                return $response->withStatus(200)->write('OK');
                
            case 'doku':
                // DOKU expects a JSON response with specific format
                return $this->jsonResponse($response, [
                    'response_code' => '00',
                    'response_message' => 'SUCCESS'
                ]);
                
            default:
                return $this->jsonResponse($response, [
                    'status' => 'success',
                    'data' => $result
                ]);
        }
    }

    /**
     * Get client IP address
     */
    private function getClientIp(Request $request): string
    {
        $serverParams = $request->getServerParams();
        
        // Check for IP from various headers (in order of preference)
        $ipHeaders = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
            'HTTP_X_REAL_IP',            // Nginx
            'HTTP_X_FORWARDED',          // Proxy
            'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
            'HTTP_FORWARDED_FOR',        // Proxy
            'HTTP_FORWARDED',            // Proxy
            'REMOTE_ADDR'                // Standard
        ];

        foreach ($ipHeaders as $header) {
            if (!empty($serverParams[$header])) {
                $ip = $serverParams[$header];
                // Handle comma-separated IPs (take the first one)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return $serverParams['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Create JSON response
     */
    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}