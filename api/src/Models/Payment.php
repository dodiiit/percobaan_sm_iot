<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use PDO;

class Payment extends BaseModel
{
    protected string $table = 'payments';
    protected array $fillable = [
        'id', 'customer_id', 'meter_id', 'client_id', 'amount', 'service_fee',
        'total_amount', 'payment_method', 'payment_gateway', 'transaction_id',
        'transaction_status', 'payment_date', 'status', 'notes'
    ];

    public function findByCustomerId(string $customerId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['customer_id' => $customerId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByMeterId(string $meterId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['meter_id' => $meterId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function findByClientId(string $clientId, int $limit = 0, int $offset = 0): array
    {
        return $this->getAll(['client_id' => $clientId], ['created_at' => 'DESC'], $limit, $offset);
    }

    public function updateStatus(string $id, string $status): bool
    {
        $query = "UPDATE {$this->table} SET status = :status, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':updated_at', $now);
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function updateTransactionStatus(string $id, string $status, ?string $transactionId = null): bool
    {
        $query = "UPDATE {$this->table} SET transaction_status = :transaction_status, updated_at = :updated_at";
        
        if ($transactionId) {
            $query .= ", transaction_id = :transaction_id";
        }
        
        $query .= " WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $now = date('Y-m-d H:i:s');
        $stmt->bindParam(':transaction_status', $status);
        $stmt->bindParam(':updated_at', $now);
        
        if ($transactionId) {
            $stmt->bindParam(':transaction_id', $transactionId);
        }
        
        $stmt->bindParam(':id', $id);
        
        return $stmt->execute();
    }

    public function getWithDetails(string $id): ?array
    {
        $query = "SELECT p.*, c.customer_number, u.name as customer_name, u.email as customer_email,
                 m.meter_number, cl.company_name as client_name
                 FROM {$this->table} p
                 JOIN customers c ON p.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN meters m ON p.meter_id = m.id
                 JOIN clients cl ON p.client_id = cl.id
                 WHERE p.id = :id AND p.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND m.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return $this->processResult($result);
    }

    public function getAllWithDetails(array $conditions = [], int $limit = 0, int $offset = 0): array
    {
        $query = "SELECT p.*, c.customer_number, u.name as customer_name,
                 m.meter_number, cl.company_name as client_name
                 FROM {$this->table} p
                 JOIN customers c ON p.customer_id = c.id
                 JOIN users u ON c.user_id = u.id
                 JOIN meters m ON p.meter_id = m.id
                 JOIN clients cl ON p.client_id = cl.id
                 WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL
                 AND u.deleted_at IS NULL AND m.deleted_at IS NULL AND cl.deleted_at IS NULL";
        
        $params = [];
        
        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                if (strpos($column, '.') === false) {
                    $column = "p.$column";
                }
                
                if ($value === null) {
                    $query .= " AND $column IS NULL";
                } else {
                    $paramName = str_replace('.', '_', $column);
                    $query .= " AND $column = :$paramName";
                    $params[$paramName] = $value;
                }
            }
        }
        
        $query .= " ORDER BY p.created_at DESC";
        
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

    public function getSummaryByClient(string $clientId, string $period = 'month'): array
    {
        $timeFormat = '';
        
        switch ($period) {
            case 'day':
                $timeFormat = '%Y-%m-%d';
                break;
            case 'week':
                $timeFormat = '%Y-%u';
                break;
            case 'month':
                $timeFormat = '%Y-%m';
                break;
            case 'year':
                $timeFormat = '%Y';
                break;
            default:
                $timeFormat = '%Y-%m';
        }
        
        $query = "SELECT 
                 DATE_FORMAT(payment_date, '$timeFormat') as period,
                 COUNT(*) as total_payments,
                 SUM(amount) as total_amount,
                 SUM(service_fee) as total_service_fee,
                 SUM(total_amount) as total_paid
                 FROM {$this->table}
                 WHERE client_id = :client_id AND deleted_at IS NULL
                 GROUP BY period
                 ORDER BY period DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function generateInvoiceNumber(string $clientId): string
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE client_id = :client_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':client_id', $clientId);
        $stmt->execute();
        
        $count = (int) $stmt->fetchColumn() + 1;
        
        // Get client prefix (first 3 letters of company name)
        $clientQuery = "SELECT SUBSTRING(company_name, 1, 3) as prefix FROM clients WHERE id = :client_id";
        $clientStmt = $this->db->prepare($clientQuery);
        $clientStmt->bindParam(':client_id', $clientId);
        $clientStmt->execute();
        
        $prefix = strtoupper($clientStmt->fetchColumn() ?: 'INV');
        
        // Format: PREFIX-YYYYMM-XXXX (e.g., ABC-202507-0001)
        return $prefix . '-' . date('Ym') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}