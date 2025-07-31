<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class DynamicDiscountRule extends BaseModel
{
    protected string $table = 'dynamic_discount_rules';
    protected array $fillable = [
        'tariff_id',
        'name',
        'description',
        'rule_type',
        'conditions',
        'discount_type',
        'discount_value',
        'priority',
        'is_active',
        'start_date',
        'end_date',
        'max_discount_amount'
    ];

    /**
     * Get all dynamic discount rules for a tariff
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
        
        $sql .= " ORDER BY priority DESC, name ASC";
        
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
     * Get active dynamic discount rules for a tariff on a specific date
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
                AND (start_date IS NULL OR start_date <= :date)
                AND (end_date IS NULL OR end_date >= :date)
                ORDER BY priority DESC, name ASC";
        
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
     * Create a new dynamic discount rule
     *
     * @param array $data
     * @return array|null
     */
    public function create(array $data): ?array
    {
        // Validate conditions JSON
        if (isset($data['conditions']) && is_array($data['conditions'])) {
            $data['conditions'] = json_encode($data['conditions']);
        } elseif (isset($data['conditions']) && !$this->isValidJson($data['conditions'])) {
            $this->setError('Conditions must be a valid JSON object');
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
            
            // Update tariff to enable dynamic discounts if not already enabled
            $sql = "UPDATE tariffs SET has_dynamic_discount = 1 WHERE id = :tariff_id AND has_dynamic_discount = 0";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $data['tariff_id'], PDO::PARAM_STR);
            $stmt->execute();
            
            return $this->find($data['id']);
        } catch (PDOException $e) {
            $this->logError($e);
            $this->setError('Failed to create dynamic discount rule: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Update a dynamic discount rule
     *
     * @param string $id
     * @param array $data
     * @return array|null
     */
    public function update(string $id, array $data): ?array
    {
        // Validate conditions JSON
        if (isset($data['conditions']) && is_array($data['conditions'])) {
            $data['conditions'] = json_encode($data['conditions']);
        } elseif (isset($data['conditions']) && !$this->isValidJson($data['conditions'])) {
            $this->setError('Conditions must be a valid JSON object');
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
            $this->setError('Failed to update dynamic discount rule: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a dynamic discount rule
     *
     * @param string $id
     * @return bool
     */
    public function delete(string $id): bool
    {
        try {
            // Get the tariff ID before deleting
            $rule = $this->find($id);
            if (!$rule) {
                return false;
            }
            
            $tariffId = $rule['tariff_id'];
            
            // Delete the dynamic discount rule
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_STR);
            $result = $stmt->execute();
            
            // Check if there are any remaining dynamic discount rules for this tariff
            $sql = "SELECT COUNT(*) FROM {$this->table} WHERE tariff_id = :tariff_id";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            
            $count = (int)$stmt->fetchColumn();
            
            // If no dynamic discount rules remain, update the tariff
            if ($count === 0) {
                $sql = "UPDATE tariffs SET has_dynamic_discount = 0 WHERE id = :tariff_id";
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
     * Get applicable dynamic discount rules for a customer and meter
     *
     * @param string $tariffId
     * @param string $customerId
     * @param string $meterId
     * @param float $volume
     * @return array
     */
    public function getApplicableRules(string $tariffId, string $customerId, string $meterId, float $volume): array
    {
        try {
            // Get active rules for today
            $today = date('Y-m-d');
            $rules = $this->getActiveForDate($tariffId, $today);
            
            if (empty($rules)) {
                return [];
            }
            
            // Get customer and meter data for evaluation
            $customerModel = new Customer();
            $meterModel = new Meter();
            
            $customer = $customerModel->find($customerId);
            $meter = $meterModel->find($meterId);
            
            if (!$customer || !$meter) {
                return [];
            }
            
            $tariffModel = new Tariff();
            $applicableRules = [];
            
            foreach ($rules as $rule) {
                $conditions = json_decode($rule['conditions'], true);
                $conditionsMet = $tariffModel->evaluateDynamicDiscountConditions(
                    $rule['rule_type'],
                    $conditions,
                    $customer,
                    $meter,
                    $volume
                );
                
                if ($conditionsMet) {
                    $applicableRules[] = $rule;
                }
            }
            
            return $applicableRules;
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Check if a string is valid JSON
     *
     * @param string $string
     * @return bool
     */
    private function isValidJson(string $string): bool
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
}