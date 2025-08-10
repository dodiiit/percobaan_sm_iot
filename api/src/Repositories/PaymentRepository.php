<?php

namespace IndoWater\Api\Repositories;

use IndoWater\Api\Models\Payment;
use PDO;
use Exception;

/**
 * PaymentRepository
 * 
 * Handles database operations for payments
 */
class PaymentRepository
{
    /**
     * @var PDO
     */
    private $db;

    /**
     * Constructor
     * 
     * @param PDO $db
     */
    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Find a payment by ID
     * 
     * @param string $id
     * @return Payment|null
     */
    public function findById(string $id): ?Payment
    {
        $stmt = $this->db->prepare("
            SELECT p.*, 
                   CONCAT(c.first_name, ' ', c.last_name) as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new Payment($data);
    }

    /**
     * Find a payment by transaction ID
     * 
     * @param string $transactionId
     * @return Payment|null
     */
    public function findByTransactionId(string $transactionId): ?Payment
    {
        $stmt = $this->db->prepare("
            SELECT p.*, 
                   CONCAT(c.first_name, ' ', c.last_name) as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.transaction_id = ?
        ");
        $stmt->execute([$transactionId]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new Payment($data);
    }

    /**
     * Get all payments
     * 
     * @param array $filters
     * @param int $page
     * @param int $limit
     * @return array
     */
    public function findAll(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $offset = ($page - 1) * $limit;
        
        $sql = "
            SELECT p.*, 
                   CONCAT(c.first_name, ' ', c.last_name) as customer_name,
                   c.email as customer_email,
                   c.phone as customer_phone
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if (isset($filters['customer_id'])) {
            $sql .= " AND p.customer_id = ?";
            $params[] = $filters['customer_id'];
        }
        
        if (isset($filters['payment_gateway'])) {
            $sql .= " AND p.payment_gateway = ?";
            $params[] = $filters['payment_gateway'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND p.status = ?";
            $params[] = $filters['status'];
        }
        
        if (isset($filters['date_from'])) {
            $sql .= " AND p.created_at >= ?";
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        
        if (isset($filters['date_to'])) {
            $sql .= " AND p.created_at <= ?";
            $params[] = $filters['date_to'] . ' 23:59:59';
        }
        
        if (isset($filters['client_id'])) {
            $sql .= " AND c.client_id = ?";
            $params[] = $filters['client_id'];
        }
        
        $sql .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $payments = [];
        foreach ($rows as $row) {
            $payments[] = new Payment($row);
        }
        
        return $payments;
    }

    /**
     * Count all payments
     * 
     * @param array $filters
     * @return int
     */
    public function count(array $filters = []): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if (isset($filters['customer_id'])) {
            $sql .= " AND p.customer_id = ?";
            $params[] = $filters['customer_id'];
        }
        
        if (isset($filters['payment_gateway'])) {
            $sql .= " AND p.payment_gateway = ?";
            $params[] = $filters['payment_gateway'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND p.status = ?";
            $params[] = $filters['status'];
        }
        
        if (isset($filters['date_from'])) {
            $sql .= " AND p.created_at >= ?";
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        
        if (isset($filters['date_to'])) {
            $sql .= " AND p.created_at <= ?";
            $params[] = $filters['date_to'] . ' 23:59:59';
        }
        
        if (isset($filters['client_id'])) {
            $sql .= " AND c.client_id = ?";
            $params[] = $filters['client_id'];
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$result['total'];
    }

    /**
     * Create a new payment
     * 
     * @param array $data
     * @return Payment
     * @throws Exception
     */
    public function create(array $data): Payment
    {
        // Generate UUID
        $id = $this->generateUuid();
        
        // Validate customer exists
        $stmt = $this->db->prepare("SELECT id FROM customers WHERE id = ?");
        $stmt->execute([$data['customer_id']]);
        if (!$stmt->fetch()) {
            throw new Exception("Customer not found");
        }
        
        // Prepare payment details JSON
        $paymentDetails = isset($data['payment_details']) ? json_encode($data['payment_details']) : null;
        
        $stmt = $this->db->prepare("
            INSERT INTO payments (
                id, customer_id, credit_id, amount, payment_method, payment_gateway,
                transaction_id, transaction_time, status, payment_details, 
                created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $id,
            $data['customer_id'],
            $data['credit_id'] ?? null,
            $data['amount'],
            $data['payment_method'],
            $data['payment_gateway'],
            $data['transaction_id'] ?? null,
            $data['transaction_time'] ?? null,
            $data['status'] ?? 'pending',
            $paymentDetails
        ]);
        
        return $this->findById($id);
    }

    /**
     * Update a payment
     * 
     * @param string $id
     * @param array $data
     * @return Payment
     * @throws Exception
     */
    public function update(string $id, array $data): Payment
    {
        // Check if payment exists
        $payment = $this->findById($id);
        if (!$payment) {
            throw new Exception("Payment not found");
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($data['transaction_id'])) {
            $updates[] = "transaction_id = ?";
            $params[] = $data['transaction_id'];
        }
        
        if (isset($data['transaction_time'])) {
            $updates[] = "transaction_time = ?";
            $params[] = $data['transaction_time'];
        }
        
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (isset($data['payment_details'])) {
            $updates[] = "payment_details = ?";
            $params[] = json_encode($data['payment_details']);
        }
        
        if (empty($updates)) {
            return $payment; // Nothing to update
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE payments SET " . implode(", ", $updates) . " WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $this->findById($id);
    }

    /**
     * Generate a UUID v4
     * 
     * @return string
     */
    private function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}