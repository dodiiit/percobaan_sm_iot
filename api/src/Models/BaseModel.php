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
    protected bool $timestamps = true;
    protected bool $softDeletes = true;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getAll(array $conditions = [], array $orderBy = [], int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT * FROM {$this->table}";
        
        if ($this->softDeletes) {
            $conditions['deleted_at'] = null;
        }
        
        $params = [];
        if (!empty($conditions)) {
            $query .= " WHERE ";
            $whereClauses = [];
            
            foreach ($conditions as $column => $value) {
                if ($value === null) {
                    $whereClauses[] = "`$column` IS NULL";
                } else {
                    $whereClauses[] = "`$column` = :$column";
                    $params[$column] = $value;
                }
            }
            
            $query .= implode(" AND ", $whereClauses);
        }
        
        if (!empty($orderBy)) {
            $query .= " ORDER BY ";
            $orderClauses = [];
            
            foreach ($orderBy as $column => $direction) {
                $orderClauses[] = "`$column` $direction";
            }
            
            $query .= implode(", ", $orderClauses);
        }
        
        if ($limit > 0) {
            $query .= " LIMIT :limit";
            $params['limit'] = $limit;
            
            if ($offset > 0) {
                $query .= " OFFSET :offset";
                $params['offset'] = $offset;
            }
        }
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $param => $value) {
            if ($param === 'limit' || $param === 'offset') {
                $stmt->bindValue(":$param", $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(":$param", $value);
            }
        }
        
        $stmt->execute();
        
        return $this->processResults($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findById(string $id): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function create(array $data): ?string
    {
        $id = Uuid::uuid4()->toString();
        $data[$this->primaryKey] = $id;
        
        $filteredData = $this->filterData($data);
        
        if ($this->timestamps) {
            $now = date('Y-m-d H:i:s');
            $filteredData['created_at'] = $now;
            $filteredData['updated_at'] = $now;
        }
        
        $columns = array_keys($filteredData);
        $placeholders = array_map(function ($column) {
            return ":$column";
        }, $columns);
        
        $query = "INSERT INTO {$this->table} (`" . implode("`, `", $columns) . "`) VALUES (" . implode(", ", $placeholders) . ")";
        
        $stmt = $this->db->prepare($query);
        
        foreach ($filteredData as $column => $value) {
            $stmt->bindValue(":$column", $value);
        }
        
        $result = $stmt->execute();
        
        return $result ? $id : null;
    }

    public function update(string $id, array $data): bool
    {
        $filteredData = $this->filterData($data);
        
        if ($this->timestamps) {
            $filteredData['updated_at'] = date('Y-m-d H:i:s');
        }
        
        $setClauses = array_map(function ($column) {
            return "`$column` = :$column";
        }, array_keys($filteredData));
        
        $query = "UPDATE {$this->table} SET " . implode(", ", $setClauses) . " WHERE {$this->primaryKey} = :id";
        
        if ($this->softDeletes) {
            $query .= " AND deleted_at IS NULL";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        foreach ($filteredData as $column => $value) {
            $stmt->bindValue(":$column", $value);
        }
        
        return $stmt->execute();
    }

    public function delete(string $id): bool
    {
        if ($this->softDeletes) {
            $query = "UPDATE {$this->table} SET deleted_at = :deleted_at WHERE {$this->primaryKey} = :id AND deleted_at IS NULL";
            $stmt = $this->db->prepare($query);
            $deletedAt = date('Y-m-d H:i:s');
            $stmt->bindParam(':deleted_at', $deletedAt);
            $stmt->bindParam(':id', $id);
        } else {
            $query = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
        }
        
        return $stmt->execute();
    }

    public function count(array $conditions = []): int
    {
        $query = "SELECT COUNT(*) FROM {$this->table}";
        
        if ($this->softDeletes) {
            $conditions['deleted_at'] = null;
        }
        
        $params = [];
        if (!empty($conditions)) {
            $query .= " WHERE ";
            $whereClauses = [];
            
            foreach ($conditions as $column => $value) {
                if ($value === null) {
                    $whereClauses[] = "`$column` IS NULL";
                } else {
                    $whereClauses[] = "`$column` = :$column";
                    $params[$column] = $value;
                }
            }
            
            $query .= implode(" AND ", $whereClauses);
        }
        
        $stmt = $this->db->prepare($query);
        
        foreach ($params as $param => $value) {
            $stmt->bindValue(":$param", $value);
        }
        
        $stmt->execute();
        
        return (int) $stmt->fetchColumn();
    }

    protected function filterData(array $data): array
    {
        if (empty($this->fillable)) {
            return $data;
        }
        
        return array_intersect_key($data, array_flip($this->fillable));
    }

    protected function processResults(array $results): array
    {
        return array_map(function ($result) {
            return $this->processResult($result);
        }, $results);
    }

    protected function processResult(array $result): array
    {
        if (!empty($this->hidden)) {
            foreach ($this->hidden as $hidden) {
                unset($result[$hidden]);
            }
        }
        
        return $result;
    }
}