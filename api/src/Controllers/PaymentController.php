<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Models\Payment;
use IndoWater\Api\Services\PaymentService;
use Respect\Validation\Validator as v;

class PaymentController
{
    private Payment $paymentModel;
    private PaymentService $paymentService;

    public function __construct(Payment $paymentModel, PaymentService $paymentService)
    {
        $this->paymentModel = $paymentModel;
        $this->paymentService = $paymentService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 20);
            $offset = (int) ($queryParams['offset'] ?? 0);

            // Get payments based on user role
            if ($user['role'] === 'customer') {
                // Customer can only see their own payments
                $customer = $this->getCustomerByUserId($user['id']);
                if (!$customer) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => 'Customer profile not found'
                    ], 404);
                }
                $payments = $this->paymentModel->findByCustomerId($customer['id'], $limit);
                $total = $this->paymentModel->count(['customer_id' => $customer['id']]);
            } else {
                // Admin/Client can see all payments
                $payments = $this->paymentModel->findAll([], $limit, $offset);
                $total = $this->paymentModel->count();
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'payments' => $payments,
                    'pagination' => [
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_more' => ($offset + $limit) < $total
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $payment = $this->paymentModel->find($id);

            if (!$payment) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Payment not found'
                ], 404);
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('amount', v::numericVal()->positive())
                        ->key('method', v::in(['midtrans', 'doku']))
                        ->key('description', v::stringType()->notEmpty()->optional());

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            // Get customer info
            $customer = $this->getCustomerByUserId($user['id']);
            if (!$customer) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Customer profile not found'
                ], 404);
            }

            // Add customer data to payment
            $data['customer_id'] = $customer['id'];
            $data['customer_name'] = $customer['first_name'] . ' ' . $customer['last_name'];
            $data['customer_email'] = $customer['email'];
            $data['customer_phone'] = $customer['phone'];
            $data['return_url'] = $data['return_url'] ?? $_ENV['APP_URL'] . '/dashboard/payments';

            $payment = $this->paymentService->createPayment($data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Payment created successfully',
                'data' => $payment
            ], 201);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function status(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $payment = $this->paymentService->checkPaymentStatus($id);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $payment
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function webhook(Request $request, Response $response, array $args): Response
    {
        try {
            $method = $args['method'] ?? '';
            $data = $request->getParsedBody();

            if (empty($method) || !in_array($method, ['midtrans', 'doku'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid payment method'
                ], 400);
            }

            $result = $this->paymentService->handleWebhook($method, $data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Webhook processed successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function summary(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $customer = $this->getCustomerByUserId($user['id']);

            if (!$customer) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Customer profile not found'
                ], 404);
            }

            $totalPaid = $this->paymentModel->getTotalAmount($customer['id'], 'success');
            $totalPending = $this->paymentModel->getTotalAmount($customer['id'], 'pending');
            $recentPayments = $this->paymentModel->findByCustomerId($customer['id'], 5);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'total_paid' => $totalPaid,
                    'total_pending' => $totalPending,
                    'recent_payments' => $recentPayments
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getCustomerByUserId(string $userId): ?array
    {
        // This would use the Customer model
        // For now, return a placeholder
        return [
            'id' => 'customer-' . $userId,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'phone' => '+6281234567890'
        ];
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}