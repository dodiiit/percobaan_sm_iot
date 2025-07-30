<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Setting extends BaseModel
{
    protected string $table = 'settings';
    protected array $fillable = [
        'id', 'client_id', 'key', 'value', 'type', 'group'
    ];
    protected bool $timestamps = true;
    protected bool $softDeletes = false;

    public function findByKey(string $key, ?string $clientId = null): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE `key` = :key";
        $params = [':key' => $key];
        
        if ($clientId) {
            $query .= " AND client_id = :client_id";
            $params[':client_id'] = $clientId;
        } else {
            $query .= " AND client_id IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function findByGroup(string $group, ?string $clientId = null): array
    {
        $query = "SELECT * FROM {$this->table} WHERE `group` = :group";
        $params = [':group' => $group];
        
        if ($clientId) {
            $query .= " AND client_id = :client_id";
            $params[':client_id'] = $clientId;
        } else {
            $query .= " AND client_id IS NULL";
        }
        
        $query .= " ORDER BY `key` ASC";
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue($param, $value);
        }
        
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getClientSettings(string $clientId): array
    {
        $query = "SELECT * FROM {$this->table} WHERE client_id = :client_id ORDER BY `group`, `key`";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getGlobalSettings(): array
    {
        $query = "SELECT * FROM {$this->table} WHERE client_id IS NULL ORDER BY `group`, `key`";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function updateSetting(string $key, $value, ?string $clientId = null): bool
    {
        $setting = $this->findByKey($key, $clientId);
        
        if (!$setting) {
            return false;
        }
        
        $query = "UPDATE {$this->table} SET value = :value, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }
        
        $stmt->bindParam(':value', $value);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $setting['id']);
        
        return $stmt->execute();
    }

    public function createSetting(string $key, $value, string $type = 'string', string $group = 'general', ?string $clientId = null): ?string
    {
        $data = [
            'key' => $key,
            'value' => is_array($value) || is_object($value) ? json_encode($value) : $value,
            'type' => $type,
            'group' => $group,
        ];
        
        if ($clientId) {
            $data['client_id'] = $clientId;
        }
        
        return $this->create($data);
    }

    public function getValue(string $key, ?string $clientId = null, $default = null)
    {
        $setting = $this->findByKey($key, $clientId);
        
        if (!$setting) {
            return $default;
        }
        
        $value = $setting['value'];
        
        switch ($setting['type']) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'integer':
                return (int) $value;
            case 'float':
                return (float) $value;
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }
}