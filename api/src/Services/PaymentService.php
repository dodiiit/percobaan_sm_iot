<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use IndoWater\Api\Models\Payment;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class PaymentService
{
    private Payment $paymentModel;
    private array $midtransConfig;
    private array $dokuConfig;
    private $meterModel;
    private $emailService;
    private $realtimeService;

    public function __construct(
        Payment $paymentModel, 
        array $midtransConfig, 
        array $dokuConfig,
        $meterModel = null,
        $emailService = null,
        $realtimeService = null
    ) {
        $this->paymentModel = $paymentModel;
        $this->midtransConfig = $midtransConfig;
        $this->dokuConfig = $dokuConfig;
        $this->meterModel = $meterModel;
        $this->emailService = $emailService;
        $this->realtimeService = $realtimeService;

        // Configure Midtrans
        Config::$serverKey = $midtransConfig['server_key'];
        Config::$isProduction = $midtransConfig['environment'] === 'production';
        Config::$isSanitized = true;
        Config::$is3ds = true;
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
        // DOKU payment implementation
        $params = [
            'amount' => $payment['amount'],
            'invoice_number' => $payment['id'],
            'currency' => 'IDR',
            'session_id' => session_id(),
            'customer' => [
                'name' => $paymentData['customer_name'] ?? 'Customer',
                'email' => $paymentData['customer_email'] ?? '',
                'phone' => $paymentData['customer_phone'] ?? ''
            ]
        ];

        // This would integrate with DOKU API
        // For now, return a placeholder URL
        return 'https://staging.doku.com/Suite/Receive/' . $payment['id'];
    }

    private function handleMidtransWebhook(array $data): array
    {
        try {
            $orderId = $data['order_id'];
            $transactionStatus = $data['transaction_status'];
            $fraudStatus = $data['fraud_status'] ?? '';

            // Verify signature
            $signatureKey = hash('sha512', $orderId . $data['status_code'] . $data['gross_amount'] . Config::$serverKey);
            
            if ($signatureKey !== $data['signature_key']) {
                throw new \Exception('Invalid signature');
            }

            // Determine payment status
            $status = 'pending';
            if ($transactionStatus === 'capture') {
                $status = ($fraudStatus === 'challenge') ? 'pending' : 'success';
            } elseif ($transactionStatus === 'settlement') {
                $status = 'success';
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $status = 'failed';
            }

            // Update payment
            $payment = $this->paymentModel->update($orderId, [
                'status' => $status,
                'paid_at' => $status === 'success' ? date('Y-m-d H:i:s') : null,
                'gateway_response' => json_encode($data)
            ]);

            // Process successful payment
            if ($status === 'success') {
                $this->processSuccessfulPayment($payment);
            }

            return ['status' => $status, 'payment' => $payment];

        } catch (\Exception $e) {
            throw new \Exception('Failed to process Midtrans webhook: ' . $e->getMessage());
        }
    }

    private function handleDokuWebhook(array $data): array
    {
        // DOKU webhook implementation
        // This would process DOKU webhook data
        return ['status' => 'pending'];
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

    private function checkDokuStatus(string $invoiceNumber): array
    {
        // DOKU status check implementation
        return ['status' => 'pending'];
    }

    private function processSuccessfulPayment(array $payment): void
    {
        try {
            // Add credit to customer's meter if meter model is available
            if ($this->meterModel && isset($payment['meter_id'])) {
                $this->addCreditToMeter($payment);
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
}