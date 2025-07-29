<?php

namespace App\Models;

/**
 * Payment Model
 * 
 * Represents a payment transaction in the system
 */
class Payment
{
    /**
     * @var string
     */
    private $id;

    /**
     * @var string
     */
    private $customerId;

    /**
     * @var string|null
     */
    private $creditId;

    /**
     * @var float
     */
    private $amount;

    /**
     * @var string
     */
    private $paymentMethod;

    /**
     * @var string
     */
    private $paymentGateway;

    /**
     * @var string|null
     */
    private $transactionId;

    /**
     * @var string|null
     */
    private $transactionTime;

    /**
     * @var string
     */
    private $status;

    /**
     * @var array|null
     */
    private $paymentDetails;

    /**
     * @var string
     */
    private $createdAt;

    /**
     * @var string
     */
    private $updatedAt;

    /**
     * @var string|null
     */
    private $customerName;

    /**
     * @var string|null
     */
    private $customerEmail;

    /**
     * @var string|null
     */
    private $customerPhone;

    /**
     * Constructor
     * 
     * @param array $data
     */
    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->customerId = $data['customer_id'] ?? '';
        $this->creditId = $data['credit_id'] ?? null;
        $this->amount = (float)($data['amount'] ?? 0);
        $this->paymentMethod = $data['payment_method'] ?? '';
        $this->paymentGateway = $data['payment_gateway'] ?? '';
        $this->transactionId = $data['transaction_id'] ?? null;
        $this->transactionTime = $data['transaction_time'] ?? null;
        $this->status = $data['status'] ?? 'pending';
        $this->paymentDetails = is_string($data['payment_details'] ?? null) 
            ? json_decode($data['payment_details'], true) 
            : ($data['payment_details'] ?? null);
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
        $this->customerName = $data['customer_name'] ?? null;
        $this->customerEmail = $data['customer_email'] ?? null;
        $this->customerPhone = $data['customer_phone'] ?? null;
    }

    /**
     * Get the payment ID
     * 
     * @return string|null
     */
    public function getId(): ?string
    {
        return $this->id;
    }

    /**
     * Get the customer ID
     * 
     * @return string
     */
    public function getCustomerId(): string
    {
        return $this->customerId;
    }

    /**
     * Get the credit ID
     * 
     * @return string|null
     */
    public function getCreditId(): ?string
    {
        return $this->creditId;
    }

    /**
     * Get the payment amount
     * 
     * @return float
     */
    public function getAmount(): float
    {
        return $this->amount;
    }

    /**
     * Get the payment method
     * 
     * @return string
     */
    public function getPaymentMethod(): string
    {
        return $this->paymentMethod;
    }

    /**
     * Get the payment gateway
     * 
     * @return string
     */
    public function getPaymentGateway(): string
    {
        return $this->paymentGateway;
    }

    /**
     * Get the transaction ID
     * 
     * @return string|null
     */
    public function getTransactionId(): ?string
    {
        return $this->transactionId;
    }

    /**
     * Get the transaction time
     * 
     * @return string|null
     */
    public function getTransactionTime(): ?string
    {
        return $this->transactionTime;
    }

    /**
     * Get the payment status
     * 
     * @return string
     */
    public function getStatus(): string
    {
        return $this->status;
    }

    /**
     * Get the payment details
     * 
     * @return array|null
     */
    public function getPaymentDetails(): ?array
    {
        return $this->paymentDetails;
    }

    /**
     * Get the created at timestamp
     * 
     * @return string|null
     */
    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    /**
     * Get the updated at timestamp
     * 
     * @return string|null
     */
    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }

    /**
     * Get the customer name
     * 
     * @return string|null
     */
    public function getCustomerName(): ?string
    {
        return $this->customerName;
    }

    /**
     * Get the customer email
     * 
     * @return string|null
     */
    public function getCustomerEmail(): ?string
    {
        return $this->customerEmail;
    }

    /**
     * Get the customer phone
     * 
     * @return string|null
     */
    public function getCustomerPhone(): ?string
    {
        return $this->customerPhone;
    }

    /**
     * Convert to array
     * 
     * @param bool $includeDetails Whether to include payment details in the array
     * @return array
     */
    public function toArray(bool $includeDetails = false): array
    {
        $data = [
            'id' => $this->id,
            'customer_id' => $this->customerId,
            'customer_name' => $this->customerName,
            'credit_id' => $this->creditId,
            'amount' => $this->amount,
            'payment_method' => $this->paymentMethod,
            'payment_gateway' => $this->paymentGateway,
            'transaction_id' => $this->transactionId,
            'transaction_time' => $this->transactionTime,
            'status' => $this->status,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];

        if ($includeDetails && $this->paymentDetails) {
            $data['payment_details'] = $this->paymentDetails;
        }

        return $data;
    }
}