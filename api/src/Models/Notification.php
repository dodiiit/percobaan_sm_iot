<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Notification extends BaseModel
{
    protected string $table = 'notifications';
    protected array $fillable = [
        'id', 'user_id', 'title', 'message', 'type', 'data', 'read_at', 'status'
    ];

    public function findByUserId(string $userId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['user_id' => $userId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findUnreadByUserId(string $userId, int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id AND read_at IS NULL";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        if ($limit > 0) {
            $query .= " LIMIT :limit";
            
            if ($offset > 0) {
                $query .= " OFFSET :offset";
            }
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        
        if ($limit > 0) {
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            
            if ($offset > 0) {
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            }
        }
        
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function markAsRead(string $id): bool
    {
        $query = "UPDATE {$this->table} SET read_at = :read_at, updated_at = :updated_at WHERE id = :id AND read_at IS NULL";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':read_at', $now);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function markAllAsRead(string $userId): bool
    {
        $query = "UPDATE {$this->table} SET read_at = :read_at, updated_at = :updated_at WHERE user_id = :user_id AND read_at IS NULL";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':read_at', $now);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':user_id', $userId);
        
        return $stmt->execute();
    }

    public function countUnread(string $userId): int
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE user_id = :user_id AND read_at IS NULL";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        return (int) $stmt->fetchColumn();
    }
}