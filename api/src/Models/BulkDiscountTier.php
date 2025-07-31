<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class BulkDiscountTier extends BaseModel
{
    protected string $table = 'bulk_discount_tiers';
    protected array $fillable = [
        'tariff_id',
        'min_volume',
        'max_volume',
        'discount_type',
        'discount_value',
        'is_active'
    ];

    /**
     * Get all bulk discount tiers for a tariff
     *
     * @param string $tariffId
     * @param bool $activeOnly
     * @return array
     */
    public function getAllForTariff(string $tariffId, bool $activeOnly = false): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE tariff_id = :tariff_id";
        
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        
        $sql .= " ORDER BY min_volume ASC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Check for overlapping volume ranges
     *
     * @param string $tariffId
     * @param float $minVolume
     * @param float|null $maxVolume
     * @param string|null $excludeId
     * @return bool
     */
    public function hasOverlappingRanges(string $tariffId, float $minVolume, ?float $maxVolume = null, ?string $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE tariff_id = :tariff_id 
                AND is_active = 1
                AND (";
        
        if ($maxVolume === null) {
            // Case 1: New tier has no upper limit
            $sql .= "(min_volume >= :min_volume)";
        } else {
            // Case 2: New tier has an upper limit
            $sql .= "(min_volume <= :max_volume AND (max_volume IS NULL OR max_volume >= :min_volume))";
        }
        
        $sql .= ")";
        
        if ($excludeId) {
            $sql .= " AND id != :exclude_id";
        }
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->bindParam(':min_volume', $minVolume, PDO::PARAM_STR);
            
            if ($maxVolume !== null) {
                $stmt->bindParam(':max_volume', $maxVolume, PDO::PARAM_STR);
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
     * Create a new bulk discount tier
     *
     * @param array $data
     * @return array|null
     */
    public function create(array $data): ?array
    {
        // Check for overlapping ranges
        $minVolume = (float)$data['min_volume'];
        $maxVolume = isset($data['max_volume']) && $data['max_volume'] !== null ? (float)$data['max_volume'] : null;
        
        if ($this->hasOverlappingRanges($data['tariff_id'], $minVolume, $maxVolume)) {
            $this->setError('Overlapping volume ranges are not allowed');
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
            
            // Update tariff to enable bulk discounts if not already enabled
            $sql = "UPDATE tariffs SET has_bulk_discount = 1 WHERE id = :tariff_id AND has_bulk_discount = 0";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $data['tariff_id'], PDO::PARAM_STR);
            $stmt->execute();
            
            return $this->find($data['id']);
        } catch (PDOException $e) {
            $this->logError($e);
            $this->setError('Failed to create bulk discount tier: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Update a bulk discount tier
     *
     * @param string $id
     * @param array $data
     * @return array|null
     */
    public function update(string $id, array $data): ?array
    {
        // Get the current tier
        $currentTier = $this->find($id);
        if (!$currentTier) {
            $this->setError('Bulk discount tier not found');
            return null;
        }
        
        // Check for volume range changes
        $minVolume = isset($data['min_volume']) ? (float)$data['min_volume'] : (float)$currentTier['min_volume'];
        $maxVolume = isset($data['max_volume']) ? 
            ($data['max_volume'] !== null ? (float)$data['max_volume'] : null) : 
            ($currentTier['max_volume'] !== null ? (float)$currentTier['max_volume'] : null);
        
        // Check for overlapping ranges if volume ranges changed
        if (($minVolume !== (float)$currentTier['min_volume'] || $maxVolume !== ($currentTier['max_volume'] !== null ? (float)$currentTier['max_volume'] : null)) &&
            $this->hasOverlappingRanges($currentTier['tariff_id'], $minVolume, $maxVolume, $id)) {
            $this->setError('Overlapping volume ranges are not allowed');
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
            $this->setError('Failed to update bulk discount tier: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a bulk discount tier
     *
     * @param string $id
     * @return bool
     */
    public function delete(string $id): bool
    {
        try {
            // Get the tariff ID before deleting
            $tier = $this->find($id);
            if (!$tier) {
                return false;
            }
            
            $tariffId = $tier['tariff_id'];
            
            // Delete the bulk discount tier
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_STR);
            $result = $stmt->execute();
            
            // Check if there are any remaining bulk discount tiers for this tariff
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE tariff_id = :tariff_id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            
            $count = (int)$stmt->fetchColumn();
            
            // If no bulk discount tiers remain, update the tariff
            if ($count === 0) {
                $sql = "UPDATE tariffs SET has_bulk_discount = 0 WHERE id = :tariff_id";
                $stmt = DB::prepare($sql);
                $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
                $stmt->execute();
            }
            
            return $result;
        } catch (PDOException $e) {
            $this->logError($e);
            return false;
        }
    }

    /**
     * Get applicable bulk discount tier for a volume
     *
     * @param string $tariffId
     * @param float $volume
     * @return array|null
     */
    public function getApplicableTier(string $tariffId, float $volume): ?array
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE tariff_id = :tariff_id 
                AND is_active = 1
                AND min_volume <= :volume
                AND (max_volume IS NULL OR max_volume >= :volume)
                ORDER BY min_volume DESC
                LIMIT 1";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->bindParam(':volume', $volume, PDO::PARAM_STR);
            $stmt->execute();
            
            $tier = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $tier ?: null;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }
}