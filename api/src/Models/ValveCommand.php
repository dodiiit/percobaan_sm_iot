<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class ValveCommand extends BaseModel
{
    protected string $table = 'valve_commands';
    
    protected array $fillable = [
        'valve_id', 'command_type', 'command_value', 'initiated_by', 'reason',
        'priority', 'status', 'timeout_seconds', 'max_retries', 'expires_at'
    ];

    protected array $casts = [
        'command_value' => 'json',
        'response_data' => 'json',
        'retry_count' => 'int',
        'max_retries' => 'int',
        'timeout_seconds' => 'int'
    ];

    public function createCommand(array $commandData): string
    {
        $commandId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $data = array_merge([
            'id' => $commandId,
            'status' => 'pending',
            'retry_count' => 0,
            'max_retries' => 3,
            'timeout_seconds' => 30,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ], $commandData);

        // Set expiration time if not provided
        if (!isset($data['expires_at']) && isset($data['timeout_seconds'])) {
            $data['expires_at'] = date('Y-m-d H:i:s', time() + $data['timeout_seconds']);
        }

        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        
        // Convert command_value to JSON if it's an array
        if (isset($data['command_value']) && is_array($data['command_value'])) {
            $data['command_value'] = json_encode($data['command_value']);
        }
        
        $stmt->execute($data);
        
        return $commandId;
    }

    public function updateCommandStatus(string $id, string $status, ?array $responseData = null, ?string $errorMessage = null): bool
    {
        $updateData = [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        switch ($status) {
            case 'sent':
                $updateData['sent_at'] = date('Y-m-d H:i:s');
                break;
            case 'acknowledged':
                $updateData['acknowledged_at'] = date('Y-m-d H:i:s');
                break;
            case 'completed':
                $updateData['completed_at'] = date('Y-m-d H:i:s');
                break;
        }

        if ($responseData) {
            $updateData['response_data'] = json_encode($responseData);
        }

        if ($errorMessage) {
            $updateData['error_message'] = $errorMessage;
        }

        return $this->update($id, $updateData);
    }

    public function incrementRetryCount(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([date('Y-m-d H:i:s'), $id]);
    }

    public function getPendingCommands(int $limit = 100): array
    {
        $sql = "SELECT * FROM valve_command_queue WHERE queue_status != 'expired' LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getCommandsByValve(string $valveId, int $limit = 50): array
    {
        $sql = "SELECT vc.*, u.name as initiated_by_name
                FROM {$this->table} vc
                LEFT JOIN users u ON vc.initiated_by = u.id
                WHERE vc.valve_id = ? 
                ORDER BY vc.created_at DESC 
                LIMIT ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$valveId, $limit]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getFailedCommands(int $hours = 24): array
    {
        $sql = "SELECT vc.*, v.valve_id as valve_identifier, u.name as initiated_by_name
                FROM {$this->table} vc
                JOIN valves v ON vc.valve_id = v.id
                LEFT JOIN users u ON vc.initiated_by = u.id
                WHERE vc.status IN ('failed', 'timeout') 
                AND vc.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                ORDER BY vc.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$hours]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getCommandStatistics(): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_commands,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_commands,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_commands,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_commands,
                    SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout_commands,
                    SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END) as emergency_commands,
                    AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, created_at, completed_at) ELSE NULL END) as avg_completion_time_seconds
                FROM {$this->table} 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        // Convert numeric strings to appropriate types
        foreach ($result as $key => $value) {
            if ($key === 'avg_completion_time_seconds' && $value !== null) {
                $result[$key] = (float) $value;
            } elseif (is_numeric($value)) {
                $result[$key] = (int) $value;
            }
        }
        
        return $result;
    }

    public function cleanupExpiredCommands(): int
    {
        $sql = "UPDATE {$this->table} 
                SET status = 'timeout', error_message = 'Command expired', updated_at = ?
                WHERE status IN ('pending', 'sent') 
                AND expires_at IS NOT NULL 
                AND expires_at < NOW()";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([date('Y-m-d H:i:s')]);
        
        return $stmt->rowCount();
    }

    public function cancelPendingCommands(string $valveId, string $reason = 'Cancelled by system'): int
    {
        $sql = "UPDATE {$this->table} 
                SET status = 'cancelled', error_message = ?, updated_at = ?
                WHERE valve_id = ? 
                AND status IN ('pending', 'sent')";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$reason, date('Y-m-d H:i:s'), $valveId]);
        
        return $stmt->rowCount();
    }

    public function getPendingCommandsByValve(string $valveId): array
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE valve_id = ? 
                AND status IN ('pending', 'sent') 
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY priority DESC, created_at ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$valveId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}