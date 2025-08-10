<?php

namespace IndoWater\Api\Models;

/**
 * PaymentGateway Model
 * 
 * Represents a payment gateway configuration in the system
 */
class PaymentGateway
{
    /**
     * @var string
     */
    private $id;

    /**
     * @var string|null
     */
    private $clientId;

    /**
     * @var string
     */
    private $gateway;

    /**
     * @var bool
     */
    private $isActive;

    /**
     * @var bool
     */
    private $isProduction;

    /**
     * @var array
     */
    private $credentials;

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
    private $clientName;

    /**
     * Constructor
     * 
     * @param array $data
     */
    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->clientId = $data['client_id'] ?? null;
        $this->gateway = $data['gateway'] ?? '';
        $this->isActive = (bool)($data['is_active'] ?? false);
        $this->isProduction = (bool)($data['is_production'] ?? false);
        $this->credentials = is_string($data['credentials'] ?? null) 
            ? json_decode($data['credentials'], true) 
            : ($data['credentials'] ?? []);
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
        $this->clientName = $data['client_name'] ?? null;
    }

    /**
     * Get the gateway ID
     * 
     * @return string|null
     */
    public function getId(): ?string
    {
        return $this->id;
    }

    /**
     * Get the client ID
     * 
     * @return string|null
     */
    public function getClientId(): ?string
    {
        return $this->clientId;
    }

    /**
     * Get the gateway type
     * 
     * @return string
     */
    public function getGateway(): string
    {
        return $this->gateway;
    }

    /**
     * Check if the gateway is active
     * 
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->isActive;
    }

    /**
     * Check if the gateway is in production mode
     * 
     * @return bool
     */
    public function isProduction(): bool
    {
        return $this->isProduction;
    }

    /**
     * Get the gateway credentials
     * 
     * @return array
     */
    public function getCredentials(): array
    {
        return $this->credentials;
    }

    /**
     * Get a specific credential value
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function getCredential(string $key, $default = null)
    {
        return $this->credentials[$key] ?? $default;
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
     * Get the client name
     * 
     * @return string|null
     */
    public function getClientName(): ?string
    {
        return $this->clientName;
    }

    /**
     * Convert to array
     * 
     * @param bool $includeCredentials Whether to include credentials in the array
     * @return array
     */
    public function toArray(bool $includeCredentials = false): array
    {
        $data = [
            'id' => $this->id,
            'client_id' => $this->clientId,
            'client_name' => $this->clientName,
            'gateway' => $this->gateway,
            'is_active' => $this->isActive,
            'is_production' => $this->isProduction,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];

        if ($includeCredentials) {
            $data['credentials'] = $this->credentials;
        }

        return $data;
    }
}