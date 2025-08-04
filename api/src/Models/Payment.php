<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class Payment extends BaseModel
{
    protected string $table = 'payments';
    
    protected array $fillable = [
        'customer_id', 'amount', 'method', 'status', 'description',
        'external_id', 'snap_token', 'payment_url', 'paid_at', 'gateway_response'
    ];

    protected array $casts = [
        'amount' => 'float',
        'gateway_response' => 'json'
    ];

    public function findByExternalId(string $externalId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE external_id = ? AND deleted_at IS NULL");
        $stmt->execute([$externalId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function findByCustomerId(string $customerId, int $limit = 50): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE customer_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$customerId, $limit]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map([$this, 'castAttributes'], $results);
    }

    public function getSuccessfulPayments(string $customerId): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE customer_id = ? AND status = 'success' AND deleted_at IS NULL ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$customerId]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map([$this, 'castAttributes'], $results);
    }

    public function getTotalAmount(string $customerId, string $status = null): float
    {
        $whereClause = "customer_id = ? AND deleted_at IS NULL";
        $params = [$customerId];

        if ($status) {
            $whereClause .= " AND status = ?";
            $params[] = $status;
        }

        $sql = "SELECT SUM(amount) FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (float) $stmt->fetchColumn();
    }
}