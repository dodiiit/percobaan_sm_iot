<?php

namespace IndoWater\Api\Models;

use IndoWater\Api\Database\DB;
use PDO;
use PDOException;
use Ramsey\Uuid\Uuid;

class Tariff extends BaseModel
{
    protected string $table = 'tariffs';
    protected array $fillable = [
        'client_id',
        'property_type',
        'name',
        'description',
        'base_price',
        'is_active',
        'is_seasonal',
        'has_minimum_charge',
        'minimum_charge_amount',
        'has_bulk_discount',
        'has_dynamic_discount',
        'effective_from',
        'effective_to'
    ];

    /**
     * Get all tariffs for a client
     *
     * @param string $clientId
     * @param bool $activeOnly
     * @return array
     */
    public function getAllForClient(string $clientId, bool $activeOnly = true): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE client_id = :client_id";
        
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        
        $sql .= " ORDER BY name ASC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':client_id', $clientId, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get tariffs for a specific property type
     *
     * @param string $clientId
     * @param string $propertyType
     * @param bool $activeOnly
     * @return array
     */
    public function getForPropertyType(string $clientId, string $propertyType, bool $activeOnly = true): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE client_id = :client_id AND property_type = :property_type";
        
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        
        $sql .= " ORDER BY name ASC";
        
        try {
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':client_id', $clientId, PDO::PARAM_STR);
            $stmt->bindParam(':property_type', $propertyType, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logError($e);
            return [];
        }
    }

    /**
     * Get tariff with all its tiers
     *
     * @param string $tariffId
     * @return array|null
     */
    public function getWithTiers(string $tariffId): ?array
    {
        try {
            $tariff = $this->find($tariffId);
            
            if (!$tariff) {
                return null;
            }
            
            // Get tariff tiers
            $sql = "SELECT * FROM tariff_tiers WHERE tariff_id = :tariff_id ORDER BY min_volume ASC";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            $tiers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tariff['tiers'] = $tiers;
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Get tariff with all its seasonal rates
     *
     * @param string $tariffId
     * @return array|null
     */
    public function getWithSeasonalRates(string $tariffId): ?array
    {
        try {
            $tariff = $this->find($tariffId);
            
            if (!$tariff) {
                return null;
            }
            
            // Get seasonal rates
            $sql = "SELECT * FROM seasonal_rates WHERE tariff_id = :tariff_id ORDER BY start_date ASC";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            $seasonalRates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tariff['seasonal_rates'] = $seasonalRates;
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Get tariff with all its bulk discount tiers
     *
     * @param string $tariffId
     * @return array|null
     */
    public function getWithBulkDiscounts(string $tariffId): ?array
    {
        try {
            $tariff = $this->find($tariffId);
            
            if (!$tariff) {
                return null;
            }
            
            // Get bulk discount tiers
            $sql = "SELECT * FROM bulk_discount_tiers WHERE tariff_id = :tariff_id ORDER BY min_volume ASC";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            $bulkDiscounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tariff['bulk_discounts'] = $bulkDiscounts;
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Get tariff with all its dynamic discount rules
     *
     * @param string $tariffId
     * @return array|null
     */
    public function getWithDynamicDiscounts(string $tariffId): ?array
    {
        try {
            $tariff = $this->find($tariffId);
            
            if (!$tariff) {
                return null;
            }
            
            // Get dynamic discount rules
            $sql = "SELECT * FROM dynamic_discount_rules WHERE tariff_id = :tariff_id ORDER BY priority DESC";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            $dynamicDiscounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tariff['dynamic_discounts'] = $dynamicDiscounts;
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Get complete tariff with all related data
     *
     * @param string $tariffId
     * @return array|null
     */
    public function getComplete(string $tariffId): ?array
    {
        try {
            $tariff = $this->find($tariffId);
            
            if (!$tariff) {
                return null;
            }
            
            // Get tariff tiers
            $sql = "SELECT * FROM tariff_tiers WHERE tariff_id = :tariff_id ORDER BY min_volume ASC";
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
            $stmt->execute();
            $tiers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get seasonal rates if applicable
            $seasonalRates = [];
            if ($tariff['is_seasonal']) {
                $sql = "SELECT * FROM seasonal_rates WHERE tariff_id = :tariff_id ORDER BY start_date ASC";
                $stmt = DB::prepare($sql);
                $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
                $stmt->execute();
                $seasonalRates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            // Get bulk discount tiers if applicable
            $bulkDiscounts = [];
            if ($tariff['has_bulk_discount']) {
                $sql = "SELECT * FROM bulk_discount_tiers WHERE tariff_id = :tariff_id ORDER BY min_volume ASC";
                $stmt = DB::prepare($sql);
                $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
                $stmt->execute();
                $bulkDiscounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            // Get dynamic discount rules if applicable
            $dynamicDiscounts = [];
            if ($tariff['has_dynamic_discount']) {
                $sql = "SELECT * FROM dynamic_discount_rules WHERE tariff_id = :tariff_id ORDER BY priority DESC";
                $stmt = DB::prepare($sql);
                $stmt->bindParam(':tariff_id', $tariffId, PDO::PARAM_STR);
                $stmt->execute();
                $dynamicDiscounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            $tariff['tiers'] = $tiers;
            $tariff['seasonal_rates'] = $seasonalRates;
            $tariff['bulk_discounts'] = $bulkDiscounts;
            $tariff['dynamic_discounts'] = $dynamicDiscounts;
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Get tariff assigned to a property
     *
     * @param string $propertyId
     * @return array|null
     */
    public function getForProperty(string $propertyId): ?array
    {
        try {
            $sql = "SELECT t.* FROM {$this->table} t
                    JOIN property_tariffs pt ON t.id = pt.tariff_id
                    WHERE pt.property_id = :property_id
                    AND pt.is_active = 1
                    AND (pt.effective_to IS NULL OR pt.effective_to >= CURDATE())
                    AND pt.effective_from <= CURDATE()
                    ORDER BY pt.effective_from DESC
                    LIMIT 1";
            
            $stmt = DB::prepare($sql);
            $stmt->bindParam(':property_id', $propertyId, PDO::PARAM_STR);
            $stmt->execute();
            
            $tariff = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$tariff) {
                return null;
            }
            
            return $tariff;
        } catch (PDOException $e) {
            $this->logError($e);
            return null;
        }
    }

    /**
     * Calculate price for a given volume of water
     *
     * @param string $tariffId
     * @param float $volume
     * @param string|null $customerId
     * @param string|null $meterId
     * @return array
     */
    public function calculatePrice(string $tariffId, float $volume, ?string $customerId = null, ?string $meterId = null): array
    {
        try {
            $tariff = $this->getComplete($tariffId);
            
            if (!$tariff) {
                return [
                    'success' => false,
                    'message' => 'Tariff not found'
                ];
            }
            
            // Base calculation using tiers
            $basePrice = 0;
            $remainingVolume = $volume;
            
            foreach ($tariff['tiers'] as $tier) {
                $tierMin = (float)$tier['min_volume'];
                $tierMax = $tier['max_volume'] !== null ? (float)$tier['max_volume'] : PHP_FLOAT_MAX;
                $pricePerUnit = (float)$tier['price_per_unit'];
                
                if ($remainingVolume <= 0) {
                    break;
                }
                
                $volumeInTier = min($remainingVolume, $tierMax - $tierMin);
                
                if ($volumeInTier > 0) {
                    $basePrice += $volumeInTier * $pricePerUnit;
                    $remainingVolume -= $volumeInTier;
                }
            }
            
            // Apply minimum charge if applicable
            if ($tariff['has_minimum_charge'] && $basePrice < $tariff['minimum_charge_amount']) {
                $basePrice = (float)$tariff['minimum_charge_amount'];
            }
            
            // Initialize discount tracking
            $discounts = [];
            $finalPrice = $basePrice;
            
            // Apply seasonal rates if applicable
            if ($tariff['is_seasonal'] && !empty($tariff['seasonal_rates'])) {
                $today = date('Y-m-d');
                
                foreach ($tariff['seasonal_rates'] as $seasonalRate) {
                    if ($seasonalRate['is_active'] && $today >= $seasonalRate['start_date'] && $today <= $seasonalRate['end_date']) {
                        $adjustmentType = $seasonalRate['rate_adjustment_type'];
                        $adjustmentValue = (float)$seasonalRate['rate_adjustment_value'];
                        
                        $seasonalDiscount = 0;
                        if ($adjustmentType === 'percentage') {
                            $seasonalDiscount = $basePrice * ($adjustmentValue / 100);
                        } else { // fixed
                            $seasonalDiscount = $adjustmentValue;
                        }
                        
                        $finalPrice -= $seasonalDiscount;
                        
                        $discounts[] = [
                            'type' => 'seasonal_rate',
                            'id' => $seasonalRate['id'],
                            'name' => $seasonalRate['name'],
                            'amount' => $seasonalDiscount
                        ];
                        
                        // Only apply the first matching seasonal rate
                        break;
                    }
                }
            }
            
            // Apply bulk discounts if applicable
            if ($tariff['has_bulk_discount'] && !empty($tariff['bulk_discounts'])) {
                foreach ($tariff['bulk_discounts'] as $bulkDiscount) {
                    if ($bulkDiscount['is_active'] && 
                        $volume >= (float)$bulkDiscount['min_volume'] && 
                        ($bulkDiscount['max_volume'] === null || $volume <= (float)$bulkDiscount['max_volume'])) {
                        
                        $discountType = $bulkDiscount['discount_type'];
                        $discountValue = (float)$bulkDiscount['discount_value'];
                        
                        $bulkDiscountAmount = 0;
                        if ($discountType === 'percentage') {
                            $bulkDiscountAmount = $basePrice * ($discountValue / 100);
                        } else { // fixed
                            $bulkDiscountAmount = $discountValue;
                        }
                        
                        $finalPrice -= $bulkDiscountAmount;
                        
                        $discounts[] = [
                            'type' => 'bulk_discount',
                            'id' => $bulkDiscount['id'],
                            'min_volume' => $bulkDiscount['min_volume'],
                            'max_volume' => $bulkDiscount['max_volume'],
                            'amount' => $bulkDiscountAmount
                        ];
                        
                        // Only apply the first matching bulk discount
                        break;
                    }
                }
            }
            
            // Apply dynamic discounts if applicable
            if ($tariff['has_dynamic_discount'] && !empty($tariff['dynamic_discounts']) && $customerId && $meterId) {
                // Get customer and meter data for dynamic discount evaluation
                $customerModel = new Customer();
                $meterModel = new Meter();
                
                $customer = $customerModel->find($customerId);
                $meter = $meterModel->find($meterId);
                
                if ($customer && $meter) {
                    $today = date('Y-m-d');
                    
                    foreach ($tariff['dynamic_discounts'] as $dynamicDiscount) {
                        if (!$dynamicDiscount['is_active']) {
                            continue;
                        }
                        
                        // Check date range if applicable
                        if (($dynamicDiscount['start_date'] && $today < $dynamicDiscount['start_date']) ||
                            ($dynamicDiscount['end_date'] && $today > $dynamicDiscount['end_date'])) {
                            continue;
                        }
                        
                        // Evaluate dynamic discount conditions
                        $conditions = json_decode($dynamicDiscount['conditions'], true);
                        $conditionsMet = $this->evaluateDynamicDiscountConditions(
                            $dynamicDiscount['rule_type'],
                            $conditions,
                            $customer,
                            $meter,
                            $volume
                        );
                        
                        if ($conditionsMet) {
                            $discountType = $dynamicDiscount['discount_type'];
                            $discountValue = (float)$dynamicDiscount['discount_value'];
                            
                            $dynamicDiscountAmount = 0;
                            if ($discountType === 'percentage') {
                                $dynamicDiscountAmount = $basePrice * ($discountValue / 100);
                            } else { // fixed
                                $dynamicDiscountAmount = $discountValue;
                            }
                            
                            // Apply max discount cap if set
                            if ($dynamicDiscount['max_discount_amount'] !== null) {
                                $dynamicDiscountAmount = min($dynamicDiscountAmount, (float)$dynamicDiscount['max_discount_amount']);
                            }
                            
                            $finalPrice -= $dynamicDiscountAmount;
                            
                            $discounts[] = [
                                'type' => 'dynamic_discount',
                                'id' => $dynamicDiscount['id'],
                                'name' => $dynamicDiscount['name'],
                                'rule_type' => $dynamicDiscount['rule_type'],
                                'amount' => $dynamicDiscountAmount
                            ];
                            
                            // Only apply the highest priority dynamic discount
                            break;
                        }
                    }
                }
            }
            
            // Ensure final price is not negative
            $finalPrice = max(0, $finalPrice);
            
            return [
                'success' => true,
                'tariff_id' => $tariffId,
                'tariff_name' => $tariff['name'],
                'volume' => $volume,
                'base_price' => $basePrice,
                'discounts' => $discounts,
                'final_price' => $finalPrice
            ];
        } catch (PDOException $e) {
            $this->logError($e);
            return [
                'success' => false,
                'message' => 'Error calculating price: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Evaluate dynamic discount conditions
     *
     * @param string $ruleType
     * @param array $conditions
     * @param array $customer
     * @param array $meter
     * @param float $volume
     * @return bool
     */
    private function evaluateDynamicDiscountConditions(string $ruleType, array $conditions, array $customer, array $meter, float $volume): bool
    {
        switch ($ruleType) {
            case 'time_based':
                return $this->evaluateTimeBasedConditions($conditions);
                
            case 'volume_based':
                return $this->evaluateVolumeBasedConditions($conditions, $volume);
                
            case 'customer_based':
                return $this->evaluateCustomerBasedConditions($conditions, $customer);
                
            case 'inventory_based':
                return $this->evaluateInventoryBasedConditions($conditions, $meter);
                
            case 'combined':
                return $this->evaluateCombinedConditions($conditions, $customer, $meter, $volume);
                
            default:
                return false;
        }
    }

    /**
     * Evaluate time-based conditions
     *
     * @param array $conditions
     * @return bool
     */
    private function evaluateTimeBasedConditions(array $conditions): bool
    {
        $now = time();
        $today = date('Y-m-d');
        $currentHour = (int)date('H');
        $currentDay = date('l'); // Day of week
        $currentMonth = date('n'); // Month number
        
        if (isset($conditions['time_range'])) {
            $startHour = (int)$conditions['time_range']['start'];
            $endHour = (int)$conditions['time_range']['end'];
            
            if ($currentHour < $startHour || $currentHour >= $endHour) {
                return false;
            }
        }
        
        if (isset($conditions['days_of_week']) && !in_array($currentDay, $conditions['days_of_week'])) {
            return false;
        }
        
        if (isset($conditions['months']) && !in_array($currentMonth, $conditions['months'])) {
            return false;
        }
        
        if (isset($conditions['specific_dates'])) {
            $matchesSpecificDate = false;
            foreach ($conditions['specific_dates'] as $date) {
                if ($today === $date) {
                    $matchesSpecificDate = true;
                    break;
                }
            }
            
            if (!$matchesSpecificDate) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Evaluate volume-based conditions
     *
     * @param array $conditions
     * @param float $volume
     * @return bool
     */
    private function evaluateVolumeBasedConditions(array $conditions, float $volume): bool
    {
        if (isset($conditions['min_volume']) && $volume < $conditions['min_volume']) {
            return false;
        }
        
        if (isset($conditions['max_volume']) && $volume > $conditions['max_volume']) {
            return false;
        }
        
        return true;
    }

    /**
     * Evaluate customer-based conditions
     *
     * @param array $conditions
     * @param array $customer
     * @return bool
     */
    private function evaluateCustomerBasedConditions(array $conditions, array $customer): bool
    {
        if (isset($conditions['customer_since'])) {
            $customerSince = strtotime($customer['created_at']);
            $requiredSince = strtotime($conditions['customer_since']);
            
            if ($customerSince > $requiredSince) {
                return false;
            }
        }
        
        if (isset($conditions['city']) && $customer['city'] !== $conditions['city']) {
            return false;
        }
        
        if (isset($conditions['province']) && $customer['province'] !== $conditions['province']) {
            return false;
        }
        
        // Add more customer-based conditions as needed
        
        return true;
    }

    /**
     * Evaluate inventory-based conditions
     *
     * @param array $conditions
     * @param array $meter
     * @return bool
     */
    private function evaluateInventoryBasedConditions(array $conditions, array $meter): bool
    {
        if (isset($conditions['meter_type']) && $meter['meter_type'] !== $conditions['meter_type']) {
            return false;
        }
        
        if (isset($conditions['meter_model']) && $meter['meter_model'] !== $conditions['meter_model']) {
            return false;
        }
        
        // Add more inventory-based conditions as needed
        
        return true;
    }

    /**
     * Evaluate combined conditions
     *
     * @param array $conditions
     * @param array $customer
     * @param array $meter
     * @param float $volume
     * @return bool
     */
    private function evaluateCombinedConditions(array $conditions, array $customer, array $meter, float $volume): bool
    {
        if (isset($conditions['time_based'])) {
            if (!$this->evaluateTimeBasedConditions($conditions['time_based'])) {
                return false;
            }
        }
        
        if (isset($conditions['volume_based'])) {
            if (!$this->evaluateVolumeBasedConditions($conditions['volume_based'], $volume)) {
                return false;
            }
        }
        
        if (isset($conditions['customer_based'])) {
            if (!$this->evaluateCustomerBasedConditions($conditions['customer_based'], $customer)) {
                return false;
            }
        }
        
        if (isset($conditions['inventory_based'])) {
            if (!$this->evaluateInventoryBasedConditions($conditions['inventory_based'], $meter)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Record applied discount
     *
     * @param array $discountData
     * @return bool
     */
    public function recordAppliedDiscount(array $discountData): bool
    {
        try {
            $discountData['id'] = Uuid::uuid4()->toString();
            
            $sql = "INSERT INTO applied_discounts (
                id, customer_id, meter_id, reading_id, payment_id, 
                discount_source_type, discount_source_id, original_amount, 
                discount_amount, final_amount, applied_at, created_at
            ) VALUES (
                :id, :customer_id, :meter_id, :reading_id, :payment_id,
                :discount_source_type, :discount_source_id, :original_amount,
                :discount_amount, :final_amount, :applied_at, :created_at
            )";
            
            $stmt = DB::prepare($sql);
            
            $now = date('Y-m-d H:i:s');
            $discountData['applied_at'] = $now;
            $discountData['created_at'] = $now;
            
            $stmt->bindParam(':id', $discountData['id'], PDO::PARAM_STR);
            $stmt->bindParam(':customer_id', $discountData['customer_id'], PDO::PARAM_STR);
            $stmt->bindParam(':meter_id', $discountData['meter_id'], PDO::PARAM_STR);
            $stmt->bindParam(':reading_id', $discountData['reading_id'], PDO::PARAM_STR);
            $stmt->bindParam(':payment_id', $discountData['payment_id'], PDO::PARAM_STR);
            $stmt->bindParam(':discount_source_type', $discountData['discount_source_type'], PDO::PARAM_STR);
            $stmt->bindParam(':discount_source_id', $discountData['discount_source_id'], PDO::PARAM_STR);
            $stmt->bindParam(':original_amount', $discountData['original_amount'], PDO::PARAM_STR);
            $stmt->bindParam(':discount_amount', $discountData['discount_amount'], PDO::PARAM_STR);
            $stmt->bindParam(':final_amount', $discountData['final_amount'], PDO::PARAM_STR);
            $stmt->bindParam(':applied_at', $discountData['applied_at'], PDO::PARAM_STR);
            $stmt->bindParam(':created_at', $discountData['created_at'], PDO::PARAM_STR);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            $this->logError($e);
            return false;
        }
    }
}