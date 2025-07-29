<?php

namespace App\Services\PaymentGateway;

use App\Models\PaymentGateway;
use Exception;
use Psr\Log\LoggerInterface;

/**
 * DokuGateway
 * 
 * Implementation of DOKU payment gateway
 */
class DokuGateway extends AbstractPaymentGateway
{
    /**
     * @var string
     */
    private $baseUrl;
    
    /**
     * @var string
     */
    private $clientId;
    
    /**
     * @var string
     */
    private $secretKey;
    
    /**
     * @var array
     */
    private $paymentMethods = [
        'credit_card',
        'virtual_account',
        'online_banking',
        'doku_wallet',
        'ovo',
        'linkaja',
        'dana',
        'shopeepay',
        'qris',
        'indomaret',
        'alfamart'
    ];
    
    /**
     * {@inheritdoc}
     */
    protected function initialize(): void
    {
        $this->baseUrl = $this->isProduction()
            ? 'https://api.doku.com'
            : 'https://api-sandbox.doku.com';
        
        $this->clientId = $this->getConfigValue('client_id');
        $this->secretKey = $this->getConfigValue('secret_key');
        
        if (empty($this->clientId) || empty($this->secretKey)) {
            throw new Exception('DOKU configuration is incomplete');
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getName(): string
    {
        return 'DOKU';
    }
    
    /**
     * {@inheritdoc}
     */
    public function createTransaction(array $data): array
    {
        $this->validateTransactionData($data);
        
        $orderId = $this->generateOrderId('INDO-');
        $amount = $data['amount'];
        $customerDetails = $this->formatCustomerDetails($data);
        $itemDetails = $this->formatItemDetails($data);
        
        $requestId = $this->generateRequestId();
        $requestTimestamp = gmdate('Y-m-d H:i:s');
        $requestTarget = '/checkout/v1/payment';
        
        $payload = [
            'order' => [
                'amount' => $amount,
                'invoice_number' => $orderId,
                'currency' => 'IDR',
                'callback_url' => $data['callback_url'] ?? '',
                'line_items' => $itemDetails
            ],
            'payment' => [
                'payment_due_date' => $this->calculateDueDate($data['expiry_duration'] ?? 60, $data['expiry_unit'] ?? 'minute')
            ],
            'customer' => $customerDetails
        ];
        
        // Add payment method if specified
        if (!empty($data['payment_method'])) {
            $payload['payment']['payment_method_types'] = [$data['payment_method']];
        }
        
        try {
            $signature = $this->generateSignature(
                'POST',
                $requestTarget,
                $requestId,
                $requestTimestamp,
                json_encode($payload)
            );
            
            $response = $this->makeHttpRequest(
                'POST',
                $this->baseUrl . $requestTarget,
                [
                    'Client-Id' => $this->clientId,
                    'Request-Id' => $requestId,
                    'Request-Timestamp' => $requestTimestamp,
                    'Signature' => $signature,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ],
                $payload
            );
            
            if ($response['status_code'] >= 200 && $response['status_code'] < 300) {
                $this->logActivity('Transaction created', [
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => true,
                    'transaction_id' => $response['data']['transaction']['transaction_id'] ?? $orderId,
                    'order_id' => $orderId,
                    'payment_method' => $data['payment_method'] ?? '',
                    'status' => 'pending',
                    'amount' => $amount,
                    'payment_url' => $response['data']['payment']['url'] ?? null,
                    'expiry_time' => $response['data']['payment']['payment_due_date'] ?? null,
                    'raw_response' => $response['data']
                ];
            } else {
                $this->logActivity('Transaction creation failed', [
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => false,
                    'message' => $response['data']['error']['message'] ?? 'Transaction creation failed',
                    'error_code' => $response['data']['error']['code'] ?? $response['status_code'],
                    'raw_response' => $response['data']
                ];
            }
        } catch (Exception $e) {
            $this->logActivity('Transaction creation exception', [
                'order_id' => $orderId,
                'amount' => $amount,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'exception'
            ];
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getTransactionStatus(string $transactionId): array
    {
        try {
            $requestId = $this->generateRequestId();
            $requestTimestamp = gmdate('Y-m-d H:i:s');
            $requestTarget = '/orders/v1/status/' . $transactionId;
            
            $signature = $this->generateSignature(
                'GET',
                $requestTarget,
                $requestId,
                $requestTimestamp
            );
            
            $response = $this->makeHttpRequest(
                'GET',
                $this->baseUrl . $requestTarget,
                [
                    'Client-Id' => $this->clientId,
                    'Request-Id' => $requestId,
                    'Request-Timestamp' => $requestTimestamp,
                    'Signature' => $signature,
                    'Accept' => 'application/json'
                ]
            );
            
            if ($response['status_code'] >= 200 && $response['status_code'] < 300) {
                $this->logActivity('Transaction status retrieved', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                // Map DOKU status to our status
                $statusMap = [
                    'SUCCESS' => 'success',
                    'FAILED' => 'failed',
                    'PENDING' => 'pending',
                    'EXPIRED' => 'expired',
                    'REFUNDED' => 'refunded',
                    'CANCELLED' => 'failed'
                ];
                
                $status = $statusMap[$response['data']['transaction']['status'] ?? ''] ?? 'pending';
                
                return [
                    'success' => true,
                    'transaction_id' => $response['data']['transaction']['transaction_id'] ?? $transactionId,
                    'order_id' => $response['data']['order']['invoice_number'] ?? '',
                    'payment_method' => $response['data']['transaction']['payment_method'] ?? '',
                    'status' => $status,
                    'amount' => $response['data']['order']['amount'] ?? 0,
                    'time' => $response['data']['transaction']['date'] ?? '',
                    'raw_response' => $response['data']
                ];
            } else {
                $this->logActivity('Transaction status retrieval failed', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => false,
                    'message' => $response['data']['error']['message'] ?? 'Transaction status retrieval failed',
                    'error_code' => $response['data']['error']['code'] ?? $response['status_code'],
                    'raw_response' => $response['data']
                ];
            }
        } catch (Exception $e) {
            $this->logActivity('Transaction status exception', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'exception'
            ];
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function handleNotification(array $data): array
    {
        try {
            // Verify notification signature
            $headers = getallheaders();
            $clientId = $headers['Client-Id'] ?? '';
            $requestId = $headers['Request-Id'] ?? '';
            $requestTimestamp = $headers['Request-Timestamp'] ?? '';
            $signature = $headers['Signature'] ?? '';
            
            if (empty($clientId) || empty($requestId) || empty($requestTimestamp) || empty($signature)) {
                $this->logActivity('Missing notification headers', [
                    'headers' => $headers
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Missing required headers',
                    'error_code' => 'invalid_headers'
                ];
            }
            
            // Verify client ID
            if ($clientId !== $this->clientId) {
                $this->logActivity('Invalid client ID in notification', [
                    'received' => $clientId,
                    'expected' => $this->clientId
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Invalid client ID',
                    'error_code' => 'invalid_client'
                ];
            }
            
            // Verify signature
            $requestTarget = '/checkout/v1/payment/notification';
            $expectedSignature = $this->generateSignature(
                'POST',
                $requestTarget,
                $requestId,
                $requestTimestamp,
                json_encode($data)
            );
            
            if ($signature !== $expectedSignature) {
                $this->logActivity('Invalid notification signature', [
                    'received' => $signature,
                    'expected' => $expectedSignature
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Invalid signature',
                    'error_code' => 'invalid_signature'
                ];
            }
            
            // Map DOKU status to our status
            $statusMap = [
                'SUCCESS' => 'success',
                'FAILED' => 'failed',
                'PENDING' => 'pending',
                'EXPIRED' => 'expired',
                'REFUNDED' => 'refunded',
                'CANCELLED' => 'failed'
            ];
            
            $status = $statusMap[$data['transaction']['status'] ?? ''] ?? 'pending';
            $transactionId = $data['transaction']['transaction_id'] ?? '';
            
            $this->logActivity('Notification received', [
                'transaction_id' => $transactionId,
                'status' => $status,
                'data' => $data
            ]);
            
            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'order_id' => $data['order']['invoice_number'] ?? '',
                'payment_method' => $data['transaction']['payment_method'] ?? '',
                'status' => $status,
                'amount' => $data['order']['amount'] ?? 0,
                'time' => $data['transaction']['date'] ?? '',
                'raw_response' => $data
            ];
        } catch (Exception $e) {
            $this->logActivity('Notification handling exception', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'exception'
            ];
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function cancelTransaction(string $transactionId): array
    {
        try {
            $requestId = $this->generateRequestId();
            $requestTimestamp = gmdate('Y-m-d H:i:s');
            $requestTarget = '/orders/v1/cancel/' . $transactionId;
            
            $signature = $this->generateSignature(
                'POST',
                $requestTarget,
                $requestId,
                $requestTimestamp
            );
            
            $response = $this->makeHttpRequest(
                'POST',
                $this->baseUrl . $requestTarget,
                [
                    'Client-Id' => $this->clientId,
                    'Request-Id' => $requestId,
                    'Request-Timestamp' => $requestTimestamp,
                    'Signature' => $signature,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ]
            );
            
            if ($response['status_code'] >= 200 && $response['status_code'] < 300) {
                $this->logActivity('Transaction cancelled', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => true,
                    'transaction_id' => $transactionId,
                    'status' => 'cancelled',
                    'raw_response' => $response['data']
                ];
            } else {
                $this->logActivity('Transaction cancellation failed', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => false,
                    'message' => $response['data']['error']['message'] ?? 'Transaction cancellation failed',
                    'error_code' => $response['data']['error']['code'] ?? $response['status_code'],
                    'raw_response' => $response['data']
                ];
            }
        } catch (Exception $e) {
            $this->logActivity('Transaction cancellation exception', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'exception'
            ];
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getPaymentMethods(): array
    {
        return $this->paymentMethods;
    }
    
    /**
     * {@inheritdoc}
     */
    public function validateConfig(array $config): bool
    {
        $requiredFields = $this->getRequiredConfigFields();
        
        foreach ($requiredFields as $field) {
            if (empty($config[$field])) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getRequiredConfigFields(): array
    {
        return [
            'client_id',
            'secret_key'
        ];
    }
    
    /**
     * Validate transaction data
     * 
     * @param array $data
     * @throws Exception
     */
    private function validateTransactionData(array $data): void
    {
        if (empty($data['amount']) || !is_numeric($data['amount'])) {
            throw new Exception('Invalid amount');
        }
        
        if (empty($data['customer_name'])) {
            throw new Exception('Customer name is required');
        }
        
        if (empty($data['customer_email'])) {
            throw new Exception('Customer email is required');
        }
        
        if (!empty($data['payment_method']) && !in_array($data['payment_method'], $this->paymentMethods)) {
            throw new Exception('Invalid payment method');
        }
    }
    
    /**
     * Format customer details for DOKU
     * 
     * @param array $data
     * @return array
     */
    private function formatCustomerDetails(array $data): array
    {
        return [
            'name' => $data['customer_name'],
            'email' => $data['customer_email'],
            'phone' => $data['customer_phone'] ?? '',
            'address' => $data['customer_address'] ?? '',
            'country' => 'ID'
        ];
    }
    
    /**
     * Format item details for DOKU
     * 
     * @param array $data
     * @return array
     */
    private function formatItemDetails(array $data): array
    {
        if (!empty($data['items']) && is_array($data['items'])) {
            $formattedItems = [];
            foreach ($data['items'] as $item) {
                $formattedItems[] = [
                    'name' => $item['name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'sku' => $item['id'] ?? 'WATER-CREDIT'
                ];
            }
            return $formattedItems;
        }
        
        // Default item if not provided
        return [
            [
                'name' => $data['item_name'] ?? 'Water Credit',
                'price' => $data['amount'],
                'quantity' => 1,
                'sku' => 'WATER-CREDIT'
            ]
        ];
    }
    
    /**
     * Generate a unique request ID
     * 
     * @return string
     */
    private function generateRequestId(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
    
    /**
     * Calculate payment due date
     * 
     * @param int $duration
     * @param string $unit
     * @return string
     */
    private function calculateDueDate(int $duration, string $unit): string
    {
        $now = new \DateTime();
        
        switch ($unit) {
            case 'minute':
                $now->add(new \DateInterval('PT' . $duration . 'M'));
                break;
            case 'hour':
                $now->add(new \DateInterval('PT' . $duration . 'H'));
                break;
            case 'day':
                $now->add(new \DateInterval('P' . $duration . 'D'));
                break;
            default:
                $now->add(new \DateInterval('PT' . $duration . 'M'));
        }
        
        return $now->format('Y-m-d H:i:s');
    }
    
    /**
     * Generate DOKU signature
     * 
     * @param string $httpMethod
     * @param string $requestTarget
     * @param string $requestId
     * @param string $requestTimestamp
     * @param string $requestBody
     * @return string
     */
    private function generateSignature(
        string $httpMethod,
        string $requestTarget,
        string $requestId,
        string $requestTimestamp,
        string $requestBody = ''
    ): string {
        $digest = '';
        
        if (!empty($requestBody)) {
            $digest = base64_encode(hash('sha256', $requestBody, true));
        }
        
        $componentToSign = "Client-Id:" . $this->clientId . "\n" .
                          "Request-Id:" . $requestId . "\n" .
                          "Request-Timestamp:" . $requestTimestamp . "\n" .
                          "Request-Target:" . $requestTarget;
        
        if (!empty($digest)) {
            $componentToSign .= "\n" . "Digest:" . $digest;
        }
        
        $signature = base64_encode(hash_hmac('sha256', $componentToSign, $this->secretKey, true));
        
        return 'HMACSHA256=' . $signature;
    }
}