<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class AppliedDiscount extends BaseModel
{
    protected string $table = 'applied_discounts';
    protected array $fillable = [
        'customer_id',
        'meter_id',
        'reading_id',
        'payment_id',
        'discount_source_type',
        'discount_source_id',
        'original_amount',
        'discount_amount',
        'final_amount',
        'applied_at'
    ];

    /**
     * Get all applied discounts for a customer
     *
     * @param string $customerId
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAllForCustomer(string $customerId, int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT ad.*, 
                       c.first_name, c.last_name,
                       m.meter_id as meter_number
                FROM {$this->table} ad
                JOIN customers c ON ad.customer_id = c.id
                JOIN meters m ON ad.meter_id = m.id
                WHERE ad.customer_id = :customer_id
                ORDER BY ad.applied_at DESC
                LIMIT :limit OFFSET :offset";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':customer_id', $customerId, PDO::PARAM_STR);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get all applied discounts for a meter
     *
     * @param string $meterId
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function getAllForMeter(string $meterId, int $limit = 50, int $offset = 0): array
    {
        $sql = "SELECT ad.*, 
                       c.first_name, c.last_name,
                       m.meter_id as meter_number
                FROM {$this->table} ad
                JOIN customers c ON ad.customer_id = c.id
                JOIN meters m ON ad.meter_id = m.id
                WHERE ad.meter_id = :meter_id
                ORDER BY ad.applied_at DESC
                LIMIT :limit OFFSET :offset";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':meter_id', $meterId, PDO::PARAM_STR);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get all applied discounts for a payment
     *
     * @param string $paymentId
     * @return array
     */
    public function getAllForPayment(string $paymentId): array
    {
        $sql = "SELECT ad.*, 
                       c.first_name, c.last_name,
                       m.meter_id as meter_number
                FROM {$this->table} ad
                JOIN customers c ON ad.customer_id = c.id
                JOIN meters m ON ad.meter_id = m.id
                WHERE ad.payment_id = :payment_id
                ORDER BY ad.applied_at DESC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':payment_id', $paymentId, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get all applied discounts for a reading
     *
     * @param string $readingId
     * @return array
     */
    public function getAllForReading(string $readingId): array
    {
        $sql = "SELECT ad.*, 
                       c.first_name, c.last_name,
                       m.meter_id as meter_number
                FROM {$this->table} ad
                JOIN customers c ON ad.customer_id = c.id
                JOIN meters m ON ad.meter_id = m.id
                WHERE ad.reading_id = :reading_id
                ORDER BY ad.applied_at DESC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':reading_id', $readingId, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get discount source details
     *
     * @param string $sourceType
     * @param string $sourceId
     * @return array|null
     */
    public function getDiscountSourceDetails(string $sourceType, string $sourceId): ?array
    {
        try {
            switch ($sourceType) {
                case 'seasonal_rate':
                    $sql = "SELECT sr.*, t.name as tariff_name
                            FROM seasonal_rates sr
                            JOIN tariffs t ON sr.tariff_id = t.id
                            WHERE sr.id = :source_id";
                    break;
                    
                case 'bulk_discount':
                    $sql = "SELECT bdt.*, t.name as tariff_name
                            FROM bulk_discount_tiers bdt
                            JOIN tariffs t ON bdt.tariff_id = t.id
                            WHERE bdt.id = :source_id";
                    break;
                    
                case 'dynamic_discount':
                    $sql = "SELECT ddr.*, t.name as tariff_name
                            FROM dynamic_discount_rules ddr
                            JOIN tariffs t ON ddr.tariff_id = t.id
                            WHERE ddr.id = :source_id";
                    break;
                    
                default:
                    return null;
            }
            
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':source_id', $sourceId, PDO::PARAM_STR);
            $stmt->execute();
            
            $source = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $source ?: null;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Create a new applied discount record
     *
     * @param array $data
     * @return array|null
     */
    public function create(array $data): ?array
    {
        // Generate UUID
        $data['id'] = Uuid::uuid4()->toString();
        
        // Set timestamps if not provided
        if (!isset($data['applied_at'])) {
            $data['applied_at'] = date('Y-m-d H:i:s');
        }
        
        $data['created_at'] = date('Y-m-d H:i:s');
        
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
            $this->setError('Failed to create applied discount record: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get discount statistics for a customer
     *
     * @param string $customerId
     * @param string|null $startDate
     * @param string|null $endDate
     * @return array
     */
    public function getCustomerDiscountStats(string $customerId, ?string $startDate = null, ?string $endDate = null): array
    {
        try {
            $params = [':customer_id' => $customerId];
            $dateFilter = '';
            
            if ($startDate) {
                $dateFilter .= " AND applied_at >= :start_date";
                $params[':start_date'] = $startDate . ' 00:00:00';
            }
            
            if ($endDate) {
                $dateFilter .= " AND applied_at <= :end_date";
                $params[':end_date'] = $endDate . ' 23:59:59';
            }
            
            // Get total discount amount
            $sql = "SELECT SUM(discount_amount) as total_discount_amount,
                           SUM(original_amount) as total_original_amount,
                           COUNT(*) as total_discounts
                    FROM {$this->table}
                    WHERE customer_id = :customer_id{$dateFilter}";
            
            $stmt = DB::prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            $totals = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get discount breakdown by type
            $sql = "SELECT discount_source_type, 
                           COUNT(*) as count,
                           SUM(discount_amount) as total_amount
                    FROM {$this->table}
                    WHERE customer_id = :customer_id{$dateFilter}
                    GROUP BY discount_source_type";
            
            $stmt = DB::prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            $breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'totals' => $totals,
                'breakdown' => $breakdown
            ];
        } catch (PDOException $e) {
            $this->logError($e);
            return [
                'totals' => [
                    'total_discount_amount' => 0,
                    'total_original_amount' => 0,
                    'total_discounts' => 0
                ],
                'breakdown' => []
            ];
        }
    }
}