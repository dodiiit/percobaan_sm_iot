<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Credit extends BaseModel
{
    protected string $table = 'credits';
    protected array $fillable = [
        'id', 'customer_id', 'meter_id', 'client_id', 'payment_id', 'amount',
        'credit_code', 'status', 'applied_at', 'expires_at', 'notes'
    ];

    public function findByCustomerId(string $customerId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['customer_id' => $customerId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByMeterId(string $meterId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['meter_id' => $meterId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByClientId(string $clientId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['client_id' => $clientId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByPaymentId(string $paymentId): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE payment_id = :payment_id";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':payment_id', $paymentId);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function findByCreditCode(string $creditCode): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE credit_code = :credit_code";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':credit_code', $creditCode);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function updateStatus(string $id, string $status): bool
    {
        $query = "UPDATE {$this->table} SET status = :status, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function markAsApplied(string $id): bool
    {
        $query = "UPDATE {$this->table} SET status = 'applied', applied_at = :applied_at, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':applied_at', $now);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function getWithDetails(string $id): ?array
    {
        $query = "SELECT cr.*, c.customer_number, u.name as customer_name, u.email as customer_email,
                 m.meter_number, cl.company_name as client_name, p.id as payment_id, p.transaction_id
                 FROM {$this->table} cr
                 JOIN customers c ON cr.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN meters m ON cr.meter_id = m.id
                 JOIN clients cl ON cr.client_id = cl.id
                 LEFT JOIN payments p ON cr.payment_id = p.id
                 WHERE cr.id = :id AND cr.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND m.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function getAllWithDetails(array $conditions = [], int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT cr.*, c.customer_number, u.name as customer_name,
                 m.meter_number, cl.company_name as client_name
                 FROM {$this->table} cr
                 JOIN customers c ON cr.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN meters m ON cr.meter_id = m.id
                 JOIN clients cl ON cr.client_id = cl.id
                 WHERE cr.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND m.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                if (strpos($column, '.') === false) {
                    $column = "cr.$column";
                }
                
                if ($value === null) {
                    $query .= " AND $column IS NULL";
                } else {
                    $paramName = str_replace('.', '_', $column);
                    $query .= " AND $column = :$paramName";
                    $params[$paramName] = $value;
                }
            }
        }
        
        $query .= " ORDER BY cr.created_at DESC";
        
        if ($limit > 0) {
            $query .= " LIMIT :limit";
            $params['limit'] = $limit;
            
            if ($offset > 0) {
                $query .= " OFFSET :offset";
                $params['offset'] = $offset;
            }
        }
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $param => $value) {
            if ($param === 'limit' || $param === 'offset') {
                $stmt->bindValue(":$param", $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(":$param", $value);
            }
        }
        
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function generateCreditCode(): string
    {
        // Generate a unique 16-character alphanumeric code
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $code = '';
        
        for ($i = 0; $i < 16; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        // Format as XXXX-XXXX-XXXX-XXXX
        return substr($code, 0, 4) . '-' . substr($code, 4, 4) . '-' . substr($code, 8, 4) . '-' . substr($code, 12, 4);
    }
}