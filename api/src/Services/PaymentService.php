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

    public function __construct(Payment $paymentModel, array $midtransConfig, array $dokuConfig)
    {
        $this->paymentModel = $paymentModel;
        $this->midtransConfig = $midtransConfig;
        $this->dokuConfig = $dokuConfig;

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
        // Add credit to customer's meter
        // Send confirmation email
        // Create notification
        // This would integrate with other services
    }
}