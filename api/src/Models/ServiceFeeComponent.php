<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use Ramsey\Uuid\Uuid;

class ServiceFeeComponent extends BaseModel
{
    protected string $table = 'service_fee_components';
    
    protected array $fillable = [
        'plan_id', 'name', 'fee_type', 'fee_value', 
        'min_transaction_amount', 'max_transaction_amount',
        'min_fee_amount', 'max_fee_amount', 'is_active'
    ];

    protected array $casts = [
        'fee_value' => 'float',
        'min_transaction_amount' => 'float',
        'max_transaction_amount' => 'float',
        'min_fee_amount' => 'float',
        'max_fee_amount' => 'float',
        'is_active' => 'boolean'
    ];

    public function getTiers(string $componentId): array
    {
        $sql = "SELECT * FROM service_fee_tiers 
                WHERE component_id = ? AND deleted_at IS NULL 
                ORDER BY min_amount ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$componentId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function addTier(string $componentId, float $minAmount, ?float $maxAmount, float $feeValue): array
    {
        $id = Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO service_fee_tiers 
                (id, component_id, min_amount, max_amount, fee_value) 
                VALUES (?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $componentId, $minAmount, $maxAmount, $feeValue]);
        
        return [
            'id' => $id,
            'component_id' => $componentId,
            'min_amount' => $minAmount,
            'max_amount' => $maxAmount,
            'fee_value' => $feeValue
        ];
    }

    public function updateTier(string $tierId, array $data): bool
    {
        $allowedFields = ['min_amount', 'max_amount', 'fee_value'];
        $updates = [];
        $params = [];
        
        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $updates[] = "{$field} = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $tierId;
        $sql = "UPDATE service_fee_tiers SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function deleteTier(string $tierId): bool
    {
        $sql = "UPDATE service_fee_tiers SET deleted_at = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$tierId]);
    }

    public function calculateFee(string $componentId, float $transactionAmount): array
    {
        $component = $this->find($componentId);
        if (!$component) {
            throw new \Exception('Service fee component not found');
        }

        // Check if transaction amount is within allowed range
        if ($component['min_transaction_amount'] !== null && $transactionAmount < $component['min_transaction_amount']) {
            return [
                'component_id' => $componentId,
                'fee_amount' => 0,
                'fee_type' => $component['fee_type'],
                'fee_value' => $component['fee_value'],
                'transaction_amount' => $transactionAmount,
                'reason' => 'Transaction amount below minimum'
            ];
        }

        if ($component['max_transaction_amount'] !== null && $transactionAmount > $component['max_transaction_amount']) {
            return [
                'component_id' => $componentId,
                'fee_amount' => 0,
                'fee_type' => $component['fee_type'],
                'fee_value' => $component['fee_value'],
                'transaction_amount' => $transactionAmount,
                'reason' => 'Transaction amount above maximum'
            ];
        }

        $feeAmount = 0;

        // Calculate fee based on type
        switch ($component['fee_type']) {
            case 'fixed':
                $feeAmount = $component['fee_value'];
                break;
                
            case 'percentage':
                $feeAmount = $transactionAmount * ($component['fee_value'] / 100);
                break;
                
            case 'tiered_fixed':
                $tiers = $this->getTiers($componentId);
                foreach ($tiers as $tier) {
                    if ($transactionAmount >= $tier['min_amount'] && 
                        ($tier['max_amount'] === null || $transactionAmount <= $tier['max_amount'])) {
                        $feeAmount = $tier['fee_value'];
                        break;
                    }
                }
                break;
                
            case 'tiered_percentage':
                $tiers = $this->getTiers($componentId);
                foreach ($tiers as $tier) {
                    if ($transactionAmount >= $tier['min_amount'] && 
                        ($tier['max_amount'] === null || $transactionAmount <= $tier['max_amount'])) {
                        $feeAmount = $transactionAmount * ($tier['fee_value'] / 100);
                        break;
                    }
                }
                break;
        }

        // Apply min/max fee constraints
        if ($component['min_fee_amount'] !== null && $feeAmount < $component['min_fee_amount']) {
            $feeAmount = $component['min_fee_amount'];
        }

        if ($component['max_fee_amount'] !== null && $feeAmount > $component['max_fee_amount']) {
            $feeAmount = $component['max_fee_amount'];
        }

        return [
            'component_id' => $componentId,
            'fee_amount' => $feeAmount,
            'fee_type' => $component['fee_type'],
            'fee_value' => $component['fee_value'],
            'transaction_amount' => $transactionAmount
        ];
    }
}