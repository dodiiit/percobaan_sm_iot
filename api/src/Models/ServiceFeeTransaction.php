<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use Ramsey\Uuid\Uuid;

class ServiceFeeTransaction extends BaseModel
{
    protected string $table = 'service_fee_transactions';
    
    protected array $fillable = [
        'client_id', 'payment_id', 'plan_id', 'component_id',
        'transaction_amount', 'fee_amount', 'fee_type', 'fee_value',
        'status', 'invoice_id'
    ];

    protected array $casts = [
        'transaction_amount' => 'float',
        'fee_amount' => 'float',
        'fee_value' => 'float'
    ];

    public function findByPaymentId(string $paymentId): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE payment_id = ? AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$paymentId]);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function findByClientId(string $clientId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $whereClause = "client_id = ? AND deleted_at IS NULL";
        $params = [$clientId];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $whereClause .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['start_date'])) {
            $whereClause .= " AND created_at >= ?";
            $params[] = $filters['start_date'] . ' 00:00:00';
        }
        
        if (!empty($filters['end_date'])) {
            $whereClause .= " AND created_at <= ?";
            $params[] = $filters['end_date'] . ' 23:59:59';
        }
        
        if (!empty($filters['invoice_id'])) {
            $whereClause .= " AND invoice_id = ?";
            $params[] = $filters['invoice_id'];
        }
        
        $sql = "SELECT * FROM {$this->table} WHERE {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getClientStats(string $clientId, string $startDate, string $endDate): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_transactions,
                    SUM(transaction_amount) as total_transaction_amount,
                    SUM(fee_amount) as total_fee_amount,
                    status,
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date
                FROM {$this->table} 
                WHERE client_id = ? 
                AND created_at BETWEEN ? AND ?
                AND deleted_at IS NULL
                GROUP BY status, DATE_FORMAT(created_at, '%Y-%m-%d')
                ORDER BY date ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $clientId, 
            $startDate . ' 00:00:00', 
            $endDate . ' 23:59:59'
        ]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getClientTotals(string $clientId, string $startDate, string $endDate): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_transactions,
                    SUM(transaction_amount) as total_transaction_amount,
                    SUM(fee_amount) as total_fee_amount,
                    status
                FROM {$this->table} 
                WHERE client_id = ? 
                AND created_at BETWEEN ? AND ?
                AND deleted_at IS NULL
                GROUP BY status";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $clientId, 
            $startDate . ' 00:00:00', 
            $endDate . ' 23:59:59'
        ]);
        
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $totals = [
            'total_transactions' => 0,
            'total_transaction_amount' => 0,
            'total_fee_amount' => 0,
            'by_status' => []
        ];
        
        foreach ($results as $row) {
            $totals['total_transactions'] += (int)$row['total_transactions'];
            $totals['total_transaction_amount'] += (float)$row['total_transaction_amount'];
            $totals['total_fee_amount'] += (float)$row['total_fee_amount'];
            $totals['by_status'][$row['status']] = [
                'total_transactions' => (int)$row['total_transactions'],
                'total_transaction_amount' => (float)$row['total_transaction_amount'],
                'total_fee_amount' => (float)$row['total_fee_amount']
            ];
        }
        
        return $totals;
    }

    public function getPendingFeesForInvoice(string $clientId, string $startDate, string $endDate): array
    {
        $sql = "SELECT * FROM {$this->table} 
                WHERE client_id = ? 
                AND status = 'pending'
                AND created_at BETWEEN ? AND ?
                AND deleted_at IS NULL
                ORDER BY created_at ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $clientId, 
            $startDate . ' 00:00:00', 
            $endDate . ' 23:59:59'
        ]);
        
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        return array_map([$this, 'castAttributes'], $results);
    }

    public function updateStatusByInvoice(string $invoiceId, string $status): bool
    {
        $sql = "UPDATE {$this->table} SET status = ? WHERE invoice_id = ? AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, $invoiceId]);
    }
}