<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Meter extends BaseModel
{
    protected string $table = 'meters';
    protected array $fillable = [
        'id', 'customer_id', 'property_id', 'client_id', 'meter_number', 'serial_number',
        'model', 'installation_date', 'last_reading_date', 'last_reading_value',
        'current_credit', 'status', 'firmware_version', 'hardware_version',
        'location_description', 'latitude', 'longitude'
    ];

    public function findByCustomerId(string $customerId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['customer_id' => $customerId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByPropertyId(string $propertyId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['property_id' => $propertyId], ['created_at' => 'DESC'], $limit, $offset);
    }

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

    public function updateCredit(string $id, float $credit): bool
    {
        $query = "UPDATE {$this->table} SET current_credit = :current_credit, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':current_credit', $credit);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updateReading(string $id, float $reading): bool
    {
        $query = "UPDATE {$this->table} SET last_reading_value = :last_reading_value, last_reading_date = :last_reading_date, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':last_reading_value', $reading);
        $stmt->bindParam(':last_reading_date', $now);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updateFirmware(string $id, string $version): bool
    {
        $query = "UPDATE {$this->table} SET firmware_version = :firmware_version, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':firmware_version', $version);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function getWithDetails(string $id): ?array
    {
        $query = "SELECT m.*, c.customer_number, u.name as customer_name, u.email as customer_email,
                 p.name as property_name, cl.company_name as client_name
                 FROM {$this->table} m
                 JOIN customers c ON m.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN properties p ON m.property_id = p.id
                 JOIN clients cl ON m.client_id = cl.id
                 WHERE m.id = :id AND m.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND p.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
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
        $query = "SELECT m.*, c.customer_number, u.name as customer_name,
                 p.name as property_name, cl.company_name as client_name
                 FROM {$this->table} m
                 JOIN customers c ON m.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN properties p ON m.property_id = p.id
                 JOIN clients cl ON m.client_id = cl.id
                 WHERE m.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND p.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                if (strpos($column, '.') === false) {
                    $column = "m.$column";
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
        
        $query .= " ORDER BY m.created_at DESC";
        
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

    public function generateMeterNumber(string $clientId): string
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
        
        $prefix = strtoupper($clientStmt->fetchColumn() ?: 'MTR');
        
        // Format: PREFIX-YYYYMM-XXXX (e.g., ABC-202507-0001)
        return $prefix . '-' . date('Ym') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}