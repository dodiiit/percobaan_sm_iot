<?php

declare(strict_types=1);

namespace IndoWater\Api\Models;

use Ramsey\Uuid\Uuid;

class ServiceFeeInvoice extends BaseModel
{
    protected string $table = 'service_fee_invoices';
    
    protected array $fillable = [
        'client_id', 'invoice_number', 'total_amount', 'status',
        'issue_date', 'due_date', 'paid_date', 
        'billing_period_start', 'billing_period_end', 'notes'
    ];

    protected array $casts = [
        'total_amount' => 'float'
    ];

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
            $whereClause .= " AND billing_period_start >= ?";
            $params[] = $filters['start_date'];
        }
        
        if (!empty($filters['end_date'])) {
            $whereClause .= " AND billing_period_end <= ?";
            $params[] = $filters['end_date'];
        }
        
        $sql = "SELECT * FROM {$this->table} WHERE {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return array_map([$this, 'castAttributes'], $results);
    }

    public function getWithTransactions(string $invoiceId): ?array
    {
        $invoice = $this->find($invoiceId);
        if (!$invoice) {
            return null;
        }
        
        $sql = "SELECT * FROM service_fee_transactions 
                WHERE invoice_id = ? AND deleted_at IS NULL 
                ORDER BY created_at ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$invoiceId]);
        $transactions = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $invoice['transactions'] = array_map(function($transaction) {
            return $this->castAttributes($transaction, [
                'transaction_amount' => 'float',
                'fee_amount' => 'float',
                'fee_value' => 'float'
            ]);
        }, $transactions);
        
        return $invoice;
    }

    public function generateInvoiceNumber(string $clientId): string
    {
        $year = date('Y');
        $month = date('m');
        
        // Get client prefix (first 3 letters of company name)
        $sql = "SELECT UPPER(LEFT(company_name, 3)) as prefix FROM clients WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId]);
        $prefix = $stmt->fetchColumn() ?: 'INV';
        
        // Count existing invoices for this client in the current month
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE client_id = ? 
                AND YEAR(created_at) = ? 
                AND MONTH(created_at) = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$clientId, $year, $month]);
        $count = $stmt->fetchColumn() + 1;
        
        // Format: PREFIX-YYYYMM-XXXX (e.g., ABC-202507-0001)
        return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $count);
    }

    public function createFromPendingFees(string $clientId, string $startDate, string $endDate, array $options = []): ?array
    {
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Get pending fees
            $serviceFeeTransactionModel = new ServiceFeeTransaction($this->db);
            $pendingFees = $serviceFeeTransactionModel->getPendingFeesForInvoice($clientId, $startDate, $endDate);
            
            if (empty($pendingFees)) {
                $this->db->rollBack();
                return null;
            }
            
            // Calculate total amount
            $totalAmount = array_reduce($pendingFees, function($carry, $fee) {
                return $carry + $fee['fee_amount'];
            }, 0);
            
            // Create invoice
            $invoiceId = Uuid::uuid4()->toString();
            $invoiceNumber = $this->generateInvoiceNumber($clientId);
            $dueDate = !empty($options['due_date']) ? $options['due_date'] : date('Y-m-d', strtotime('+30 days'));
            
            $invoice = [
                'id' => $invoiceId,
                'client_id' => $clientId,
                'invoice_number' => $invoiceNumber,
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'issue_date' => !empty($options['issue_date']) ? $options['issue_date'] : null,
                'due_date' => $dueDate,
                'paid_date' => null,
                'billing_period_start' => $startDate,
                'billing_period_end' => $endDate,
                'notes' => $options['notes'] ?? null
            ];
            
            $sql = "INSERT INTO {$this->table} 
                    (id, client_id, invoice_number, total_amount, status, issue_date, due_date, 
                    billing_period_start, billing_period_end, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $invoice['id'],
                $invoice['client_id'],
                $invoice['invoice_number'],
                $invoice['total_amount'],
                $invoice['status'],
                $invoice['issue_date'],
                $invoice['due_date'],
                $invoice['billing_period_start'],
                $invoice['billing_period_end'],
                $invoice['notes']
            ]);
            
            // Update fee transactions with invoice ID
            foreach ($pendingFees as $fee) {
                $sql = "UPDATE service_fee_transactions 
                        SET invoice_id = ?, status = 'invoiced' 
                        WHERE id = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$invoiceId, $fee['id']]);
            }
            
            $this->db->commit();
            
            $invoice['transactions'] = $pendingFees;
            return $invoice;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function issueInvoice(string $invoiceId): bool
    {
        $this->db->beginTransaction();
        
        try {
            // Update invoice status
            $sql = "UPDATE {$this->table} 
                    SET status = 'issued', issue_date = CURDATE() 
                    WHERE id = ? AND status = 'draft'";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$invoiceId]);
            
            if ($stmt->rowCount() === 0) {
                $this->db->rollBack();
                return false;
            }
            
            $this->db->commit();
            return true;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function markAsPaid(string $invoiceId, ?string $paidDate = null): bool
    {
        $this->db->beginTransaction();
        
        try {
            // Update invoice status
            $paidDate = $paidDate ?? date('Y-m-d');
            $sql = "UPDATE {$this->table} 
                    SET status = 'paid', paid_date = ? 
                    WHERE id = ? AND (status = 'issued' OR status = 'draft')";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$paidDate, $invoiceId]);
            
            if ($stmt->rowCount() === 0) {
                $this->db->rollBack();
                return false;
            }
            
            // Update fee transactions
            $serviceFeeTransactionModel = new ServiceFeeTransaction($this->db);
            $serviceFeeTransactionModel->updateStatusByInvoice($invoiceId, 'paid');
            
            $this->db->commit();
            return true;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function cancelInvoice(string $invoiceId): bool
    {
        $this->db->beginTransaction();
        
        try {
            // Update invoice status
            $sql = "UPDATE {$this->table} 
                    SET status = 'cancelled' 
                    WHERE id = ? AND status != 'paid'";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$invoiceId]);
            
            if ($stmt->rowCount() === 0) {
                $this->db->rollBack();
                return false;
            }
            
            // Update fee transactions back to pending
            $serviceFeeTransactionModel = new ServiceFeeTransaction($this->db);
            $serviceFeeTransactionModel->updateStatusByInvoice($invoiceId, 'pending');
            
            $this->db->commit();
            return true;
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}