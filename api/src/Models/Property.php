<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Property extends BaseModel
{
    protected string $table = 'properties';
    protected array $fillable = [
        'id', 'client_id', 'name', 'type', 'address', 'city', 'province', 'postal_code',
        'total_units', 'status', 'latitude', 'longitude'
    ];

    public function findByClientId(string $clientId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['client_id' => $clientId], ['created_at' => 'DESC'], $limit, $offset);
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

    public function getWithClientDetails(string $id): ?array
    {
        $query = "SELECT p.*, c.company_name as client_name
                 FROM {$this->table} p
                 JOIN clients c ON p.client_id = c.id
                 WHERE p.id = :id AND p.deleted_at IS NULL AND c.deleted_at IS NULL";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function getAllWithClientDetails(array $conditions = [], int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT p.*, c.company_name as client_name
                 FROM {$this->table} p
                 JOIN clients c ON p.client_id = c.id
                 WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                if (strpos($column, '.') === false) {
                    $column = "p.$column";
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
        
        $query .= " ORDER BY p.created_at DESC";
        
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

    public function countCustomers(string $id): int
    {
        $query = "SELECT COUNT(*) FROM customers WHERE property_id = :property_id AND deleted_at IS NULL";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':property_id', $id);
        $stmt->execute();
        
        return (int) $stmt->fetchColumn();
    }

    public function countMeters(string $id): int
    {
        $query = "SELECT COUNT(*) FROM meters WHERE property_id = :property_id AND deleted_at IS NULL";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':property_id', $id);
        $stmt->execute();
        
        return (int) $stmt->fetchColumn();
    }
}