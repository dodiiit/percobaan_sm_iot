<?php

namespace App\Services\PaymentGateway;

use App\Models\PaymentGateway;
use Exception;
use Psr\Log\LoggerInterface;

/**
 * MidtransGateway
 * 
 * Implementation of Midtrans payment gateway
 */
class MidtransGateway extends AbstractPaymentGateway
{
    /**
     * @var string
     */
    private $baseUrl;
    
    /**
     * @var string
     */
    private $serverKey;
    
    /**
     * @var string
     */
    private $clientKey;
    
    /**
     * @var array
     */
    private $paymentMethods = [
        'credit_card',
        'bank_transfer',
        'gopay',
        'shopeepay',
        'qris',
        'indomaret',
        'alfamart',
        'akulaku',
        'kredivo'
    ];
    
    /**
     * {@inheritdoc}
     */
    protected function initialize(): void
    {
        $this->baseUrl = $this->isProduction()
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
        
        $this->serverKey = $this->getConfigValue('server_key');
        $this->clientKey = $this->getConfigValue('client_key');
        
        if (empty($this->serverKey) || empty($this->clientKey)) {
            throw new Exception('Midtrans configuration is incomplete');
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getName(): string
    {
        return 'Midtrans';
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
        
        $transactionDetails = [
            'order_id' => $orderId,
            'gross_amount' => $amount
        ];
        
        $payload = [
            'transaction_details' => $transactionDetails,
            'customer_details' => $customerDetails,
            'item_details' => $itemDetails
        ];
        
        // Add payment type if specified
        if (!empty($data['payment_type'])) {
            $payload['payment_type'] = $data['payment_type'];
            
            // Add payment method specific details
            switch ($data['payment_type']) {
                case 'credit_card':
                    $payload['credit_card'] = [
                        'secure' => true,
                        'save_card' => false
                    ];
                    break;
                    
                case 'bank_transfer':
                    if (!empty($data['bank'])) {
                        $payload['bank_transfer'] = [
                            'bank' => $data['bank']
                        ];
                    }
                    break;
                    
                case 'gopay':
                case 'shopeepay':
                    // These payment methods don't need additional configuration
                    break;
                    
                case 'qris':
                    $payload['qris'] = [
                        'acquirer' => 'gopay'
                    ];
                    break;
            }
        }
        
        // Add expiry if specified
        if (!empty($data['expiry_duration'])) {
            $payload['expiry'] = [
                'unit' => $data['expiry_unit'] ?? 'minute',
                'duration' => (int)$data['expiry_duration']
            ];
        }
        
        // Add callback URLs
        $payload['callbacks'] = [
            'finish' => $data['finish_url'] ?? '',
            'error' => $data['error_url'] ?? '',
            'pending' => $data['pending_url'] ?? ''
        ];
        
        try {
            $response = $this->makeHttpRequest(
                'POST',
                $this->baseUrl . '/v2/charge',
                [
                    'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
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
                    'transaction_id' => $response['data']['transaction_id'] ?? $orderId,
                    'order_id' => $orderId,
                    'payment_type' => $response['data']['payment_type'] ?? $data['payment_type'] ?? '',
                    'status' => $response['data']['transaction_status'] ?? 'pending',
                    'amount' => $amount,
                    'redirect_url' => $response['data']['redirect_url'] ?? null,
                    'payment_url' => $response['data']['payment_url'] ?? null,
                    'qr_code_url' => $response['data']['qr_code_url'] ?? null,
                    'actions' => $response['data']['actions'] ?? [],
                    'expiry_time' => $response['data']['expiry_time'] ?? null,
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
                    'message' => $response['data']['status_message'] ?? 'Transaction creation failed',
                    'error_code' => $response['data']['status_code'] ?? $response['status_code'],
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
            $response = $this->makeHttpRequest(
                'GET',
                $this->baseUrl . '/v2/' . $transactionId . '/status',
                [
                    'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
                    'Accept' => 'application/json'
                ]
            );
            
            if ($response['status_code'] >= 200 && $response['status_code'] < 300) {
                $this->logActivity('Transaction status retrieved', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => true,
                    'transaction_id' => $response['data']['transaction_id'] ?? $transactionId,
                    'order_id' => $response['data']['order_id'] ?? '',
                    'payment_type' => $response['data']['payment_type'] ?? '',
                    'status' => $response['data']['transaction_status'] ?? 'unknown',
                    'amount' => $response['data']['gross_amount'] ?? 0,
                    'time' => $response['data']['transaction_time'] ?? '',
                    'raw_response' => $response['data']
                ];
            } else {
                $this->logActivity('Transaction status retrieval failed', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => false,
                    'message' => $response['data']['status_message'] ?? 'Transaction status retrieval failed',
                    'error_code' => $response['data']['status_code'] ?? $response['status_code'],
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
            // Verify notification signature if available
            if (isset($data['signature_key'])) {
                $orderId = $data['order_id'] ?? '';
                $statusCode = $data['status_code'] ?? '';
                $grossAmount = $data['gross_amount'] ?? '';
                $serverKey = $this->serverKey;
                
                $signatureKey = openssl_digest($orderId . $statusCode . $grossAmount . $serverKey, 'sha512');
                
                if ($signatureKey !== $data['signature_key']) {
                    $this->logActivity('Invalid notification signature', [
                        'received' => $data['signature_key'],
                        'calculated' => $signatureKey
                    ]);
                    
                    return [
                        'success' => false,
                        'message' => 'Invalid signature',
                        'error_code' => 'invalid_signature'
                    ];
                }
            }
            
            $transactionId = $data['transaction_id'] ?? ($data['order_id'] ?? '');
            
            // Map Midtrans status to our status
            $statusMap = [
                'capture' => 'success',
                'settlement' => 'success',
                'pending' => 'pending',
                'deny' => 'failed',
                'cancel' => 'failed',
                'expire' => 'expired',
                'refund' => 'refunded'
            ];
            
            $status = $statusMap[$data['transaction_status'] ?? ''] ?? 'pending';
            
            $this->logActivity('Notification received', [
                'transaction_id' => $transactionId,
                'status' => $status,
                'data' => $data
            ]);
            
            return [
                'success' => true,
                'transaction_id' => $transactionId,
                'order_id' => $data['order_id'] ?? '',
                'payment_type' => $data['payment_type'] ?? '',
                'status' => $status,
                'amount' => $data['gross_amount'] ?? 0,
                'time' => $data['transaction_time'] ?? '',
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
            $response = $this->makeHttpRequest(
                'POST',
                $this->baseUrl . '/v2/' . $transactionId . '/cancel',
                [
                    'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
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
                    'transaction_id' => $response['data']['transaction_id'] ?? $transactionId,
                    'order_id' => $response['data']['order_id'] ?? '',
                    'status' => $response['data']['transaction_status'] ?? 'cancel',
                    'raw_response' => $response['data']
                ];
            } else {
                $this->logActivity('Transaction cancellation failed', [
                    'transaction_id' => $transactionId,
                    'response' => $response['data']
                ]);
                
                return [
                    'success' => false,
                    'message' => $response['data']['status_message'] ?? 'Transaction cancellation failed',
                    'error_code' => $response['data']['status_code'] ?? $response['status_code'],
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
            'server_key',
            'client_key'
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
        
        if (!empty($data['payment_type']) && !in_array($data['payment_type'], $this->paymentMethods)) {
            throw new Exception('Invalid payment type');
        }
    }
    
    /**
     * Format customer details for Midtrans
     * 
     * @param array $data
     * @return array
     */
    private function formatCustomerDetails(array $data): array
    {
        return [
            'first_name' => $data['customer_first_name'] ?? $data['customer_name'],
            'last_name' => $data['customer_last_name'] ?? '',
            'email' => $data['customer_email'],
            'phone' => $data['customer_phone'] ?? '',
            'billing_address' => [
                'first_name' => $data['customer_first_name'] ?? $data['customer_name'],
                'last_name' => $data['customer_last_name'] ?? '',
                'email' => $data['customer_email'],
                'phone' => $data['customer_phone'] ?? '',
                'address' => $data['customer_address'] ?? '',
                'city' => $data['customer_city'] ?? '',
                'postal_code' => $data['customer_postal_code'] ?? '',
                'country_code' => 'IDN'
            ]
        ];
    }
    
    /**
     * Format item details for Midtrans
     * 
     * @param array $data
     * @return array
     */
    private function formatItemDetails(array $data): array
    {
        if (!empty($data['items']) && is_array($data['items'])) {
            return $data['items'];
        }
        
        // Default item if not provided
        return [
            [
                'id' => 'WATER-CREDIT',
                'price' => $data['amount'],
                'quantity' => 1,
                'name' => $data['item_name'] ?? 'Water Credit'
            ]
        ];
    }
}