<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Client extends BaseModel
{
    protected string $table = 'clients';
    protected array $fillable = [
        'id', 'user_id', 'company_name', 'address', 'city', 'province', 'postal_code',
        'contact_person', 'contact_email', 'contact_phone', 'logo', 'website', 'tax_id',
        'service_fee_type', 'service_fee_value', 'status'
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
        $query = "SELECT c.*, u.name, u.email, u.phone, u.status as user_status, u.last_login_at
                 FROM {$this->table} c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.id = :id AND c.deleted_at IS NULL AND u.deleted_at IS NULL";
        
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
        $query = "SELECT c.*, u.name, u.email, u.phone, u.status as user_status, u.last_login_at
                 FROM {$this->table} c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.deleted_at IS NULL AND u.deleted_at IS NULL";
        
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
}