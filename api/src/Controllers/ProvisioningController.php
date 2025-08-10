<?php

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Exception;

/**
 * Provisioning Controller
 * Handles provisioning token management for device registration
 */
class ProvisioningController
{
    protected $container;
    protected $db;
    protected $logger;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->db = $container->get('db');
        $this->logger = $container->get('logger');
    }

    /**
     * Generate provisioning token
     * POST /provisioning/generate
     * 
     * Expected payload:
     * {
     *   "client_id": 1,
     *   "property_id": 123,
     *   "expires_hours": 24,
     *   "description": "Token for new meter installation"
     * }
     */
    public function generateToken(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['client_id'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required field: client_id'
                ], 400);
            }

            $clientId = (int)$data['client_id'];
            $propertyId = isset($data['property_id']) ? (int)$data['property_id'] : null;
            $expiresHours = (int)($data['expires_hours'] ?? 24);
            $description = $data['description'] ?? 'Device provisioning token';

            // Verify client exists and is active
            $stmt = $this->db->prepare("SELECT id, name, status FROM clients WHERE id = ?");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();

            if (!$client) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Client not found'
                ], 404);
            }

            if ($client['status'] !== 'active') {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Client is not active'
                ], 403);
            }

            // Verify property if provided
            if ($propertyId) {
                $stmt = $this->db->prepare("
                    SELECT id FROM properties 
                    WHERE id = ? AND client_id = ? AND status = 'active'
                ");
                $stmt->execute([$propertyId, $clientId]);
                $property = $stmt->fetch();

                if (!$property) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => 'Property not found or not owned by client'
                    ], 404);
                }
            }

            // Generate unique token
            $token = $this->generateUniqueToken();
            $expiresAt = date('Y-m-d H:i:s', time() + ($expiresHours * 3600));

            // Insert provisioning token
            $stmt = $this->db->prepare("
                INSERT INTO provisioning_tokens (
                    token, client_id, property_id, description, expires_at,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())
            ");
            $stmt->execute([$token, $clientId, $propertyId, $description, $expiresAt]);

            $this->logger->info("Provisioning token generated", [
                'token' => substr($token, 0, 8) . '...',
                'client_id' => $clientId,
                'property_id' => $propertyId,
                'expires_at' => $expiresAt
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Provisioning token generated successfully',
                'data' => [
                    'token' => $token,
                    'client_name' => $client['name'],
                    'expires_at' => $expiresAt,
                    'expires_hours' => $expiresHours,
                    'description' => $description
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error("Generate provisioning token failed", [
                'error' => $e->getMessage(),
                'data' => $data ?? []
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * List provisioning tokens
     * GET /provisioning/tokens?client_id=1&status=active
     */
    public function listTokens(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $clientId = isset($params['client_id']) ? (int)$params['client_id'] : null;
            $status = $params['status'] ?? null;
            $page = max(1, (int)($params['page'] ?? 1));
            $limit = min(100, max(10, (int)($params['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;

            // Build query
            $whereConditions = [];
            $queryParams = [];

            if ($clientId) {
                $whereConditions[] = "pt.client_id = ?";
                $queryParams[] = $clientId;
            }

            if ($status) {
                $whereConditions[] = "pt.status = ?";
                $queryParams[] = $status;
            }

            $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

            // Get total count
            $countQuery = "
                SELECT COUNT(*) as total
                FROM provisioning_tokens pt
                $whereClause
            ";
            $stmt = $this->db->prepare($countQuery);
            $stmt->execute($queryParams);
            $totalCount = $stmt->fetch()['total'];

            // Get tokens
            $query = "
                SELECT 
                    pt.id, pt.token, pt.client_id, pt.property_id, pt.description,
                    pt.status, pt.expires_at, pt.used_at, pt.used_by_device,
                    pt.created_at, pt.updated_at,
                    c.name as client_name,
                    p.name as property_name
                FROM provisioning_tokens pt
                JOIN clients c ON pt.client_id = c.id
                LEFT JOIN properties p ON pt.property_id = p.id
                $whereClause
                ORDER BY pt.created_at DESC
                LIMIT ? OFFSET ?
            ";
            
            $queryParams[] = $limit;
            $queryParams[] = $offset;
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($queryParams);
            $tokens = $stmt->fetchAll();

            // Format tokens for response
            $formattedTokens = [];
            foreach ($tokens as $token) {
                $formattedTokens[] = [
                    'id' => (int)$token['id'],
                    'token' => $token['token'],
                    'client_id' => (int)$token['client_id'],
                    'client_name' => $token['client_name'],
                    'property_id' => $token['property_id'] ? (int)$token['property_id'] : null,
                    'property_name' => $token['property_name'],
                    'description' => $token['description'],
                    'status' => $token['status'],
                    'expires_at' => $token['expires_at'],
                    'used_at' => $token['used_at'],
                    'used_by_device' => $token['used_by_device'],
                    'created_at' => $token['created_at'],
                    'is_expired' => strtotime($token['expires_at']) < time()
                ];
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $formattedTokens,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$totalCount,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error("List provisioning tokens failed", [
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Revoke provisioning token
     * POST /provisioning/revoke
     * 
     * Expected payload:
     * {
     *   "token": "TOKEN_STRING"
     * }
     */
    public function revokeToken(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['token'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required field: token'
                ], 400);
            }

            $token = $data['token'];

            // Find and revoke token
            $stmt = $this->db->prepare("
                UPDATE provisioning_tokens 
                SET status = 'revoked', updated_at = NOW()
                WHERE token = ? AND status IN ('active', 'used')
            ");
            $stmt->execute([$token]);

            if ($stmt->rowCount() === 0) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token not found or already revoked'
                ], 404);
            }

            $this->logger->info("Provisioning token revoked", [
                'token' => substr($token, 0, 8) . '...'
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Token revoked successfully'
            ]);

        } catch (Exception $e) {
            $this->logger->error("Revoke provisioning token failed", [
                'error' => $e->getMessage(),
                'data' => $data ?? []
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get token details
     * GET /provisioning/token/{token}
     */
    public function getTokenDetails(Request $request, Response $response, array $args): Response
    {
        try {
            $token = $args['token'] ?? null;

            if (!$token) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token parameter required'
                ], 400);
            }

            // Get token details
            $stmt = $this->db->prepare("
                SELECT 
                    pt.id, pt.token, pt.client_id, pt.property_id, pt.description,
                    pt.status, pt.expires_at, pt.used_at, pt.used_by_device,
                    pt.created_at, pt.updated_at,
                    c.name as client_name, c.status as client_status,
                    p.name as property_name, p.address as property_address
                FROM provisioning_tokens pt
                JOIN clients c ON pt.client_id = c.id
                LEFT JOIN properties p ON pt.property_id = p.id
                WHERE pt.token = ?
            ");
            $stmt->execute([$token]);
            $tokenData = $stmt->fetch();

            if (!$tokenData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token not found'
                ], 404);
            }

            $isExpired = strtotime($tokenData['expires_at']) < time();
            $isValid = $tokenData['status'] === 'active' && !$isExpired && $tokenData['client_status'] === 'active';

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'id' => (int)$tokenData['id'],
                    'token' => $tokenData['token'],
                    'client_id' => (int)$tokenData['client_id'],
                    'client_name' => $tokenData['client_name'],
                    'client_status' => $tokenData['client_status'],
                    'property_id' => $tokenData['property_id'] ? (int)$tokenData['property_id'] : null,
                    'property_name' => $tokenData['property_name'],
                    'property_address' => $tokenData['property_address'],
                    'description' => $tokenData['description'],
                    'status' => $tokenData['status'],
                    'expires_at' => $tokenData['expires_at'],
                    'used_at' => $tokenData['used_at'],
                    'used_by_device' => $tokenData['used_by_device'],
                    'created_at' => $tokenData['created_at'],
                    'is_expired' => $isExpired,
                    'is_valid' => $isValid
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error("Get token details failed", [
                'error' => $e->getMessage(),
                'token' => substr($token ?? '', 0, 8) . '...'
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Generate unique provisioning token
     */
    private function generateUniqueToken(): string
    {
        do {
            // Generate a 32-character token
            $token = bin2hex(random_bytes(16));
            
            // Check if token already exists
            $stmt = $this->db->prepare("SELECT id FROM provisioning_tokens WHERE token = ?");
            $stmt->execute([$token]);
            $exists = $stmt->fetch();
        } while ($exists);

        return strtoupper($token);
    }

    /**
     * Helper method to return JSON response
     */
    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}