<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class SeasonalRate extends BaseModel
{
    protected string $table = 'seasonal_rates';
    protected array $fillable = [
        'tariff_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'rate_adjustment_type',
        'rate_adjustment_value',
        'is_active'
    ];

    /**
     * Get all seasonal rates for a tariff
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
        
        $sql .= " ORDER BY start_date ASC";
        
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
     * Get active seasonal rates for a tariff on a specific date
     *
     * @param string $tariffId
     * @param string|null $date
     * @return array
     */
    public function getActiveForDate(string $tariffId, ?string $date = null): array
    {
        if ($date === null) {
            $date = date('Y-m-d');
        }
        
        $sql = "SELECT * FROM {$this->table} 
                WHERE tariff_id = :tariff_id 
                AND is_active = 1
                AND start_date <= :date
                AND end_date >= :date
                ORDER BY start_date ASC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->bindParam(':date', $date, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Check for overlapping seasonal rates
     *
     * @param string $tariffId
     * @param string $startDate
     * @param string $endDate
     * @param string|null $excludeId
     * @return bool
     */
    public function hasOverlappingRates(string $tariffId, string $startDate, string $endDate, ?string $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE tariff_id = :tariff_id 
                AND is_active = 1
                AND (
                    (start_date <= :end_date AND end_date >= :start_date)
                )";
        
        if ($excludeId) {
            $sql .= " AND id != :exclude_id";
        }
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->bindParam(':start_date', $startDate, PDO::PARAM_STR);
            $stmt->bindParam(':end_date', $endDate, PDO::PARAM_STR);
            
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
     * Create a new seasonal rate
     *
     * @param array $data
     * @return array|null
     */
    public function create(array $data): ?array
    {
        // Check for overlapping rates
        if ($this->hasOverlappingRates($data['tariff_id'], $data['start_date'], $data['end_date'])) {
            $this->setError('Overlapping seasonal rates are not allowed');
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
            
            // Update tariff to enable seasonal rates if not already enabled
            $sql = "UPDATE tariffs SET is_seasonal = 1 WHERE id = :tariff_id AND is_seasonal = 0";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $data['tariff_id'], PDO::PARAM_STR);
            $stmt->execute();
            
            return $this->find($data['id']);
        } catch (PDOException $e) {
            $this->logError($e);
            $this->setError('Failed to create seasonal rate: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Update a seasonal rate
     *
     * @param string $id
     * @param array $data
     * @return array|null
     */
    public function update(string $id, array $data): ?array
    {
        // Get the current seasonal rate
        $currentRate = $this->find($id);
        if (!$currentRate) {
            $this->setError('Seasonal rate not found');
            return null;
        }
        
        // Check for date changes
        $startDate = $data['start_date'] ?? $currentRate['start_date'];
        $endDate = $data['end_date'] ?? $currentRate['end_date'];
        
        // Check for overlapping rates if dates changed
        if (($startDate !== $currentRate['start_date'] || $endDate !== $currentRate['end_date']) &&
            $this->hasOverlappingRates($currentRate['tariff_id'], $startDate, $endDate, $id)) {
            $this->setError('Overlapping seasonal rates are not allowed');
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
            $this->setError('Failed to update seasonal rate: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a seasonal rate
     *
     * @param string $id
     * @return bool
     */
    public function delete(string $id): bool
    {
        try {
            // Get the tariff ID before deleting
            $rate = $this->find($id);
            if (!$rate) {
                return false;
            }
            
            $tariffId = $rate['tariff_id'];
            
            // Delete the seasonal rate
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_STR);
            $result = $stmt->execute();
            
            // Check if there are any remaining seasonal rates for this tariff
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE tariff_id = :tariff_id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            
            $count = (int)$stmt->fetchColumn();
            
            // If no seasonal rates remain, update the tariff
            if ($count === 0) {
                $sql = "UPDATE tariffs SET is_seasonal = 0 WHERE id = :tariff_id";
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
}