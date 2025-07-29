<?php

namespace App\Controllers;

use App\Repositories\PaymentRepository;
use App\Repositories\CustomerRepository;
use App\Services\PaymentService;
use App\Services\AuthService;
use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use PDO;

/**
 * PaymentController
 * 
 * Controller for handling payment operations
 */
class PaymentController
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
     * @var PaymentRepository
     */
    private $paymentRepository;
    
    /**
     * @var CustomerRepository
     */
    private $customerRepository;
    
    /**
     * @var PaymentService
     */
    private $paymentService;
    
    /**
     * @var AuthService
     */
    private $authService;
    
    /**
     * Constructor
     * 
     * @param PDO $db
     * @param LoggerInterface $logger
     * @param PaymentRepository $paymentRepository
     * @param CustomerRepository $customerRepository
     * @param PaymentService $paymentService
     * @param AuthService $authService
     */
    public function __construct(
        PDO $db,
        LoggerInterface $logger,
        PaymentRepository $paymentRepository,
        CustomerRepository $customerRepository,
        PaymentService $paymentService,
        AuthService $authService
    ) {
        $this->db = $db;
        $this->logger = $logger;
        $this->paymentRepository = $paymentRepository;
        $this->customerRepository = $customerRepository;
        $this->paymentService = $paymentService;
        $this->authService = $authService;
    }
    
    /**
     * Get all payments
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
                // Superadmin can see all payments
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
                
                // Client can only see payments for their customers
                $filters['client_id'] = $client['id'];
            } elseif ($role === 'customer') {
                // Get customer ID for this user
                $stmt = $this->db->prepare("SELECT id FROM customers WHERE user_id = ?");
                $stmt->execute([$userId]);
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customer) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Customer not found for this user'
                    ], 404);
                }
                
                // Customer can only see their own payments
                $filters['customer_id'] = $customer['id'];
            } else {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            // Apply additional filters
            if (isset($request->getQueryParams()['payment_gateway'])) {
                $filters['payment_gateway'] = $request->getQueryParams()['payment_gateway'];
            }
            
            if (isset($request->getQueryParams()['status'])) {
                $filters['status'] = $request->getQueryParams()['status'];
            }
            
            if (isset($request->getQueryParams()['date_from'])) {
                $filters['date_from'] = $request->getQueryParams()['date_from'];
            }
            
            if (isset($request->getQueryParams()['date_to'])) {
                $filters['date_to'] = $request->getQueryParams()['date_to'];
            }
            
            // Get payments
            $payments = $this->paymentRepository->findAll($filters, $page, $limit);
            $total = $this->paymentRepository->count($filters);
            
            // Format response
            $result = [];
            foreach ($payments as $payment) {
                $result[] = $payment->toArray(false); // Don't include payment details
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
            $this->logger->error('Failed to get payments', [
                'error' => $e->getMessage()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get payments: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get a payment by ID
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
                    'message' => 'Payment ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get payment
            $payment = $this->paymentRepository->findById($id);
            
            if (!$payment) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment not found'
                ], 404);
            }
            
            // Check if user has permission to view this payment
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
                
                // Get customer
                $customer = $this->customerRepository->findById($payment->getCustomerId());
                
                // Client can only view payments for their customers
                if (!$customer || $customer->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role === 'customer') {
                // Get customer ID for this user
                $stmt = $this->db->prepare("SELECT id FROM customers WHERE user_id = ?");
                $stmt->execute([$userId]);
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customer) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Customer not found for this user'
                    ], 404);
                }
                
                // Customer can only view their own payments
                if ($payment->getCustomerId() !== $customer['id']) {
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
            
            // Include payment details only for superadmin and client
            $includeDetails = $role === 'superadmin' || $role === 'client';
            
            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $payment->toArray($includeDetails)
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to get payment', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get payment: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create a payment transaction
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createTransaction(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            if (empty($data['customer_id'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Customer ID is required'
                ], 400);
            }
            
            if (empty($data['amount']) || !is_numeric($data['amount'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Valid amount is required'
                ], 400);
            }
            
            if (empty($data['payment_gateway'])) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Verify customer
            $customer = $this->customerRepository->findById($data['customer_id']);
            
            if (!$customer) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }
            
            // Check if user has permission to create payment for this customer
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
                
                // Client can only create payments for their customers
                if ($customer->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role === 'customer') {
                // Get customer ID for this user
                $stmt = $this->db->prepare("SELECT id FROM customers WHERE user_id = ?");
                $stmt->execute([$userId]);
                $customerData = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customerData) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Customer not found for this user'
                    ], 404);
                }
                
                // Customer can only create payments for themselves
                if ($data['customer_id'] !== $customerData['id']) {
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
            
            // Create payment transaction
            $result = $this->paymentService->createTransaction($data);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Payment transaction created successfully',
                'data' => $result
            ], 201);
        } catch (Exception $e) {
            $this->logger->error('Failed to create payment transaction', [
                'error' => $e->getMessage(),
                'data' => $request->getParsedBody()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to create payment transaction: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Handle payment notification
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function handleNotification(Request $request, Response $response, array $args): Response
    {
        try {
            $gateway = $args['gateway'] ?? null;
            $data = $request->getParsedBody();
            
            if (!$gateway) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment gateway is required'
                ], 400);
            }
            
            // Process notification
            $result = $this->paymentService->handleNotification($gateway, $data);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Notification processed successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to handle payment notification', [
                'error' => $e->getMessage(),
                'gateway' => $args['gateway'] ?? null,
                'data' => $request->getParsedBody()
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to handle payment notification: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get payment status
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get payment
            $payment = $this->paymentRepository->findById($id);
            
            if (!$payment) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment not found'
                ], 404);
            }
            
            // Check if user has permission to view this payment
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
                
                // Get customer
                $customer = $this->customerRepository->findById($payment->getCustomerId());
                
                // Client can only view payments for their customers
                if (!$customer || $customer->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role === 'customer') {
                // Get customer ID for this user
                $stmt = $this->db->prepare("SELECT id FROM customers WHERE user_id = ?");
                $stmt->execute([$userId]);
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customer) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Customer not found for this user'
                    ], 404);
                }
                
                // Customer can only view their own payments
                if ($payment->getCustomerId() !== $customer['id']) {
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
            
            // Get payment status
            $result = $this->paymentService->getPaymentStatus($id);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to get payment status', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to get payment status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Cancel payment
     * 
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function cancelPayment(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'] ?? null;
            
            if (!$id) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment ID is required'
                ], 400);
            }
            
            // Get user from token
            $user = $this->authService->getUserFromRequest($request);
            
            // Check permissions
            $role = $user['role'];
            $userId = $user['id'];
            
            // Get payment
            $payment = $this->paymentRepository->findById($id);
            
            if (!$payment) {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Payment not found'
                ], 404);
            }
            
            // Check if payment can be cancelled
            if ($payment->getStatus() !== 'pending') {
                return $this->jsonResponse($response, [
                    'success' => false,
                    'message' => 'Only pending payments can be cancelled'
                ], 400);
            }
            
            // Check if user has permission to cancel this payment
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
                
                // Get customer
                $customer = $this->customerRepository->findById($payment->getCustomerId());
                
                // Client can only cancel payments for their customers
                if (!$customer || $customer->getClientId() !== $client['id']) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403);
                }
            } elseif ($role === 'customer') {
                // Get customer ID for this user
                $stmt = $this->db->prepare("SELECT id FROM customers WHERE user_id = ?");
                $stmt->execute([$userId]);
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customer) {
                    return $this->jsonResponse($response, [
                        'success' => false,
                        'message' => 'Customer not found for this user'
                    ], 404);
                }
                
                // Customer can only cancel their own payments
                if ($payment->getCustomerId() !== $customer['id']) {
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
            
            // Cancel payment
            $result = $this->paymentService->cancelPayment($id);
            
            return $this->jsonResponse($response, [
                'success' => true,
                'message' => 'Payment cancelled successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            $this->logger->error('Failed to cancel payment', [
                'error' => $e->getMessage(),
                'id' => $args['id'] ?? null
            ]);
            
            return $this->jsonResponse($response, [
                'success' => false,
                'message' => 'Failed to cancel payment: ' . $e->getMessage()
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