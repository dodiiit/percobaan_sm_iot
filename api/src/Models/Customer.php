<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Customer extends BaseModel
{
    protected string $table = 'customers';
    protected array $fillable = [
        'id', 'user_id', 'client_id', 'property_id', 'customer_number', 'address',
        'city', 'province', 'postal_code', 'status'
    ];

    public function findByUserId(string $userId): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function findByClientId(string $clientId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['client_id' => $clientId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByPropertyId(string $propertyId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['property_id' => $propertyId], ['created_at' => 'DESC'], $limit, $offset);
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

    public function getWithUserDetails(string $id): ?array
    {
        $query = "SELECT c.*, u.name, u.email, u.phone, u.status as user_status, u.last_login_at,
                 p.name as property_name, cl.company_name as client_name
                 FROM {$this->table} c
                 JOIN users u ON c.user_id = u.id
                 JOIN properties p ON c.property_id = p.id
                 JOIN clients cl ON c.client_id = cl.id
                 WHERE c.id = :id AND c.deleted_at IS NULL AND u.deleted_at IS NULL
                 AND p.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function getAllWithUserDetails(array $conditions = [], int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT c.*, u.name, u.email, u.phone, u.status as user_status, u.last_login_at,
                 p.name as property_name, cl.company_name as client_name
                 FROM {$this->table} c
                 JOIN users u ON c.user_id = u.id
                 JOIN properties p ON c.property_id = p.id
                 JOIN clients cl ON c.client_id = cl.id
                 WHERE c.deleted_at IS NULL AND u.deleted_at IS NULL
                 AND p.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                if (strpos($column, '.') === false) {
                    $column = "c.$column";
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
        
        $query .= " ORDER BY c.created_at DESC";
        
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

    public function generateCustomerNumber(string $clientId): string
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE client_id = :client_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->execute();
        
        $count = (int) $stmt->fetchColumn() + 1;
        
        // Get client prefix (first 3 letters of company name)
        $clientQuery = "SELECT SUBSTRING(company_name, 1, 3) as prefix FROM clients WHERE id = :client_id";
        $clientStmt = $this->db->prepare($clientQuery);
        $clientStmt->bindParam(':client_id', $clientId);
        $clientStmt->execute();
        
        $prefix = strtoupper($clientStmt->fetchColumn() ?: 'CUS');
        
        // Format: PREFIX-YYYYMM-XXXX (e.g., ABC-202507-0001)
        return $prefix . '-' . date('Ym') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}