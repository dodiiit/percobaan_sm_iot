<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class Customer extends BaseModel
{
    protected string $table = 'customers';
    
    protected array $fillable = [
        'user_id', 'client_id', 'customer_number', 'first_name', 'last_name',
        'address', 'city', 'province', 'postal_code', 'phone', 'email',
        'id_card_number', 'id_card_image', 'status'
    ];

    public function findByUserId(string $userId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE user_id = ? AND deleted_at IS NULL");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function findByCustomerNumber(string $clientId, string $customerNumber): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE client_id = ? AND customer_number = ? AND deleted_at IS NULL");
        $stmt->execute([$clientId, $customerNumber]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function getMeters(string $customerId): array
    {
        $sql = "SELECT m.*, p.name as property_name, p.address as property_address 
                FROM meters m
                JOIN properties p ON m.property_id = p.id
                WHERE m.customer_id = ? AND m.deleted_at IS NULL 
                ORDER BY m.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$customerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getPayments(string $customerId): array
    {
        $sql = "SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$customerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getCredits(string $customerId): array
    {
        $sql = "SELECT c.*, m.meter_id 
                FROM credits c
                JOIN meters m ON c.meter_id = m.id
                WHERE c.customer_id = ? 
                ORDER BY c.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$customerId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}