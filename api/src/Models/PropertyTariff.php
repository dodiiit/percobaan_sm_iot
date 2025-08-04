<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class PropertyTariff extends BaseModel
{
    protected string $table = 'property_tariffs';
    protected array $fillable = [
        'property_id',
        'tariff_id',
        'effective_from',
        'effective_to',
        'is_active'
    ];

    /**
     * Get all tariff assignments for a property
     *
     * @param string $propertyId
     * @param bool $activeOnly
     * @return array
     */
    public function getAllForProperty(string $propertyId, bool $activeOnly = false): array
    {
        $sql = "SELECT pt.*, t.name as tariff_name, t.property_type, t.base_price 
                FROM {$this->table} pt
                JOIN tariffs t ON pt.tariff_id = t.id
                WHERE pt.property_id = :property_id";
        
        if ($activeOnly) {
            $sql .= " AND pt.is_active = 1";
        }
        
        $sql .= " ORDER BY pt.effective_from DESC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':property_id', $propertyId, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get current active tariff for a property
     *
     * @param string $propertyId
     * @return array|null
     */
    public function getCurrentForProperty(string $propertyId): ?array
    {
        $today = date('Y-m-d');
        
        $sql = "SELECT pt.*, t.name as tariff_name, t.property_type, t.base_price,
                       t.is_seasonal, t.has_minimum_charge, t.minimum_charge_amount,
                       t.has_bulk_discount, t.has_dynamic_discount
                FROM {$this->table} pt
                JOIN tariffs t ON pt.tariff_id = t.id
                WHERE pt.property_id = :property_id
                AND pt.is_active = 1
                AND pt.effective_from <= :today
                AND (pt.effective_to IS NULL OR pt.effective_to >= :today)
                ORDER BY pt.effective_from DESC
                LIMIT 1";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':property_id', $propertyId, PDO::PARAM_STR);
            $stmt->bindParam(':today', $today, PDO::PARAM_STR);
            $stmt->execute();
            
            $tariff = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $tariff ?: null;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Check for overlapping tariff assignments
     *
     * @param string $propertyId
     * @param string $effectiveFrom
     * @param string|null $effectiveTo
     * @param string|null $excludeId
     * @return bool
     */
    public function hasOverlappingAssignments(string $propertyId, string $effectiveFrom, ?string $effectiveTo = null, ?string $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE property_id = :property_id 
                AND is_active = 1
                AND (";
        
        if ($effectiveTo === null) {
            // Case 1: New assignment has no end date
            $sql .= "(effective_from <= :effective_from OR effective_from >= :effective_from)";
        } else {
            // Case 2: New assignment has an end date
            $sql .= "(effective_from <= :effective_to AND (effective_to IS NULL OR effective_to >= :effective_from))";
        }
        
        $sql .= ")";
        
        if ($excludeId) {
            $sql .= " AND id != :exclude_id";
        }
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':property_id', $propertyId, PDO::PARAM_STR);
            $stmt->bindParam(':effective_from', $effectiveFrom, PDO::PARAM_STR);
            
            if ($effectiveTo !== null) {
                $stmt->bindParam(':effective_to', $effectiveTo, PDO::PARAM_STR);
            }
            
            if ($excludeId) {
                $stmt->bindParam(':exclude_id', $excludeId, PDO::PARAM_STR);
            }
            
            $stmt->execute();
            
            return (int)$stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            $this->logError($e);
            return false;
        }
    }

    /**
     * Create a new property tariff assignment
     *
     * @param array $data
     * @return array|null
     */
    public function create(array $data): ?array
    {
        // Check for overlapping assignments
        if ($this->hasOverlappingAssignments($data['property_id'], $data['effective_from'], $data['effective_to'] ?? null)) {
            $this->setError('Overlapping tariff assignments are not allowed');
            return null;
        }
        
        // Generate UUID
        $data['id'] = Uuid::uuid4()->toString();
        
        // Set timestamps
        $now = date('Y-m-d H:i:s');
        $data['created_at'] = $now;
        $data['updated_at'] = $now;
        
        try {
            $columns = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            
            $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
            $stmt = DB::prepare($sql);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            
            $stmt->execute();
            
            return $this->find($data['id']);
        } catch (PDOException $e) {
            $this->logError($e);
            $this->setError('Failed to create property tariff assignment: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Update a property tariff assignment
     *
     * @param string $id
     * @param array $data
     * @return array|null
     */
    public function update(string $id, array $data): ?array
    {
        // Get the current assignment
        $currentAssignment = $this->find($id);
        if (!$currentAssignment) {
            $this->setError('Property tariff assignment not found');
            return null;
        }
        
        // Check for date changes
        $effectiveFrom = $data['effective_from'] ?? $currentAssignment['effective_from'];
        $effectiveTo = isset($data['effective_to']) ? $data['effective_to'] : $currentAssignment['effective_to'];
        
        // Check for overlapping assignments if dates changed
        if (($effectiveFrom !== $currentAssignment['effective_from'] || $effectiveTo !== $currentAssignment['effective_to']) &&
            $this->hasOverlappingAssignments($currentAssignment['property_id'], $effectiveFrom, $effectiveTo, $id)) {
            $this->setError('Overlapping tariff assignments are not allowed');
            return null;
        }
        
        // Set updated timestamp
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        try {
            $updates = [];
            foreach ($data as $key => $value) {
                $updates[] = "{$key} = :{$key}";
            }
            
            $updateStr = implode(', ', $updates);
            
            $sql = "UPDATE {$this->table} SET {$updateStr} WHERE id = :id";
            $stmt = DB::prepare($sql);
            
            $stmt->bindParam(':id', $id, PDO::PARAM_STR);
            
            foreach ($data as $key => $value) {
                $stmt->bindValue(":{$key}", $value);
            }
            
            $stmt->execute();
            
            return $this->find($id);
        } catch (PDOException $e) {
            $this->logError($e);
            $this->setError('Failed to update property tariff assignment: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a property tariff assignment
     *
     * @param string $id
     * @return bool
     */
    public function delete(string $id): bool
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_STR);
            return $stmt->execute();
        } catch (PDOException $e) {
            $this->logError($e);
            return false;
        }
    }

    /**
     * Get properties using a specific tariff
     *
     * @param string $tariffId
     * @param bool $activeOnly
     * @return array
     */
    public function getPropertiesUsingTariff(string $tariffId, bool $activeOnly = true): array
    {
        $sql = "SELECT p.*, pt.effective_from, pt.effective_to 
                FROM properties p
                JOIN {$this->table} pt ON p.id = pt.property_id
                WHERE pt.tariff_id = :tariff_id";
        
        if ($activeOnly) {
            $today = date('Y-m-d');
            $sql .= " AND pt.is_active = 1
                      AND pt.effective_from <= :today
                      AND (pt.effective_to IS NULL OR pt.effective_to >= :today)";
        }
        
        $sql .= " ORDER BY p.name ASC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            
            if ($activeOnly) {
                $today = date('Y-m-d');
                $stmt->bindParam(':today', $today, PDO::PARAM_STR);
            }
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }
}