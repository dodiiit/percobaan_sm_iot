<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;
use Ramsey\Uuid\Uuid;

abstract class BaseModel
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';
    protected array $fillable = [];
    protected array $hidden = [];
    protected array $casts = [];

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function find(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $this->castAttributes($result) : null;
    }

    public function findAll(array $conditions = [], int $limit = 100, int $offset = 0): array
    {
        $whereClause = "deleted_at IS NULL";
        $params = [];

        if (!empty($conditions)) {
            foreach ($conditions as $key => $value) {
                $whereClause .= " AND {$key} = ?";
                $params[] = $value;
            }
        }

        $sql = "SELECT * FROM {$this->table} WHERE {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map([$this, 'castAttributes'], $results);
    }

    public function create(array $data): array
    {
        $data = $this->filterFillable($data);
        $data[$this->primaryKey] = Uuid::uuid4()->toString();
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');

        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $this->find($data[$this->primaryKey]);
    }

    public function update(string $id, array $data): ?array
    {
        $data = $this->filterFillable($data);
        $data['updated_at'] = date('Y-m-d H:i:s');

        $setClause = [];
        foreach (array_keys($data) as $key) {
            $setClause[] = "{$key} = :{$key}";
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . " WHERE {$this->primaryKey} = :id AND deleted_at IS NULL";
        $data['id'] = $id;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET deleted_at = ? WHERE {$this->primaryKey} = ? AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([date('Y-m-d H:i:s'), $id]);
    }

    public function count(array $conditions = []): int
    {
        $whereClause = "deleted_at IS NULL";
        $params = [];

        if (!empty($conditions)) {
            foreach ($conditions as $key => $value) {
                $whereClause .= " AND {$key} = ?";
                $params[] = $value;
            }
        }

        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    protected function filterFillable(array $data): array
    {
        if (empty($this->fillable)) {
            return $data;
        }

        return array_intersect_key($data, array_flip($this->fillable));
    }

    protected function castAttributes(array $attributes): array
    {
        foreach ($this->casts as $key => $type) {
            if (isset($attributes[$key])) {
                switch ($type) {
                    case 'int':
                    case 'integer':
                        $attributes[$key] = (int) $attributes[$key];
                        break;
                    case 'float':
                    case 'double':
                        $attributes[$key] = (float) $attributes[$key];
                        break;
                    case 'bool':
                    case 'boolean':
                        $attributes[$key] = (bool) $attributes[$key];
                        break;
                    case 'json':
                        $attributes[$key] = json_decode($attributes[$key], true);
                        break;
                }
            }
        }

        // Remove hidden attributes
        foreach ($this->hidden as $hidden) {
            unset($attributes[$hidden]);
        }

        return $attributes;
    }

    public function beginTransaction(): bool
    {
        return $this->db->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->db->commit();
    }

    public function rollback(): bool
    {
        return $this->db->rollBack();
    }
}