<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class Valve extends BaseModel
{
    protected string $table = 'valves';
    
    protected array $fillable = [
        'valve_id', 'meter_id', 'property_id', 'valve_type', 'valve_model', 
        'valve_serial', 'firmware_version', 'hardware_version', 'location_description',
        'latitude', 'longitude', 'installation_date', 'status', 'current_state',
        'battery_level', 'signal_strength', 'operating_pressure', 'max_pressure',
        'temperature', 'auto_close_enabled', 'emergency_close_enabled'
    ];

    protected array $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'battery_level' => 'float',
        'signal_strength' => 'int',
        'operating_pressure' => 'float',
        'max_pressure' => 'float',
        'temperature' => 'float',
        'auto_close_enabled' => 'bool',
        'emergency_close_enabled' => 'bool'
    ];

    public function findByValveId(string $valveId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE valve_id = ? AND deleted_at IS NULL");
        $stmt->execute([$valveId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function findByMeterId(string $meterId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE meter_id = ? AND deleted_at IS NULL ORDER BY valve_type ASC");
        $stmt->execute([$meterId]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function updateState(string $id, string $newState, ?string $commandId = null): bool
    {
        $this->beginTransaction();
        
        try {
            // Get current valve data
            $valve = $this->find($id);
            if (!$valve) {
                throw new \Exception('Valve not found');
            }

            $previousState = $valve['current_state'];
            
            // Update valve state
            $updateData = [
                'current_state' => $newState,
                'last_response_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $this->update($id, $updateData);

            // Record state change in history
            $historyId = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $historyData = [
                'id' => $historyId,
                'valve_id' => $id,
                'previous_state' => $previousState,
                'new_state' => $newState,
                'change_reason' => $commandId ? 'manual_command' : 'device_report',
                'command_id' => $commandId,
                'created_at' => date('Y-m-d H:i:s')
            ];

            $sql = "INSERT INTO valve_status_history (id, valve_id, previous_state, new_state, change_reason, command_id, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $historyData['id'],
                $historyData['valve_id'],
                $historyData['previous_state'],
                $historyData['new_state'],
                $historyData['change_reason'],
                $historyData['command_id'],
                $historyData['created_at']
            ]);

            $this->commit();
            return true;

        } catch (\Exception $e) {
            $this->rollback();
            throw $e;
        }
    }

    public function updateDeviceStatus(string $id, array $statusData): bool
    {
        $allowedFields = [
            'battery_level', 'signal_strength', 'operating_pressure', 
            'temperature', 'current_state', 'status'
        ];

        $updateData = array_intersect_key($statusData, array_flip($allowedFields));
        $updateData['last_response_at'] = date('Y-m-d H:i:s');
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        return $this->update($id, $updateData);
    }

    public function getStatusHistory(string $id, int $limit = 50): array
    {
        $sql = "SELECT vsh.*, u.name as triggered_by_name, vc.command_type
                FROM valve_status_history vsh
                LEFT JOIN users u ON vsh.triggered_by = u.id
                LEFT JOIN valve_commands vc ON vsh.command_id = vc.id
                WHERE vsh.valve_id = ? 
                ORDER BY vsh.created_at DESC 
                LIMIT ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getActiveAlerts(string $id): array
    {
        $sql = "SELECT * FROM valve_alerts 
                WHERE valve_id = ? AND is_resolved = 0 
                ORDER BY severity DESC, created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function createAlert(string $valveId, string $alertType, string $severity, string $title, string $message, ?array $alertData = null): string
    {
        $alertId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO valve_alerts (id, valve_id, alert_type, severity, title, message, alert_data, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $alertId,
            $valveId,
            $alertType,
            $severity,
            $title,
            $message,
            $alertData ? json_encode($alertData) : null,
            date('Y-m-d H:i:s'),
            date('Y-m-d H:i:s')
        ]);

        return $alertId;
    }

    public function acknowledgeAlert(string $alertId, string $userId): bool
    {
        $sql = "UPDATE valve_alerts 
                SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?, updated_at = ?
                WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $userId,
            date('Y-m-d H:i:s'),
            date('Y-m-d H:i:s'),
            $alertId
        ]);
    }

    public function resolveAlert(string $alertId, string $userId, ?string $resolutionNotes = null): bool
    {
        $sql = "UPDATE valve_alerts 
                SET is_resolved = 1, resolved_by = ?, resolved_at = ?, resolution_notes = ?, updated_at = ?
                WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $userId,
            date('Y-m-d H:i:s'),
            $resolutionNotes,
            date('Y-m-d H:i:s'),
            $alertId
        ]);
    }

    public function getValveOverview(): array
    {
        $sql = "SELECT * FROM valve_status_overview ORDER BY health_status DESC, valve_id ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getValvesByStatus(string $status): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE status = ? AND deleted_at IS NULL ORDER BY valve_id ASC");
        $stmt->execute([$status]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getValvesByState(string $state): array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE current_state = ? AND deleted_at IS NULL ORDER BY valve_id ASC");
        $stmt->execute([$state]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getMaintenanceDue(int $days = 7): array
    {
        $sql = "SELECT v.*, vm.next_maintenance_date, vm.maintenance_type
                FROM {$this->table} v
                LEFT JOIN valve_maintenance vm ON v.id = vm.valve_id AND vm.status = 'scheduled'
                WHERE v.deleted_at IS NULL 
                AND (vm.next_maintenance_date IS NULL OR vm.next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
                ORDER BY vm.next_maintenance_date ASC, v.valve_id ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$days]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getLowBatteryValves(float $threshold = 20.0): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM {$this->table} 
            WHERE battery_level IS NOT NULL 
            AND battery_level <= ? 
            AND deleted_at IS NULL 
            ORDER BY battery_level ASC
        ");
        $stmt->execute([$threshold]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getOfflineValves(int $minutesThreshold = 30): array
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE (last_response_at IS NULL OR last_response_at < DATE_SUB(NOW(), INTERVAL ? MINUTE))
                AND status != 'inactive'
                AND deleted_at IS NULL 
                ORDER BY last_response_at ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$minutesThreshold]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getStatistics(): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_valves,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_valves,
                    SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_valves,
                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_valves,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_valves,
                    SUM(CASE WHEN current_state = 'open' THEN 1 ELSE 0 END) as open_valves,
                    SUM(CASE WHEN current_state = 'closed' THEN 1 ELSE 0 END) as closed_valves,
                    SUM(CASE WHEN current_state = 'partial' THEN 1 ELSE 0 END) as partial_valves,
                    SUM(CASE WHEN battery_level IS NOT NULL AND battery_level <= 20 THEN 1 ELSE 0 END) as low_battery_valves,
                    AVG(CASE WHEN battery_level IS NOT NULL THEN battery_level ELSE NULL END) as avg_battery_level,
                    AVG(CASE WHEN signal_strength IS NOT NULL THEN signal_strength ELSE NULL END) as avg_signal_strength
                FROM {$this->table} 
                WHERE deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        // Convert numeric strings to appropriate types
        foreach ($result as $key => $value) {
            if (in_array($key, ['avg_battery_level', 'avg_signal_strength']) && $value !== null) {
                $result[$key] = (float) $value;
            } elseif (is_numeric($value)) {
                $result[$key] = (int) $value;
            }
        }
        
        return $result;
    }
}