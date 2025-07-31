<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class Meter extends BaseModel
{
    protected string $table = 'meters';
    
    protected array $fillable = [
        'meter_id', 'customer_id', 'property_id', 'installation_date',
        'meter_type', 'meter_model', 'meter_serial', 'firmware_version',
        'hardware_version', 'location_description', 'latitude', 'longitude',
        'status', 'last_reading', 'last_reading_at', 'last_credit', 'last_credit_at'
    ];

    protected array $casts = [
        'last_reading' => 'float',
        'last_credit' => 'float',
        'latitude' => 'float',
        'longitude' => 'float'
    ];

    public function findByMeterId(string $meterId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE meter_id = ? AND deleted_at IS NULL");
        $stmt->execute([$meterId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function updateReading(string $id, float $reading, array $additionalData = []): bool
    {
        $data = array_merge([
            'last_reading' => $reading,
            'last_reading_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ], $additionalData);

        $setClause = [];
        foreach (array_keys($data) as $key) {
            $setClause[] = "{$key} = :{$key}";
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . " WHERE id = :id";
        $data['id'] = $id;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    public function updateCredit(string $id, float $credit): bool
    {
        $sql = "UPDATE {$this->table} SET last_credit = ?, last_credit_at = ?, updated_at = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$credit, date('Y-m-d H:i:s'), date('Y-m-d H:i:s'), $id]);
    }

    public function getReadings(string $meterId, int $limit = 100): array
    {
        $sql = "SELECT * FROM meter_readings WHERE meter_id = ? ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$meterId, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function addReading(string $meterId, array $readingData): bool
    {
        $readingData['id'] = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $readingData['meter_id'] = $meterId;
        $readingData['created_at'] = date('Y-m-d H:i:s');

        $columns = implode(', ', array_keys($readingData));
        $placeholders = ':' . implode(', :', array_keys($readingData));

        $sql = "INSERT INTO meter_readings ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($readingData);
    }

    public function getConsumption(string $meterId, string $startDate, string $endDate): array
    {
        $sql = "SELECT 
                    DATE(created_at) as date,
                    MIN(reading) as start_reading,
                    MAX(reading) as end_reading,
                    (MAX(reading) - MIN(reading)) as consumption,
                    COUNT(*) as reading_count
                FROM meter_readings 
                WHERE meter_id = ? AND DATE(created_at) BETWEEN ? AND ?
                GROUP BY DATE(created_at)
                ORDER BY date ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$meterId, $startDate, $endDate]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function updateCredit(string $id, float $newBalance): bool
    {
        $sql = "UPDATE {$this->table} SET last_credit = ?, last_credit_at = ?, updated_at = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$newBalance, date('Y-m-d H:i:s'), date('Y-m-d H:i:s'), $id]);
    }

    public function getBalance(string $id): ?float
    {
        $sql = "SELECT last_credit FROM {$this->table} WHERE id = ? AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $result = $stmt->fetchColumn();
        
        return $result !== false ? (float) $result : null;
    }

    public function getBalanceByMeterId(string $meterId): ?float
    {
        $sql = "SELECT last_credit FROM {$this->table} WHERE meter_id = ? AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$meterId]);
        $result = $stmt->fetchColumn();
        
        return $result !== false ? (float) $result : null;
    }

    public function addCredit(string $id, float $amount, string $description = 'Credit top-up'): array
    {
        $this->beginTransaction();
        
        try {
            // Get current meter data
            $meter = $this->find($id);
            if (!$meter) {
                throw new \Exception('Meter not found');
            }

            $previousBalance = (float) $meter['last_credit'];
            $newBalance = $previousBalance + $amount;

            // Update meter balance
            $this->updateCredit($id, $newBalance);

            // Create credit record
            $creditId = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $creditData = [
                'id' => $creditId,
                'meter_id' => $id,
                'customer_id' => $meter['customer_id'],
                'amount' => $amount,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'description' => $description,
                'status' => 'success',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $sql = "INSERT INTO credits (id, meter_id, customer_id, amount, previous_balance, new_balance, description, status, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $creditData['id'],
                $creditData['meter_id'],
                $creditData['customer_id'],
                $creditData['amount'],
                $creditData['previous_balance'],
                $creditData['new_balance'],
                $creditData['description'],
                $creditData['status'],
                $creditData['created_at'],
                $creditData['updated_at']
            ]);

            $this->commit();

            return [
                'credit_id' => $creditId,
                'meter_id' => $meter['meter_id'],
                'amount' => $amount,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'description' => $description
            ];

        } catch (\Exception $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function deductCredit(string $id, float $amount, string $description = 'Water consumption'): array
    {
        $this->beginTransaction();
        
        try {
            // Get current meter data
            $meter = $this->find($id);
            if (!$meter) {
                throw new \Exception('Meter not found');
            }

            $previousBalance = (float) $meter['last_credit'];
            
            if ($previousBalance < $amount) {
                throw new \Exception('Insufficient credit balance');
            }

            $newBalance = $previousBalance - $amount;

            // Update meter balance
            $this->updateCredit($id, $newBalance);

            // Create credit record
            $creditId = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $creditData = [
                'id' => $creditId,
                'meter_id' => $id,
                'customer_id' => $meter['customer_id'],
                'amount' => -$amount, // Negative for deduction
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'description' => $description,
                'status' => 'success',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $sql = "INSERT INTO credits (id, meter_id, customer_id, amount, previous_balance, new_balance, description, status, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $creditData['id'],
                $creditData['meter_id'],
                $creditData['customer_id'],
                $creditData['amount'],
                $creditData['previous_balance'],
                $creditData['new_balance'],
                $creditData['description'],
                $creditData['status'],
                $creditData['created_at'],
                $creditData['updated_at']
            ]);

            $this->commit();

            return [
                'credit_id' => $creditId,
                'meter_id' => $meter['meter_id'],
                'amount' => -$amount,
                'previous_balance' => $previousBalance,
                'new_balance' => $newBalance,
                'description' => $description
            ];

        } catch (\Exception $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function getCreditHistory(string $id, int $limit = 50): array
    {
        $sql = "SELECT * FROM credits WHERE meter_id = ? ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}