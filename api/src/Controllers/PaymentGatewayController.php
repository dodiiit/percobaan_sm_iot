<?php

namespace App\Controllers;

use App\Repositories\PaymentGatewayRepository;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use App\Services\AuthService;
use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use PDO;

/**
 * PaymentGatewayController
 * 
 * Controller for managing payment gateway settings
 */
class PaymentGatewayController
{
    /**
     * @var PDO
     */
    private $db;
    
    /**
     * @var LoggerInterface
     */
    private $logger;
    
    /**
     * @var PaymentGatewayRepository
     */
    private $gatewayRepository;
    
    /**
     * @var PaymentGatewayFactory
     */
    private $gatewayFactory;
    
    /**
     * @var AuthService
     */
    private $authService;
    
    /**
     * Constructor
     * 
     * @param PDO $db
     * @param LoggerInterface $logger
     * @param PaymentGatewayRepository $gatewayRepository
     * @param PaymentGatewayFactory $gatewayFactory
     * @param AuthService $authService
     */
    public function __construct(
        PDO $db,
        LoggerInterface $logger,
        PaymentGatewayRepository $gatewayRepository,
        PaymentGatewayFactory $gatewayFactory,
        AuthService $authService
    ) {
        $this->db = $db;
        $this->logger = $logger;
        $this->gatewayRepository = $gatewayRepository;
        $this->gatewayFactory = $gatewayFactory;
        $this->authService = $authService;
    }
    
    /**
     * Get all payment gateways
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAll(Request $request, Response $response, array $args): Response
    {
        try {
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            $filters = [];
            $page = (int)($request->getQueryParams()['page'] ?? 1);
            $limit = (int)($request->getQueryParams()['limit'] ?? 20);
            
            // Apply filters based on role
            if ($role === 'superadmin') {
                // Superadmin can see all gateways
                if (isset($request->getQueryParams()['client_id'])) {
                    $filters['client_id'] = $request->getQueryParams()['client_id'];
                }
            } elseif ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only see their own gateways and system gateways
                $filters['client_id'] = $client['id'];
            } else {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Apply additional filters
            if (isset($request->getQueryParams()['gateway'])) {
                $filters['gateway'] = $request->getQueryParams()['gateway'];
            }
            
            if (isset($request->getQueryParams()['is_active'])) {
                $filters['is_active'] = (bool)$request->getQueryParams()['is_active'];
            }
            
            // Get gateways
            $gateways = $this->gatewayRepository->findAll($filters, $page, $limit);
            $total = $this->gatewayRepository->count($filters);
            
            // Format response
            $result = [];
            foreach ($gateways as $gateway) {
                $result[] = $gateway->toArray(false); // Don't include credentials
            }
            
            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $result,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to get payment gateways', [
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get payment gateways: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get a payment gateway by ID
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getById(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Gateway ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get gateway
            $gateway = $this->gatewayRepository->findById($id);
            
            if (!$gateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway not found'
                ], 404);
            }
            
            // Check if user has permission to view this gateway
            if ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only view their own gateways and system gateways
                if ($gateway->getClientId() !== null && $gateway->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role !== 'superadmin') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Include credentials only for the owner or superadmin
            $includeCredentials = $role === 'superadmin' || 
                                 ($role === 'client' && $gateway->getClientId() === $client['id']);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $gateway->toArray($includeCredentials)
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to get payment gateway', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get payment gateway: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create a payment gateway
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function create(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            if (empty($data['gateway'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Gateway type is required'
                ], 400);
            }
            
            if (!isset($data['credentials']) || !is_array($data['credentials'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Credentials are required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Determine client ID based on role
            $clientId = null;
            
            if ($role === 'superadmin') {
                // Superadmin can create system-wide or client-specific gateways
                $clientId = $data['client_id'] ?? null;
            } elseif ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only create their own gateways
                $clientId = $client['id'];
            } else {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Validate gateway type
            $availableGateways = $this->gatewayFactory->getAvailableGateways();
            if (!isset($availableGateways[$data['gateway']])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Invalid gateway type'
                ], 400);
            }
            
            // Validate credentials
            $requiredFields = $this->gatewayFactory->getRequiredConfigFields($data['gateway']);
            foreach ($requiredFields as $field => $config) {
                if ($config['required'] && empty($data['credentials'][$field])) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => $config['label'] . ' is required'
                    ], 400);
                }
            }
            
            // Check if gateway already exists for this client
            $existingGateway = $this->gatewayRepository->findByClientAndGateway($clientId, $data['gateway']);
            if ($existingGateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway already exists for this client'
                ], 400);
            }
            
            // Create gateway
            $gatewayData = [
                'client_id' => $clientId,
                'gateway' => $data['gateway'],
                'is_active' => (bool)($data['is_active'] ?? false),
                'is_production' => (bool)($data['is_production'] ?? false),
                'credentials' => $data['credentials']
            ];
            
            $gateway = $this->gatewayRepository->create($gatewayData);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Payment gateway created successfully',
                'data' => $gateway->toArray(false) // Don't include credentials in response
            ], 201);
        } catch (Exception $e) {
            $this->logger->error('Failed to create payment gateway', [
                'error' => $e->getMessage(),
                'data' => $request->getParsedBody()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to create payment gateway: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update a payment gateway
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            $data = $request->getParsedBody();
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Gateway ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get gateway
            $gateway = $this->gatewayRepository->findById($id);
            
            if (!$gateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway not found'
                ], 404);
            }
            
            // Check if user has permission to update this gateway
            if ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only update their own gateways
                if ($gateway->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role !== 'superadmin') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Prepare update data
            $updateData = [];
            
            if (isset($data['is_active'])) {
                $updateData['is_active'] = (bool)$data['is_active'];
            }
            
            if (isset($data['is_production'])) {
                $updateData['is_production'] = (bool)$data['is_production'];
            }
            
            if (isset($data['credentials']) && is_array($data['credentials'])) {
                // Validate credentials
                $requiredFields = $this->gatewayFactory->getRequiredConfigFields($gateway->getGateway());
                foreach ($requiredFields as $field => $config) {
                    if ($config['required'] && empty($data['credentials'][$field])) {
                        return $this->jsonResponse($response, [
                            'success' => false,
                            'message' => $config['label'] . ' is required'
                        ], 400);
                    }
                }
                
                $updateData['credentials'] = $data['credentials'];
            }
            
            if (empty($updateData)) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'No data to update'
                ], 400);
            }
            
            // Update gateway
            $updatedGateway = $this->gatewayRepository->update($id, $updateData);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Payment gateway updated successfully',
                'data' => $updatedGateway->toArray(false) // Don't include credentials in response
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to update payment gateway', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null,
                'data' => $request->getParsedBody()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to update payment gateway: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete a payment gateway
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Gateway ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get gateway
            $gateway = $this->gatewayRepository->findById($id);
            
            if (!$gateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway not found'
                ], 404);
            }
            
            // Check if user has permission to delete this gateway
            if ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only delete their own gateways
                if ($gateway->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role !== 'superadmin') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Delete gateway
            $result = $this->gatewayRepository->delete($id);
            
            if (!$result) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Failed to delete payment gateway'
                ], 500);
            }
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Payment gateway deleted successfully'
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to delete payment gateway', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to delete payment gateway: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get available payment gateways
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAvailableGateways(Request $request, Response $response, array $args): Response
    {
        try {
            $availableGateways = $this->gatewayFactory->getAvailableGateways();
            
            $result = [];
            foreach ($availableGateways as $key => $name) {
                $result[] = [
                    'id' => $key,
                    'name' => $name,
                    'config_fields' => $this->gatewayFactory->getRequiredConfigFields($key)
                ];
            }
            
            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to get available payment gateways', [
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get available payment gateways: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Test payment gateway connection
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function testConnection(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Gateway ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get gateway
            $gateway = $this->gatewayRepository->findById($id);
            
            if (!$gateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway not found'
                ], 404);
            }
            
            // Check if user has permission to test this gateway
            if ($role === 'client') {
                // Get client ID for this user
                $stmt = $this->db->prepare("SELECT id FROM clients WHERE user_id = ?");
                $stmt->execute([$userId]);
                $client = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$client) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Client not found for this user'
                    ], 404);
                }
                
                // Client can only test their own gateways and system gateways
                if ($gateway->getClientId() !== null && $gateway->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role !== 'superadmin') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Create gateway instance
            $gatewayInstance = $this->gatewayFactory->createFromConfig($gateway);
            
            // Test connection by getting payment methods
            $paymentMethods = $gatewayInstance->getPaymentMethods();
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Connection successful',
                'data' => [
                    'payment_methods' => $paymentMethods
                ]
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to test payment gateway connection', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * JSON response helper
     * 
     * @param Response $response
     * @param array $data
     * @param int $status
     * @return Response
     */
    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}