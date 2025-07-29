<?php

namespace App\Services;

use App\Models\Payment;
use App\Repositories\PaymentRepository;
use App\Repositories\CustomerRepository;
use App\Repositories\CreditRepository;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Exception;
use PDO;
use Psr\Log\LoggerInterface;

/**
 * PaymentService
 * 
 * Service for handling payment operations
 */
class PaymentService
{
    /**
     * @var PDO
     */
    private $db;
    
    /**
     * @var PaymentRepository
     */
    private $paymentRepository;
    
    /**
     * @var CustomerRepository
     */
    private $customerRepository;
    
    /**
     * @var CreditRepository
     */
    private $creditRepository;
    
    /**
     * @var PaymentGatewayFactory
     */
    private $gatewayFactory;
    
    /**
     * @var LoggerInterface
     */
    private $logger;
    
    /**
     * Constructor
     * 
     * @param PDO $db
     * @param PaymentRepository $paymentRepository
     * @param CustomerRepository $customerRepository
     * @param CreditRepository $creditRepository
     * @param PaymentGatewayFactory $gatewayFactory
     * @param LoggerInterface $logger
     */
    public function __construct(
        PDO $db,
        PaymentRepository $paymentRepository,
        CustomerRepository $customerRepository,
        CreditRepository $creditRepository,
        PaymentGatewayFactory $gatewayFactory,
        LoggerInterface $logger
    ) {
        $this->db = $db;
        $this->paymentRepository = $paymentRepository;
        $this->customerRepository = $customerRepository;
        $this->creditRepository = $creditRepository;
        $this->gatewayFactory = $gatewayFactory;
        $this->logger = $logger;
    }
    
    /**
     * Create a payment transaction
     * 
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function createTransaction(array $data): array
    {
        try {
            $this->db->beginTransaction();
            
            // Validate customer
            $customer = $this->customerRepository->findById($data['customer_id']);
            if (!$customer) {
                throw new Exception('Customer not found');
            }
            
            // Get client ID from customer
            $clientId = $customer->getClientId();
            
            // Create payment gateway instance
            $gateway = $this->gatewayFactory->create($data['payment_gateway'], $clientId);
            
            // Prepare payment data
            $paymentData = [
                'customer_id' => $data['customer_id'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'] ?? '',
                'payment_gateway' => $data['payment_gateway'],
                'status' => 'pending'
            ];
            
            // Create payment record
            $payment = $this->paymentRepository->create($paymentData);
            
            // Prepare transaction data for gateway
            $transactionData = [
                'amount' => $data['amount'],
                'customer_name' => $customer->getFullName(),
                'customer_first_name' => $customer->getFirstName(),
                'customer_last_name' => $customer->getLastName(),
                'customer_email' => $customer->getEmail(),
                'customer_phone' => $customer->getPhone(),
                'customer_address' => $customer->getAddress(),
                'customer_city' => $customer->getCity(),
                'customer_postal_code' => $customer->getPostalCode(),
                'item_name' => 'Water Credit',
                'payment_type' => $data['payment_method'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'callback_url' => $data['callback_url'] ?? '',
                'finish_url' => $data['finish_url'] ?? '',
                'error_url' => $data['error_url'] ?? '',
                'pending_url' => $data['pending_url'] ?? '',
                'expiry_duration' => $data['expiry_duration'] ?? 60,
                'expiry_unit' => $data['expiry_unit'] ?? 'minute'
            ];
            
            // Create transaction in payment gateway
            $result = $gateway->createTransaction($transactionData);
            
            if (!$result['success']) {
                throw new Exception($result['message'] ?? 'Failed to create transaction');
            }
            
            // Update payment with transaction details
            $updateData = [
                'transaction_id' => $result['transaction_id'],
                'transaction_time' => date('Y-m-d H:i:s'),
                'payment_details' => $result
            ];
            
            $this->paymentRepository->update($payment->getId(), $updateData);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'payment_id' => $payment->getId(),
                'transaction_id' => $result['transaction_id'],
                'payment_url' => $result['payment_url'] ?? $result['redirect_url'] ?? null,
                'qr_code_url' => $result['qr_code_url'] ?? null,
                'actions' => $result['actions'] ?? [],
                'expiry_time' => $result['expiry_time'] ?? null,
                'status' => 'pending'
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->logger->error('Payment creation failed', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Handle payment notification
     * 
     * @param string $gateway
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function handleNotification(string $gateway, array $data): array
    {
        try {
            $this->db->beginTransaction();
            
            // Find payment by transaction ID
            $transactionId = $data['transaction_id'] ?? ($data['order_id'] ?? '');
            $payment = $this->paymentRepository->findByTransactionId($transactionId);
            
            if (!$payment) {
                throw new Exception('Payment not found for transaction: ' . $transactionId);
            }
            
            // Get customer
            $customer = $this->customerRepository->findById($payment->getCustomerId());
            if (!$customer) {
                throw new Exception('Customer not found');
            }
            
            // Get client ID from customer
            $clientId = $customer->getClientId();
            
            // Create payment gateway instance
            $gatewayInstance = $this->gatewayFactory->create($gateway, $clientId);
            
            // Process notification
            $result = $gatewayInstance->handleNotification($data);
            
            if (!$result['success']) {
                throw new Exception($result['message'] ?? 'Failed to process notification');
            }
            
            // Update payment status
            $updateData = [
                'status' => $result['status'],
                'payment_details' => array_merge(
                    $payment->getPaymentDetails() ?? [],
                    ['notification' => $result['raw_response']]
                )
            ];
            
            $this->paymentRepository->update($payment->getId(), $updateData);
            
            // If payment is successful, create credit
            if ($result['status'] === 'success' && $payment->getCreditId() === null) {
                $creditData = [
                    'customer_id' => $payment->getCustomerId(),
                    'amount' => $payment->getAmount(),
                    'payment_id' => $payment->getId(),
                    'status' => 'active'
                ];
                
                $credit = $this->creditRepository->create($creditData);
                
                // Update payment with credit ID
                $this->paymentRepository->update($payment->getId(), [
                    'credit_id' => $credit->getId()
                ]);
                
                // Create service fee record
                $this->createServiceFee($payment, $credit);
            }
            
            $this->db->commit();
            
            return [
                'success' => true,
                'payment_id' => $payment->getId(),
                'transaction_id' => $transactionId,
                'status' => $result['status'],
                'message' => 'Notification processed successfully'
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->logger->error('Payment notification handling failed', [
                'error' => $e->getMessage(),
                'gateway' => $gateway,
                'data' => $data
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Get payment status
     * 
     * @param string $paymentId
     * @return array
     * @throws Exception
     */
    public function getPaymentStatus(string $paymentId): array
    {
        // Find payment
        $payment = $this->paymentRepository->findById($paymentId);
        
        if (!$payment) {
            throw new Exception('Payment not found');
        }
        
        // Get customer
        $customer = $this->customerRepository->findById($payment->getCustomerId());
        if (!$customer) {
            throw new Exception('Customer not found');
        }
        
        // Get client ID from customer
        $clientId = $customer->getClientId();
        
        // Create payment gateway instance
        $gateway = $this->gatewayFactory->create($payment->getPaymentGateway(), $clientId);
        
        // Get transaction status from gateway
        $result = $gateway->getTransactionStatus($payment->getTransactionId());
        
        if (!$result['success']) {
            return [
                'success' => false,
                'payment_id' => $paymentId,
                'transaction_id' => $payment->getTransactionId(),
                'status' => $payment->getStatus(),
                'message' => $result['message'] ?? 'Failed to get transaction status'
            ];
        }
        
        // Update payment status if changed
        if ($result['status'] !== $payment->getStatus()) {
            $updateData = [
                'status' => $result['status'],
                'payment_details' => array_merge(
                    $payment->getPaymentDetails() ?? [],
                    ['status_check' => $result['raw_response']]
                )
            ];
            
            $this->paymentRepository->update($paymentId, $updateData);
            
            // If payment is successful, create credit
            if ($result['status'] === 'success' && $payment->getCreditId() === null) {
                $this->db->beginTransaction();
                
                try {
                    $creditData = [
                        'customer_id' => $payment->getCustomerId(),
                        'amount' => $payment->getAmount(),
                        'payment_id' => $payment->getId(),
                        'status' => 'active'
                    ];
                    
                    $credit = $this->creditRepository->create($creditData);
                    
                    // Update payment with credit ID
                    $this->paymentRepository->update($payment->getId(), [
                        'credit_id' => $credit->getId()
                    ]);
                    
                    // Create service fee record
                    $this->createServiceFee($payment, $credit);
                    
                    $this->db->commit();
                } catch (Exception $e) {
                    $this->db->rollBack();
                    $this->logger->error('Credit creation failed', [
                        'error' => $e->getMessage(),
                        'payment_id' => $paymentId
                    ]);
                }
            }
        }
        
        return [
            'success' => true,
            'payment_id' => $paymentId,
            'transaction_id' => $payment->getTransactionId(),
            'status' => $result['status'],
            'amount' => $payment->getAmount(),
            'payment_method' => $payment->getPaymentMethod(),
            'payment_gateway' => $payment->getPaymentGateway(),
            'created_at' => $payment->getCreatedAt(),
            'updated_at' => $payment->getUpdatedAt()
        ];
    }
    
    /**
     * Cancel payment
     * 
     * @param string $paymentId
     * @return array
     * @throws Exception
     */
    public function cancelPayment(string $paymentId): array
    {
        // Find payment
        $payment = $this->paymentRepository->findById($paymentId);
        
        if (!$payment) {
            throw new Exception('Payment not found');
        }
        
        // Check if payment can be cancelled
        if ($payment->getStatus() !== 'pending') {
            throw new Exception('Only pending payments can be cancelled');
        }
        
        // Get customer
        $customer = $this->customerRepository->findById($payment->getCustomerId());
        if (!$customer) {
            throw new Exception('Customer not found');
        }
        
        // Get client ID from customer
        $clientId = $customer->getClientId();
        
        // Create payment gateway instance
        $gateway = $this->gatewayFactory->create($payment->getPaymentGateway(), $clientId);
        
        // Cancel transaction in gateway
        $result = $gateway->cancelTransaction($payment->getTransactionId());
        
        // Update payment status
        $updateData = [
            'status' => 'failed',
            'payment_details' => array_merge(
                $payment->getPaymentDetails() ?? [],
                ['cancellation' => $result['raw_response'] ?? []]
            )
        ];
        
        $this->paymentRepository->update($paymentId, $updateData);
        
        return [
            'success' => $result['success'],
            'payment_id' => $paymentId,
            'transaction_id' => $payment->getTransactionId(),
            'status' => 'failed',
            'message' => $result['success'] ? 'Payment cancelled successfully' : ($result['message'] ?? 'Failed to cancel payment')
        ];
    }
    
    /**
     * Create service fee record
     * 
     * @param Payment $payment
     * @param object $credit
     * @return void
     */
    private function createServiceFee(Payment $payment, $credit): void
    {
        try {
            // Get customer
            $customer = $this->customerRepository->findById($payment->getCustomerId());
            if (!$customer) {
                return;
            }
            
            // Get client
            $clientId = $customer->getClientId();
            
            // Get client service fee settings
            $stmt = $this->db->prepare("
                SELECT service_fee_type, service_fee_value
                FROM clients
                WHERE id = ?
            ");
            $stmt->execute([$clientId]);
            $clientSettings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$clientSettings) {
                return;
            }
            
            // Calculate service fee
            $feeAmount = 0;
            if ($clientSettings['service_fee_type'] === 'percentage') {
                $feeAmount = $payment->getAmount() * ($clientSettings['service_fee_value'] / 100);
            } else {
                $feeAmount = $clientSettings['service_fee_value'];
            }
            
            // Create service fee record
            $stmt = $this->db->prepare("
                INSERT INTO service_fees (
                    id, client_id, payment_id, credit_id, amount, fee_type, fee_value,
                    status, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?,
                    'pending', NOW(), NOW()
                )
            ");
            
            $feeId = $this->generateUuid();
            
            $stmt->execute([
                $feeId,
                $clientId,
                $payment->getId(),
                $credit->getId(),
                $feeAmount,
                $clientSettings['service_fee_type'],
                $clientSettings['service_fee_value']
            ]);
        } catch (Exception $e) {
            $this->logger->error('Service fee creation failed', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->getId()
            ]);
        }
    }
    
    /**
     * Generate a UUID v4
     * 
     * @return string
     */
    private function generateUuid(): string
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
}