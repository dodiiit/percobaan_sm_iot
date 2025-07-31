<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use Ramsey\Uuid\Uuid;

class ServiceFeePlan extends BaseModel
{
    protected string $table = 'service_fee_plans';
    
    protected array $fillable = [
        'name', 'description', 'is_active'
    ];

    protected array $casts = [
        'is_active' => 'boolean'
    ];

    public function getComponents(string $planId): array
    {
        $sql = "SELECT * FROM service_fee_components 
                WHERE plan_id = ? AND deleted_at IS NULL 
                ORDER BY created_at ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$planId]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map([$this, 'castAttributes'], $results);
    }

    public function getWithComponents(string $planId): ?array
    {
        $plan = $this->find($planId);
        if (!$plan) {
            return null;
        }

        $plan['components'] = $this->getComponents($planId);
        
        // Get tiers for each component
        foreach ($plan['components'] as &$component) {
            if (in_array($component['fee_type'], ['tiered_percentage', 'tiered_fixed'])) {
                $sql = "SELECT * FROM service_fee_tiers 
                        WHERE component_id = ? AND deleted_at IS NULL 
                        ORDER BY min_amount ASC";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$component['id']]);
                $component['tiers'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            }
        }

        return $plan;
    }

    public function getActiveClientPlan(string $clientId): ?array
    {
        $today = date('Y-m-d');
        
        // First check for a direct assignment in client_service_fee_plans
        $sql = "SELECT p.*, a.effective_from, a.effective_to 
                FROM client_service_fee_plans a
                JOIN service_fee_plans p ON a.plan_id = p.id
                WHERE a.client_id = ? 
                AND a.is_active = 1
                AND a.deleted_at IS NULL
                AND p.deleted_at IS NULL
                AND a.effective_from <= ?
                AND (a.effective_to IS NULL OR a.effective_to >= ?)
                ORDER BY a.effective_from DESC
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId, $today, $today]);
        $plan = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($plan) {
            return $this->getWithComponents($plan['id']);
        }
        
        // If no direct assignment, check for plan_id in clients table
        $sql = "SELECT p.* 
                FROM clients c
                JOIN service_fee_plans p ON c.service_fee_plan_id = p.id
                WHERE c.id = ? 
                AND c.deleted_at IS NULL
                AND p.is_active = 1
                AND p.deleted_at IS NULL
                LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        $plan = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($plan) {
            return $this->getWithComponents($plan['id']);
        }
        
        return null;
    }

    public function assignToClient(string $planId, string $clientId, string $effectiveFrom, ?string $effectiveTo = null): array
    {
        $id = Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO client_service_fee_plans 
                (id, client_id, plan_id, effective_from, effective_to, is_active) 
                VALUES (?, ?, ?, ?, ?, 1)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $clientId, $planId, $effectiveFrom, $effectiveTo]);
        
        return [
            'id' => $id,
            'client_id' => $clientId,
            'plan_id' => $planId,
            'effective_from' => $effectiveFrom,
            'effective_to' => $effectiveTo,
            'is_active' => true
        ];
    }

    public function getClientAssignments(string $clientId): array
    {
        $sql = "SELECT a.*, p.name as plan_name 
                FROM client_service_fee_plans a
                JOIN service_fee_plans p ON a.plan_id = p.id
                WHERE a.client_id = ? 
                AND a.deleted_at IS NULL
                ORDER BY a.effective_from DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}