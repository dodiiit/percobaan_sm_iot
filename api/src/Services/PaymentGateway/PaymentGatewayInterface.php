<?php

namespace App\Services\PaymentGateway;

/**
 * PaymentGatewayInterface
 * 
 * Interface for payment gateway implementations
 */
interface PaymentGatewayInterface
{
    /**
     * Create a payment transaction
     * 
     * @param array $data Payment data
     * @return array Transaction details
     */
    public function createTransaction(array $data): array;
    
    /**
     * Get transaction status
     * 
     * @param string $transactionId
     * @return array Transaction status details
     */
    public function getTransactionStatus(string $transactionId): array;
    
    /**
     * Handle notification from payment gateway
     * 
     * @param array $data Notification data
     * @return array Processed notification result
     */
    public function handleNotification(array $data): array;
    
    /**
     * Cancel a transaction
     * 
     * @param string $transactionId
     * @return array Cancellation result
     */
    public function cancelTransaction(string $transactionId): array;
    
    /**
     * Get payment methods supported by this gateway
     * 
     * @return array List of payment methods
     */
    public function getPaymentMethods(): array;
    
    /**
     * Validate gateway configuration
     * 
     * @param array $config
     * @return bool
     */
    public function validateConfig(array $config): bool;
    
    /**
     * Get required configuration fields
     * 
     * @return array
     */
    public function getRequiredConfigFields(): array;
}