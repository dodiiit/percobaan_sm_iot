<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use IndoWater\Api\Models\Client;
use IndoWater\Api\Models\User;
use IndoWater\Api\Models\Property;
use IndoWater\Api\Models\Customer;
use IndoWater\Api\Models\Meter;
use IndoWater\Api\Models\Payment;
use PDO;

class ClientController
{
    private ContainerInterface $container;
    private PDO $db;
    private Client $clientModel;
    private User $userModel;
    private Property $propertyModel;
    private Customer $customerModel;
    private Meter $meterModel;
    private Payment $paymentModel;

    public function __construct(ContainerInterface $container, PDO $db)
    {
        $this->container = $container;
        $this->db = $db;
        $this->clientModel = new Client($db);
        $this->userModel = new User($db);
        $this->propertyModel = new Property($db);
        $this->customerModel = new Customer($db);
        $this->meterModel = new Meter($db);
        $this->paymentModel = new Payment($db);
    }

    public function index(Request $request, Response $response): Response
    {
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $status = $params['status'] ?? null;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get clients
        $conditions = [];
        if ($status) {
            $conditions['status'] = $status;
        }
        
        $clients = $this->clientModel->getAllWithUserDetails($conditions, $limit, $offset);
        $total = $this->clientModel->count($conditions);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Clients retrieved successfully',
            'data' => [
                'clients' => $clients,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        $client = $this->clientModel->getWithUserDetails($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get additional statistics
        $propertiesCount = $this->propertyModel->count(['client_id' => $id]);
        $customersCount = $this->customerModel->count(['client_id' => $id]);
        $metersCount = $this->meterModel->count(['client_id' => $id]);
        
        $client['statistics'] = [
            'properties_count' => $propertiesCount,
            'customers_count' => $customersCount,
            'meters_count' => $metersCount,
        ];
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Client retrieved successfully',
            'data' => [
                'client' => $client,
            ],
        ]);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        $requiredFields = [
            'company_name', 'address', 'city', 'province', 'postal_code',
            'contact_person', 'contact_email', 'contact_phone',
            'user_name', 'user_email', 'user_password',
        ];
        
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => "Field '$field' is required",
                ], 400);
            }
        }
        
        // Check if email already exists
        $existingUser = $this->userModel->findByEmail($data['user_email']);
        
        if ($existingUser) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email already exists',
            ], 409);
        }
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Create user
            $userData = [
                'name' => $data['user_name'],
                'email' => $data['user_email'],
                'password' => password_hash($data['user_password'], PASSWORD_ARGON2ID, [
                    'memory_cost' => 65536, // 64MB
                    'time_cost' => 4,
                    'threads' => 3,
                ]),
                'phone' => $data['contact_phone'] ?? null,
                'role' => 'client',
                'status' => $data['status'] ?? 'pending',
            ];
            
            $userId = $this->userModel->create($userData);
            
            if (!$userId) {
                throw new \Exception('Failed to create user');
            }
            
            // Create client
            $clientData = [
                'user_id' => $userId,
                'company_name' => $data['company_name'],
                'address' => $data['address'],
                'city' => $data['city'],
                'province' => $data['province'],
                'postal_code' => $data['postal_code'],
                'contact_person' => $data['contact_person'],
                'contact_email' => $data['contact_email'],
                'contact_phone' => $data['contact_phone'],
                'logo' => $data['logo'] ?? null,
                'website' => $data['website'] ?? null,
                'tax_id' => $data['tax_id'] ?? null,
                'service_fee_type' => $data['service_fee_type'] ?? 'percentage',
                'service_fee_value' => $data['service_fee_value'] ?? 5.00,
                'status' => $data['status'] ?? 'pending',
            ];
            
            $clientId = $this->clientModel->create($clientData);
            
            if (!$clientId) {
                throw new \Exception('Failed to create client');
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get created client
            $client = $this->clientModel->getWithUserDetails($clientId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Client created successfully',
                'data' => [
                    'client' => $client,
                ],
            ], 201);
        } catch (\Exception $e) {
            // Rollback transaction
            $this->db->rollBack();
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $data = $request->getParsedBody();
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Update client
            $clientData = array_intersect_key($data, array_flip([
                'company_name', 'address', 'city', 'province', 'postal_code',
                'contact_person', 'contact_email', 'contact_phone', 'logo',
                'website', 'tax_id', 'service_fee_type', 'service_fee_value', 'status',
            ]));
            
            if (!empty($clientData)) {
                $updated = $this->clientModel->update($id, $clientData);
                
                if (!$updated) {
                    throw new \Exception('Failed to update client');
                }
            }
            
            // Update user if user data is provided
            if (isset($data['user_name']) || isset($data['user_email']) || isset($data['user_password'])) {
                $userData = [];
                
                if (isset($data['user_name'])) {
                    $userData['name'] = $data['user_name'];
                }
                
                if (isset($data['user_email'])) {
                    // Check if email already exists
                    $existingUser = $this->userModel->findByEmail($data['user_email']);
                    
                    if ($existingUser && $existingUser['id'] !== $client['user_id']) {
                        throw new \Exception('Email already exists');
                    }
                    
                    $userData['email'] = $data['user_email'];
                }
                
                if (isset($data['user_password']) && !empty($data['user_password'])) {
                    $userData['password'] = password_hash($data['user_password'], PASSWORD_ARGON2ID, [
                        'memory_cost' => 65536, // 64MB
                        'time_cost' => 4,
                        'threads' => 3,
                    ]);
                }
                
                if (!empty($userData)) {
                    $updated = $this->userModel->update($client['user_id'], $userData);
                    
                    if (!$updated) {
                        throw new \Exception('Failed to update user');
                    }
                }
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get updated client
            $updatedClient = $this->clientModel->getWithUserDetails($id);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Client updated successfully',
                'data' => [
                    'client' => $updatedClient,
                ],
            ]);
        } catch (\Exception $e) {
            // Rollback transaction
            $this->db->rollBack();
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Delete client
            $deleted = $this->clientModel->delete($id);
            
            if (!$deleted) {
                throw new \Exception('Failed to delete client');
            }
            
            // Delete user
            $deleted = $this->userModel->delete($client['user_id']);
            
            if (!$deleted) {
                throw new \Exception('Failed to delete user');
            }
            
            // Commit transaction
            $this->db->commit();
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Client deleted successfully',
            ]);
        } catch (\Exception $e) {
            // Rollback transaction
            $this->db->rollBack();
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function activate(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Activate client
            $updated = $this->clientModel->updateStatus($id, 'active');
            
            if (!$updated) {
                throw new \Exception('Failed to activate client');
            }
            
            // Activate user
            $updated = $this->userModel->update($client['user_id'], ['status' => 'active']);
            
            if (!$updated) {
                throw new \Exception('Failed to activate user');
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get updated client
            $updatedClient = $this->clientModel->getWithUserDetails($id);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Client activated successfully',
                'data' => [
                    'client' => $updatedClient,
                ],
            ]);
        } catch (\Exception $e) {
            // Rollback transaction
            $this->db->rollBack();
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function deactivate(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Deactivate client
            $updated = $this->clientModel->updateStatus($id, 'inactive');
            
            if (!$updated) {
                throw new \Exception('Failed to deactivate client');
            }
            
            // Deactivate user
            $updated = $this->userModel->update($client['user_id'], ['status' => 'inactive']);
            
            if (!$updated) {
                throw new \Exception('Failed to deactivate user');
            }
            
            // Commit transaction
            $this->db->commit();
            
            // Get updated client
            $updatedClient = $this->clientModel->getWithUserDetails($id);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Client deactivated successfully',
                'data' => [
                    'client' => $updatedClient,
                ],
            ]);
        } catch (\Exception $e) {
            // Rollback transaction
            $this->db->rollBack();
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function properties(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get properties
        $properties = $this->propertyModel->findByClientId($id, $limit, $offset);
        $total = $this->propertyModel->count(['client_id' => $id]);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Properties retrieved successfully',
            'data' => [
                'properties' => $properties,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function customers(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get customers
        $customers = $this->customerModel->getAllWithUserDetails(['client_id' => $id], $limit, $offset);
        $total = $this->customerModel->count(['client_id' => $id]);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Customers retrieved successfully',
            'data' => [
                'customers' => $customers,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function meters(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get meters
        $meters = $this->meterModel->getAllWithDetails(['client_id' => $id], $limit, $offset);
        $total = $this->meterModel->count(['client_id' => $id]);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Meters retrieved successfully',
            'data' => [
                'meters' => $meters,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function payments(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get payments
        $payments = $this->paymentModel->getAllWithDetails(['client_id' => $id], $limit, $offset);
        $total = $this->paymentModel->count(['client_id' => $id]);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Payments retrieved successfully',
            'data' => [
                'payments' => $payments,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function reports(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $period = $params['period'] ?? 'month';
        
        // Get payment summary
        $paymentSummary = $this->paymentModel->getSummaryByClient($id, $period);
        
        // Get statistics
        $propertiesCount = $this->propertyModel->count(['client_id' => $id]);
        $customersCount = $this->customerModel->count(['client_id' => $id]);
        $metersCount = $this->meterModel->count(['client_id' => $id]);
        $paymentsCount = $this->paymentModel->count(['client_id' => $id]);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Reports retrieved successfully',
            'data' => [
                'statistics' => [
                    'properties_count' => $propertiesCount,
                    'customers_count' => $customersCount,
                    'meters_count' => $metersCount,
                    'payments_count' => $paymentsCount,
                ],
                'payment_summary' => $paymentSummary,
            ],
        ]);
    }

    public function invoices(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client ID is required',
            ], 400);
        }
        
        // Check if client exists
        $client = $this->clientModel->findById($id);
        
        if (!$client) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Client not found',
            ], 404);
        }
        
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get payments (invoices)
        $conditions = ['client_id' => $id];
        
        if ($startDate && $endDate) {
            // Implementation depends on your database structure
            // This is a placeholder for date filtering
        }
        
        $invoices = $this->paymentModel->getAllWithDetails($conditions, $limit, $offset);
        $total = $this->paymentModel->count($conditions);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Invoices retrieved successfully',
            'data' => [
                'invoices' => $invoices,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}