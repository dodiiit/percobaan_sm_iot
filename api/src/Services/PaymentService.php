<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use IndoWater\Api\Models\Payment;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use Doku\Snap\Snap as DokuSnap;
use Doku\Snap\Models\VA\Request\CreateVaRequestDto;
use Doku\Snap\Models\TotalAmount\TotalAmount;
use Doku\Snap\Models\VA\AdditionalInfo\CreateVaRequestAdditionalInfo;
use Doku\Snap\Models\VA\VirtualAccountConfig\CreateVaVirtualAccountConfig;

class PaymentService
{
    private Payment $paymentModel;
    private array $midtransConfig;
    private array $dokuConfig;
    private $meterModel;
    private $emailService;
    private $realtimeService;
    private $serviceFeeService;
    private DokuSnap $dokuSnap;

    public function __construct(
        Payment $paymentModel, 
        array $midtransConfig, 
        array $dokuConfig,
        $meterModel = null,
        $emailService = null,
        $realtimeService = null,
        $serviceFeeService = null
    ) {
        $this->paymentModel = $paymentModel;
        $this->midtransConfig = $midtransConfig;
        $this->dokuConfig = $dokuConfig;
        $this->meterModel = $meterModel;
        $this->emailService = $emailService;
        $this->realtimeService = $realtimeService;
        $this->serviceFeeService = $serviceFeeService;

        // Configure Midtrans
        Config::$serverKey = $midtransConfig['server_key'];
        Config::$isProduction = $midtransConfig['environment'] === 'production';
        Config::$isSanitized = true;
        Config::$is3ds = true;

        // Configure DOKU
        $this->dokuSnap = new DokuSnap(
            $dokuConfig['private_key'],
            $dokuConfig['public_key'],
            $dokuConfig['doku_public_key'],
            $dokuConfig['client_id'],
            $dokuConfig['issuer'] ?? 'IndoWater',
            $dokuConfig['environment'] === 'production',
            $dokuConfig['secret_key']
        );
    }

    public function createPayment(array $paymentData): array
    {
        // Create payment record
        $payment = $this->paymentModel->create([
            'customer_id' => $paymentData['customer_id'],
            'amount' => $paymentData['amount'],
            'method' => $paymentData['method'],
            'status' => 'pending',
            'description' => $paymentData['description'] ?? 'Water credit top-up'
        ]);

        // Generate payment URL based on method
        switch ($paymentData['method']) {
            case 'midtrans':
                $paymentUrl = $this->createMidtransPayment($payment, $paymentData);
                break;
            case 'doku':
                $paymentUrl = $this->createDokuPayment($payment, $paymentData);
                break;
            default:
                throw new \Exception('Unsupported payment method');
        }

        // Update payment with external ID and URL
        $this->paymentModel->update($payment['id'], [
            'payment_url' => $paymentUrl
        ]);

        return array_merge($payment, ['payment_url' => $paymentUrl]);
    }

    public function handleWebhook(string $method, array $data): array
    {
        switch ($method) {
            case 'midtrans':
                return $this->handleMidtransWebhook($data);
            case 'doku':
                return $this->handleDokuWebhook($data);
            default:
                throw new \Exception('Unsupported payment method');
        }
    }

    public function checkPaymentStatus(string $paymentId): array
    {
        $payment = $this->paymentModel->find($paymentId);
        
        if (!$payment) {
            throw new \Exception('Payment not found');
        }

        // Check status with payment gateway
        switch ($payment['method']) {
            case 'midtrans':
                $status = $this->checkMidtransStatus($payment['external_id']);
                break;
            case 'doku':
                $status = $this->checkDokuStatus($payment['external_id']);
                break;
            default:
                $status = ['status' => $payment['status']];
        }

        // Update payment status if changed
        if ($status['status'] !== $payment['status']) {
            $this->paymentModel->update($paymentId, [
                'status' => $status['status'],
                'paid_at' => $status['status'] === 'success' ? date('Y-m-d H:i:s') : null
            ]);
        }

        return array_merge($payment, $status);
    }

    private function createMidtransPayment(array $payment, array $paymentData): string
    {
        $params = [
            'transaction_details' => [
                'order_id' => $payment['id'],
                'gross_amount' => (int) $payment['amount']
            ],
            'customer_details' => [
                'first_name' => $paymentData['customer_name'] ?? 'Customer',
                'email' => $paymentData['customer_email'] ?? '',
                'phone' => $paymentData['customer_phone'] ?? ''
            ],
            'item_details' => [
                [
                    'id' => 'water-credit',
                    'price' => (int) $payment['amount'],
                    'quantity' => 1,
                    'name' => $payment['description']
                ]
            ],
            'callbacks' => [
                'finish' => $paymentData['return_url'] ?? '',
                'error' => $paymentData['return_url'] ?? '',
                'pending' => $paymentData['return_url'] ?? ''
            ]
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            
            // Update payment with external ID
            $this->paymentModel->update($payment['id'], [
                'external_id' => $payment['id'],
                'snap_token' => $snapToken
            ]);

            return Config::$isProduction 
                ? 'https://app.midtrans.com/snap/v2/vtweb/' . $snapToken
                : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $snapToken;

        } catch (\Exception $e) {
            throw new \Exception('Failed to create Midtrans payment: ' . $e->getMessage());
        }
    }

    private function createDokuPayment(array $payment, array $paymentData): string
    {
        try {
            // Generate virtual account number
            $partnerServiceId = $this->dokuConfig['partner_service_id'] ?? '8129014';
            $customerNo = $paymentData['customer_id'] ?? 'customer_' . $payment['id'];
            $virtualAccountNo = $partnerServiceId . substr($customerNo, -8);

            // Create total amount
            $totalAmount = new TotalAmount(
                number_format($payment['amount'], 2, '.', ''),
                'IDR'
            );

            // Create additional info
            $additionalInfo = new CreateVaRequestAdditionalInfo(
                'VIRTUAL_ACCOUNT_BANK_BCA',
                new CreateVaVirtualAccountConfig(false) // reusableStatus = false for one-time use
            );

            // Create VA request
            $createVaRequest = new CreateVaRequestDto(
                $partnerServiceId,
                $customerNo,
                $virtualAccountNo,
                $paymentData['customer_name'] ?? 'Customer',
                $paymentData['customer_email'] ?? '',
                $paymentData['customer_phone'] ?? '',
                $payment['id'], // trxId
                $totalAmount,
                $additionalInfo,
                'C', // virtualAccountTrxType (C = Closed Amount)
                date('c', strtotime('+24 hours')) // expiredDate (24 hours from now)
            );

            // Create virtual account
            $response = $this->dokuSnap->createVa($createVaRequest);

            // Update payment with external ID and VA details
            $this->paymentModel->update($payment['id'], [
                'external_id' => $virtualAccountNo,
                'gateway_response' => json_encode([
                    'virtual_account_no' => $virtualAccountNo,
                    'response' => $response
                ])
            ]);

            // Return payment instructions URL or virtual account number
            return $this->dokuConfig['environment'] === 'production' 
                ? 'https://doku.com/payment/' . $virtualAccountNo
                : 'https://staging.doku.com/payment/' . $virtualAccountNo;

        } catch (\Exception $e) {
            throw new \Exception('Failed to create DOKU payment: ' . $e->getMessage());
        }
    }

    private function handleMidtransWebhook(array $data): array
    {
        try {
            // Validate required fields
            $requiredFields = ['order_id', 'transaction_status', 'status_code', 'gross_amount', 'signature_key'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new \Exception("Missing required field: {$field}");
                }
            }

            $orderId = $data['order_id'];
            $transactionStatus = $data['transaction_status'];
            $fraudStatus = $data['fraud_status'] ?? '';

            // Find existing payment
            $payment = $this->paymentModel->find($orderId);
            if (!$payment) {
                throw new \Exception("Payment not found: {$orderId}");
            }

            // Verify signature
            $signatureKey = hash('sha512', $orderId . $data['status_code'] . $data['gross_amount'] . Config::$serverKey);
            
            if (!hash_equals($signatureKey, $data['signature_key'])) {
                throw new \Exception('Invalid Midtrans signature');
            }

            // Verify amount matches
            if ((float) $data['gross_amount'] !== (float) $payment['amount']) {
                throw new \Exception('Amount mismatch in webhook');
            }

            // Determine payment status
            $status = $this->mapMidtransStatus($transactionStatus, $fraudStatus);

            // Only update if status has changed
            if ($status !== $payment['status']) {
                $updateData = [
                    'status' => $status,
                    'gateway_response' => json_encode($data),
                    'updated_at' => date('Y-m-d H:i:s')
                ];

                if ($status === 'success') {
                    $updateData['paid_at'] = date('Y-m-d H:i:s');
                }

                $payment = $this->paymentModel->update($orderId, $updateData);

                // Process successful payment
                if ($status === 'success') {
                    $this->processSuccessfulPayment($payment);
                }
            }

            return [
                'status' => $status,
                'payment_id' => $orderId,
                'transaction_status' => $transactionStatus,
                'processed' => true
            ];

        } catch (\Exception $e) {
            throw new \Exception('Failed to process Midtrans webhook: ' . $e->getMessage());
        }
    }

    /**
     * Map Midtrans transaction status to internal status
     */
    private function mapMidtransStatus(string $transactionStatus, string $fraudStatus = ''): string
    {
        switch ($transactionStatus) {
            case 'capture':
                return ($fraudStatus === 'challenge') ? 'pending' : 'success';
            case 'settlement':
                return 'success';
            case 'pending':
                return 'pending';
            case 'cancel':
            case 'deny':
            case 'expire':
            case 'failure':
                return 'failed';
            default:
                return 'pending';
        }
    }

    private function handleDokuWebhook(array $data): array
    {
        try {
            // Validate webhook structure
            if (!isset($data['order']) || !isset($data['transaction'])) {
                throw new \Exception('Invalid DOKU webhook structure');
            }

            $invoiceNumber = $data['order']['invoice_number'] ?? '';
            $transactionStatus = $data['transaction']['status'] ?? '';
            $amount = $data['order']['amount'] ?? 0;
            $virtualAccountNo = $data['virtual_account_info']['virtual_account_number'] ?? '';

            // Validate required fields
            if (empty($invoiceNumber)) {
                throw new \Exception('Missing invoice number in DOKU webhook');
            }

            // Find existing payment
            $payment = $this->paymentModel->find($invoiceNumber);
            if (!$payment) {
                // Try to find by external_id (virtual account number)
                $payment = $this->paymentModel->findByExternalId($virtualAccountNo);
                if (!$payment) {
                    throw new \Exception("Payment not found: {$invoiceNumber}");
                }
            }

            // Verify signature
            $signature = $this->generateDokuSignature($data);
            if (!hash_equals($signature, $data['security']['checksum'] ?? '')) {
                throw new \Exception('Invalid DOKU signature');
            }

            // Verify amount matches
            if ((float) $amount !== (float) $payment['amount']) {
                throw new \Exception('Amount mismatch in DOKU webhook');
            }

            // Determine payment status
            $status = $this->mapDokuStatus($transactionStatus);

            // Only update if status has changed
            if ($status !== $payment['status']) {
                $updateData = [
                    'status' => $status,
                    'gateway_response' => json_encode($data),
                    'updated_at' => date('Y-m-d H:i:s')
                ];

                if ($status === 'success') {
                    $updateData['paid_at'] = date('Y-m-d H:i:s');
                }

                $payment = $this->paymentModel->update($payment['id'], $updateData);

                // Process successful payment
                if ($status === 'success') {
                    $this->processSuccessfulPayment($payment);
                }
            }

            return [
                'status' => $status,
                'payment_id' => $payment['id'],
                'invoice_number' => $invoiceNumber,
                'transaction_status' => $transactionStatus,
                'processed' => true
            ];

        } catch (\Exception $e) {
            throw new \Exception('Failed to process DOKU webhook: ' . $e->getMessage());
        }
    }

    /**
     * Map DOKU transaction status to internal status
     */
    private function mapDokuStatus(string $transactionStatus): string
    {
        switch (strtoupper($transactionStatus)) {
            case 'SUCCESS':
            case 'SETTLEMENT':
                return 'success';
            case 'FAILED':
            case 'EXPIRED':
            case 'CANCELLED':
                return 'failed';
            case 'PENDING':
            case 'PROCESSING':
            default:
                return 'pending';
        }
    }

    private function checkMidtransStatus(string $orderId): array
    {
        try {
            $status = Transaction::status($orderId);
            
            $paymentStatus = 'pending';
            if ($status->transaction_status === 'capture') {
                $paymentStatus = ($status->fraud_status === 'challenge') ? 'pending' : 'success';
            } elseif ($status->transaction_status === 'settlement') {
                $paymentStatus = 'success';
            } elseif (in_array($status->transaction_status, ['cancel', 'deny', 'expire'])) {
                $paymentStatus = 'failed';
            }

            return [
                'status' => $paymentStatus,
                'gateway_status' => $status->transaction_status,
                'gateway_response' => json_encode($status)
            ];

        } catch (\Exception $e) {
            return ['status' => 'unknown', 'error' => $e->getMessage()];
        }
    }

    private function checkDokuStatus(string $virtualAccountNo): array
    {
        try {
            // For DOKU VA, we need to check the status using the inquiry method
            // This would typically be done through webhook notifications
            // For now, return a basic status check
            
            $payment = $this->paymentModel->findByExternalId($virtualAccountNo);
            if (!$payment) {
                return ['status' => 'unknown', 'error' => 'Payment not found'];
            }

            // In a real implementation, you would call DOKU's inquiry API
            // For now, return the current status from database
            return [
                'status' => $payment['status'],
                'gateway_status' => $payment['status'],
                'gateway_response' => $payment['gateway_response'] ?? '{}'
            ];

        } catch (\Exception $e) {
            return ['status' => 'unknown', 'error' => $e->getMessage()];
        }
    }

    private function processSuccessfulPayment(array $payment): void
    {
        try {
            // Add credit to customer's meter if meter model is available
            if ($this->meterModel && isset($payment['meter_id'])) {
                $this->addCreditToMeter($payment);
            }

            // Calculate and record service fees if service fee service is available
            if ($this->serviceFeeService) {
                $this->calculateAndRecordServiceFees($payment);
            }

            // Send confirmation email if email service is available
            if ($this->emailService && isset($payment['customer_email'])) {
                $this->sendPaymentConfirmationEmail($payment);
            }

            // Send real-time notification if realtime service is available
            if ($this->realtimeService) {
                $this->sendPaymentNotification($payment);
            }

        } catch (\Exception $e) {
            // Log error but don't throw to avoid breaking the payment flow
            error_log('Error processing successful payment: ' . $e->getMessage());
        }
    }
    
    private function calculateAndRecordServiceFees(array $payment): void
    {
        if (!$this->serviceFeeService) {
            return;
        }

        try {
            // Calculate and record service fees
            $feeResult = $this->serviceFeeService->calculateAndRecordFees($payment);
            
            // Update payment record with fee information
            $feeInfo = [
                'service_fee_amount' => $feeResult['total_fee'],
                'service_fee_transactions' => array_map(function($tx) {
                    return $tx['id'];
                }, $feeResult['fee_transactions'])
            ];
            
            $this->paymentModel->update($payment['id'], [
                'gateway_response' => json_encode(array_merge(
                    json_decode($payment['gateway_response'] ?? '{}', true),
                    ['service_fees' => $feeInfo]
                ))
            ]);
            
        } catch (\Exception $e) {
            error_log('Error calculating service fees: ' . $e->getMessage());
        }
    }

    private function addCreditToMeter(array $payment): void
    {
        if (!$this->meterModel) {
            return;
        }

        try {
            // Find meter by customer ID or meter ID
            $meter = null;
            
            if (isset($payment['meter_id'])) {
                $meter = $this->meterModel->find($payment['meter_id']);
            } elseif (isset($payment['customer_id'])) {
                // Find customer's primary meter
                $sql = "SELECT * FROM meters WHERE customer_id = ? AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1";
                $stmt = $this->meterModel->db->prepare($sql);
                $stmt->execute([$payment['customer_id']]);
                $meter = $stmt->fetch(\PDO::FETCH_ASSOC);
            }

            if (!$meter) {
                throw new \Exception('No meter found for payment');
            }

            // Add credit to meter
            $description = 'Payment credit top-up - Payment ID: ' . $payment['external_id'];
            $result = $this->meterModel->addCredit($meter['id'], $payment['amount'], $description);

            // Update payment record with meter information
            $this->paymentModel->update($payment['id'], [
                'meter_id' => $meter['id'],
                'gateway_response' => json_encode(array_merge(
                    json_decode($payment['gateway_response'] ?? '{}', true),
                    ['credit_added' => $result]
                ))
            ]);

            // Send real-time meter update
            if ($this->realtimeService) {
                $this->realtimeService->broadcastMeterUpdate($meter['meter_id'], [
                    'type' => 'payment_credit_added',
                    'amount' => $payment['amount'],
                    'new_balance' => $result['new_balance'],
                    'payment_id' => $payment['external_id'],
                    'timestamp' => time()
                ]);
            }

        } catch (\Exception $e) {
            error_log('Error adding credit to meter: ' . $e->getMessage());
            throw $e;
        }
    }

    private function sendPaymentConfirmationEmail(array $payment): void
    {
        if (!$this->emailService) {
            return;
        }

        try {
            $this->emailService->sendPaymentConfirmation([
                'to' => $payment['customer_email'],
                'name' => $payment['customer_name'] ?? 'Customer',
                'amount' => $payment['amount'],
                'payment_id' => $payment['external_id'],
                'payment_method' => $payment['method'],
                'paid_at' => $payment['paid_at'] ?? date('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            error_log('Error sending payment confirmation email: ' . $e->getMessage());
        }
    }

    private function sendPaymentNotification(array $payment): void
    {
        if (!$this->realtimeService) {
            return;
        }

        try {
            $this->realtimeService->broadcastNotification([
                'type' => 'payment_success',
                'title' => 'Payment Successful',
                'message' => 'Your payment of Rp ' . number_format($payment['amount'], 0, ',', '.') . ' has been processed successfully.',
                'customer_id' => $payment['customer_id'],
                'payment_id' => $payment['external_id'],
                'amount' => $payment['amount'],
                'timestamp' => time()
            ]);
        } catch (\Exception $e) {
            error_log('Error sending payment notification: ' . $e->getMessage());
        }
    }

    private function generateDokuSignature(array $data): string
    {
        // Generate DOKU signature for webhook verification
        $clientId = $this->dokuConfig['client_id'];
        $requestId = $data['header']['request_id'] ?? '';
        $requestTimestamp = $data['header']['request_timestamp'] ?? '';
        $requestTarget = '/v1/payment/notification';
        $digest = hash('sha256', json_encode($data));
        
        $componentSignature = "Client-Id:" . $clientId . "\n" .
                             "Request-Id:" . $requestId . "\n" .
                             "Request-Timestamp:" . $requestTimestamp . "\n" .
                             "Request-Target:" . $requestTarget . "\n" .
                             "Digest:SHA-256=" . $digest;

        return base64_encode(hash_hmac('sha256', $componentSignature, $this->dokuConfig['secret_key'], true));
    }
}