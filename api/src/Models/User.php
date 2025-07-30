<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class User extends BaseModel
{
    protected string $table = 'users';
    protected array $fillable = [
        'id', 'name', 'email', 'password', 'phone', 'role', 'status',
        'email_verified_at', 'last_login_at', 'remember_token'
    ];
    protected array $hidden = ['password', 'remember_token'];

    public function findByEmail(string $email): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE email = :email";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function updateLastLogin(string $id): bool
    {
        $query = "UPDATE {$this->table} SET last_login_at = :last_login_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':last_login_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function verifyEmail(string $id): bool
    {
        $query = "UPDATE {$this->table} SET email_verified_at = :email_verified_at, status = 'active' WHERE id = :id AND email_verified_at IS NULL";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':email_verified_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updatePassword(string $id, string $password): bool
    {
        $query = "UPDATE {$this->table} SET password = :password, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':password', $password);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updateRememberToken(string $id, ?string $token): bool
    {
        $query = "UPDATE {$this->table} SET remember_token = :remember_token WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':remember_token', $token);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function findByRole(string $role, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['role' => $role], ['created_at' => 'DESC'], $limit, $offset);
    }
}