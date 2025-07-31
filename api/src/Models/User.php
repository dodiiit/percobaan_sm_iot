<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

class User extends BaseModel
{
    protected string $table = 'users';
    
    protected array $fillable = [
        'name', 'email', 'password', 'phone', 'role', 'status', 
        'email_verified_at', 'last_login_at', 'remember_token'
    ];
    
    protected array $hidden = [
        'password', 'remember_token'
    ];

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE email = ? AND deleted_at IS NULL");
        $stmt->execute([$email]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function updateLastLogin(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET last_login_at = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([date('Y-m-d H:i:s'), $id]);
    }

    public function verifyEmail(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET email_verified_at = ?, status = 'active' WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([date('Y-m-d H:i:s'), $id]);
    }

    public function updatePassword(string $id, string $hashedPassword): bool
    {
        $sql = "UPDATE {$this->table} SET password = ?, updated_at = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$hashedPassword, date('Y-m-d H:i:s'), $id]);
    }
}