<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class Client extends BaseModel
{
    protected string $table = 'clients';
    
    protected array $fillable = [
        'user_id', 'company_name', 'address', 'city', 'province', 'postal_code',
        'contact_person', 'contact_email', 'contact_phone', 'logo', 'website',
        'tax_id', 'service_fee_type', 'service_fee_value', 'status'
    ];

    protected array $casts = [
        'service_fee_value' => 'float'
    ];

    public function findByUserId(string $userId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE user_id = ? AND deleted_at IS NULL");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function getProperties(string $clientId): array
    {
        $sql = "SELECT * FROM properties WHERE client_id = ? AND deleted_at IS NULL ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getCustomers(string $clientId): array
    {
        $sql = "SELECT c.*, u.name, u.email FROM customers c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.client_id = ? AND c.deleted_at IS NULL 
                ORDER BY c.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getMeters(string $clientId): array
    {
        $sql = "SELECT m.*, c.customer_number, c.first_name, c.last_name, p.name as property_name 
                FROM meters m
                JOIN customers c ON m.customer_id = c.id
                JOIN properties p ON m.property_id = p.id
                WHERE c.client_id = ? AND m.deleted_at IS NULL 
                ORDER BY m.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}