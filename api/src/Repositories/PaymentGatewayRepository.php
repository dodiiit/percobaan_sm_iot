<?php

namespace App\Repositories;

use App\Models\PaymentGateway;
use PDO;
use Exception;

/**
 * PaymentGatewayRepository
 * 
 * Handles database operations for payment gateway settings
 */
class PaymentGatewayRepository
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
     * Find a payment gateway by ID
     * 
     * @param string $id
     * @return PaymentGateway|null
     */
    public function findById(string $id): ?PaymentGateway
    {
        $stmt = $this->db->prepare("
            SELECT pgs.*, c.name as client_name
            FROM payment_gateway_settings pgs
            LEFT JOIN clients c ON pgs.client_id = c.id
            WHERE pgs.id = ?
        ");
        $stmt->execute([$id]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new PaymentGateway($data);
    }

    /**
     * Find a payment gateway by client ID and gateway type
     * 
     * @param string|null $clientId
     * @param string $gateway
     * @return PaymentGateway|null
     */
    public function findByClientAndGateway(?string $clientId, string $gateway): ?PaymentGateway
    {
        $sql = "
            SELECT pgs.*, c.name as client_name
            FROM payment_gateway_settings pgs
            LEFT JOIN clients c ON pgs.client_id = c.id
            WHERE pgs.gateway = ?
        ";
        
        $params = [$gateway];
        
        if ($clientId === null) {
            $sql .= " AND pgs.client_id IS NULL";
        } else {
            $sql .= " AND pgs.client_id = ?";
            $params[] = $clientId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            return null;
        }

        return new PaymentGateway($data);
    }

    /**
     * Get all payment gateways
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
            SELECT pgs.*, c.name as client_name
            FROM payment_gateway_settings pgs
            LEFT JOIN clients c ON pgs.client_id = c.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if (isset($filters['client_id'])) {
            if ($filters['client_id'] === 'system') {
                $sql .= " AND pgs.client_id IS NULL";
            } else {
                $sql .= " AND pgs.client_id = ?";
                $params[] = $filters['client_id'];
            }
        }
        
        if (isset($filters['gateway'])) {
            $sql .= " AND pgs.gateway = ?";
            $params[] = $filters['gateway'];
        }
        
        if (isset($filters['is_active'])) {
            $sql .= " AND pgs.is_active = ?";
            $params[] = (int)$filters['is_active'];
        }
        
        $sql .= " ORDER BY pgs.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $gateways = [];
        foreach ($rows as $row) {
            $gateways[] = new PaymentGateway($row);
        }
        
        return $gateways;
    }

    /**
     * Count all payment gateways
     * 
     * @param array $filters
     * @return int
     */
    public function count(array $filters = []): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM payment_gateway_settings pgs
            WHERE 1=1
        ";
        
        $params = [];
        
        if (isset($filters['client_id'])) {
            if ($filters['client_id'] === 'system') {
                $sql .= " AND pgs.client_id IS NULL";
            } else {
                $sql .= " AND pgs.client_id = ?";
                $params[] = $filters['client_id'];
            }
        }
        
        if (isset($filters['gateway'])) {
            $sql .= " AND pgs.gateway = ?";
            $params[] = $filters['gateway'];
        }
        
        if (isset($filters['is_active'])) {
            $sql .= " AND pgs.is_active = ?";
            $params[] = (int)$filters['is_active'];
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$result['total'];
    }

    /**
     * Create a new payment gateway
     * 
     * @param array $data
     * @return PaymentGateway
     * @throws Exception
     */
    public function create(array $data): PaymentGateway
    {
        // Generate UUID
        $id = $this->generateUuid();
        
        // Validate client exists if client_id is provided
        if (!empty($data['client_id'])) {
            $stmt = $this->db->prepare("SELECT id FROM clients WHERE id = ?");
            $stmt->execute([$data['client_id']]);
            if (!$stmt->fetch()) {
                throw new Exception("Client not found");
            }
        }
        
        // Check if gateway already exists for this client
        $existingGateway = $this->findByClientAndGateway(
            $data['client_id'] ?? null,
            $data['gateway']
        );
        
        if ($existingGateway) {
            throw new Exception("Payment gateway already exists for this client");
        }
        
        // Prepare credentials JSON
        $credentials = json_encode($data['credentials'] ?? []);
        
        $stmt = $this->db->prepare("
            INSERT INTO payment_gateway_settings (
                id, client_id, gateway, is_active, is_production, credentials, 
                created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, 
                NOW(), NOW()
            )
        ");
        
        $stmt->execute([
            $id,
            $data['client_id'] ?? null,
            $data['gateway'],
            (int)($data['is_active'] ?? false),
            (int)($data['is_production'] ?? false),
            $credentials
        ]);
        
        return $this->findById($id);
    }

    /**
     * Update a payment gateway
     * 
     * @param string $id
     * @param array $data
     * @return PaymentGateway
     * @throws Exception
     */
    public function update(string $id, array $data): PaymentGateway
    {
        // Check if gateway exists
        $gateway = $this->findById($id);
        if (!$gateway) {
            throw new Exception("Payment gateway not found");
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = (int)$data['is_active'];
        }
        
        if (isset($data['is_production'])) {
            $updates[] = "is_production = ?";
            $params[] = (int)$data['is_production'];
        }
        
        if (isset($data['credentials'])) {
            $updates[] = "credentials = ?";
            $params[] = json_encode($data['credentials']);
        }
        
        if (empty($updates)) {
            return $gateway; // Nothing to update
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE payment_gateway_settings SET " . implode(", ", $updates) . " WHERE id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $this->findById($id);
    }

    /**
     * Delete a payment gateway
     * 
     * @param string $id
     * @return bool
     */
    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM payment_gateway_settings WHERE id = ?");
        $stmt->execute([$id]);
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Get active payment gateway for a client
     * 
     * @param string $clientId
     * @param string $gateway
     * @return PaymentGateway|null
     */
    public function getActiveGateway(string $clientId, string $gateway): ?PaymentGateway
    {
        // First try to find client-specific gateway
        $clientGateway = $this->findByClientAndGateway($clientId, $gateway);
        
        if ($clientGateway && $clientGateway->isActive()) {
            return $clientGateway;
        }
        
        // If not found or not active, try system-wide gateway
        $systemGateway = $this->findByClientAndGateway(null, $gateway);
        
        if ($systemGateway && $systemGateway->isActive()) {
            return $systemGateway;
        }
        
        return null;
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