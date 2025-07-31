<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Models\ServiceFeePlan;
use IndoWater\Api\Models\ServiceFeeComponent;
use IndoWater\Api\Models\ServiceFeeTransaction;
use IndoWater\Api\Models\ServiceFeeInvoice;
use IndoWater\Api\Services\ServiceFeeService;
use Respect\Validation\Validator as v;

class ServiceFeeController
{
    private ServiceFeePlan $planModel;
    private ServiceFeeComponent $componentModel;
    private ServiceFeeTransaction $transactionModel;
    private ServiceFeeInvoice $invoiceModel;
    private ServiceFeeService $feeService;

    public function __construct(
        ServiceFeePlan $planModel,
        ServiceFeeComponent $componentModel,
        ServiceFeeTransaction $transactionModel,
        ServiceFeeInvoice $invoiceModel,
        ServiceFeeService $feeService
    ) {
        $this->planModel = $planModel;
        $this->componentModel = $componentModel;
        $this->transactionModel = $transactionModel;
        $this->invoiceModel = $invoiceModel;
        $this->feeService = $feeService;
    }

    // Helper method for JSON responses
    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    // Plans Management

    public function getPlans(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 20);
            $offset = (int) ($queryParams['offset'] ?? 0);
            
            $plans = $this->planModel->findAll([], $limit, $offset);
            $total = $this->planModel->count();
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'plans' => $plans,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve service fee plans: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPlan(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['id'];
            $plan = $this->planModel->find($planId);
            
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPlanWithComponents(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['id'];
            $plan = $this->planModel->getWithComponents($planId);
            
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createPlan(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate input
            if (empty($data['name'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Plan name is required'
                ], 400);
            }
            
            // Create plan
            $plan = $this->planModel->create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true
            ]);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee plan created successfully',
                'data' => $plan
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to create service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updatePlan(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['id'];
            $data = $request->getParsedBody();
            
            // Check if plan exists
            $plan = $this->planModel->find($planId);
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            // Update plan
            $allowedFields = ['name', 'description', 'is_active'];
            $updateData = [];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No valid fields to update'
                ], 400);
            }
            
            $this->planModel->update($planId, $updateData);
            $updatedPlan = $this->planModel->find($planId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee plan updated successfully',
                'data' => $updatedPlan
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deletePlan(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['id'];
            
            // Check if plan exists
            $plan = $this->planModel->find($planId);
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            // Delete plan
            $this->planModel->delete($planId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee plan deleted successfully'
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to delete service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Components Management

    public function getComponents(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['planId'];
            
            // Check if plan exists
            $plan = $this->planModel->find($planId);
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            $components = $this->planModel->getComponents($planId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'plan_id' => $planId,
                    'components' => $components
                ]
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve service fee components: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createComponent(Request $request, Response $response, array $args): Response
    {
        try {
            $planId = $args['planId'];
            $data = $request->getParsedBody();
            
            // Check if plan exists
            $plan = $this->planModel->find($planId);
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            // Validate input
            if (empty($data['name']) || empty($data['fee_type']) || !isset($data['fee_value'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Name, fee type, and fee value are required'
                ], 400);
            }
            
            // Create component
            $component = $this->componentModel->create([
                'plan_id' => $planId,
                'name' => $data['name'],
                'fee_type' => $data['fee_type'],
                'fee_value' => $data['fee_value'],
                'min_transaction_amount' => $data['min_transaction_amount'] ?? null,
                'max_transaction_amount' => $data['max_transaction_amount'] ?? null,
                'min_fee_amount' => $data['min_fee_amount'] ?? null,
                'max_fee_amount' => $data['max_fee_amount'] ?? null,
                'is_active' => $data['is_active'] ?? true
            ]);
            
            // Add tiers if provided and component is tiered
            if (in_array($data['fee_type'], ['tiered_percentage', 'tiered_fixed']) && !empty($data['tiers'])) {
                foreach ($data['tiers'] as $tier) {
                    $this->componentModel->addTier(
                        $component['id'],
                        $tier['min_amount'],
                        $tier['max_amount'] ?? null,
                        $tier['fee_value']
                    );
                }
                
                // Refresh component with tiers
                $component = $this->componentModel->find($component['id']);
                $component['tiers'] = $this->componentModel->getTiers($component['id']);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee component created successfully',
                'data' => $component
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to create service fee component: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateComponent(Request $request, Response $response, array $args): Response
    {
        try {
            $componentId = $args['id'];
            $data = $request->getParsedBody();
            
            // Check if component exists
            $component = $this->componentModel->find($componentId);
            if (!$component) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee component not found'
                ], 404);
            }
            
            // Update component
            $allowedFields = [
                'name', 'fee_type', 'fee_value', 
                'min_transaction_amount', 'max_transaction_amount',
                'min_fee_amount', 'max_fee_amount', 'is_active'
            ];
            
            $updateData = [];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No valid fields to update'
                ], 400);
            }
            
            $this->componentModel->update($componentId, $updateData);
            $updatedComponent = $this->componentModel->find($componentId);
            
            // Update tiers if provided and component is tiered
            if (in_array($updatedComponent['fee_type'], ['tiered_percentage', 'tiered_fixed']) && !empty($data['tiers'])) {
                // Get existing tiers
                $existingTiers = $this->componentModel->getTiers($componentId);
                $existingTierIds = array_column($existingTiers, 'id');
                
                // Process tiers
                foreach ($data['tiers'] as $tier) {
                    if (isset($tier['id']) && in_array($tier['id'], $existingTierIds)) {
                        // Update existing tier
                        $this->componentModel->updateTier($tier['id'], [
                            'min_amount' => $tier['min_amount'],
                            'max_amount' => $tier['max_amount'] ?? null,
                            'fee_value' => $tier['fee_value']
                        ]);
                    } else {
                        // Add new tier
                        $this->componentModel->addTier(
                            $componentId,
                            $tier['min_amount'],
                            $tier['max_amount'] ?? null,
                            $tier['fee_value']
                        );
                    }
                }
                
                // Delete tiers that are not in the update
                if (isset($data['delete_tiers']) && is_array($data['delete_tiers'])) {
                    foreach ($data['delete_tiers'] as $tierId) {
                        if (in_array($tierId, $existingTierIds)) {
                            $this->componentModel->deleteTier($tierId);
                        }
                    }
                }
            }
            
            // Refresh component with tiers
            $updatedComponent = $this->componentModel->find($componentId);
            if (in_array($updatedComponent['fee_type'], ['tiered_percentage', 'tiered_fixed'])) {
                $updatedComponent['tiers'] = $this->componentModel->getTiers($componentId);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee component updated successfully',
                'data' => $updatedComponent
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update service fee component: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteComponent(Request $request, Response $response, array $args): Response
    {
        try {
            $componentId = $args['id'];
            
            // Check if component exists
            $component = $this->componentModel->find($componentId);
            if (!$component) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee component not found'
                ], 404);
            }
            
            // Delete component
            $this->componentModel->delete($componentId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee component deleted successfully'
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to delete service fee component: ' . $e->getMessage()
            ], 500);
        }
    }

    // Client Plan Assignment

    public function getClientPlan(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $plan = $this->planModel->getActiveClientPlan($clientId);
            
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No active service fee plan found for client'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $plan
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve client service fee plan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function assignPlanToClient(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $data = $request->getParsedBody();
            
            // Validate input
            if (empty($data['plan_id']) || empty($data['effective_from'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Plan ID and effective from date are required'
                ], 400);
            }
            
            // Check if plan exists
            $plan = $this->planModel->find($data['plan_id']);
            if (!$plan) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Service fee plan not found'
                ], 404);
            }
            
            // Assign plan to client
            $assignment = $this->planModel->assignToClient(
                $data['plan_id'],
                $clientId,
                $data['effective_from'],
                $data['effective_to'] ?? null
            );
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Service fee plan assigned to client successfully',
                'data' => $assignment
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to assign service fee plan to client: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getClientPlanAssignments(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $assignments = $this->planModel->getClientAssignments($clientId);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'client_id' => $clientId,
                    'assignments' => $assignments
                ]
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve client plan assignments: ' . $e->getMessage()
            ], 500);
        }
    }

    // Transactions and Invoices

    public function getClientTransactions(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $queryParams = $request->getQueryParams();
            
            $filters = [
                'status' => $queryParams['status'] ?? null,
                'start_date' => $queryParams['start_date'] ?? null,
                'end_date' => $queryParams['end_date'] ?? null,
                'invoice_id' => $queryParams['invoice_id'] ?? null
            ];
            
            $limit = (int) ($queryParams['limit'] ?? 50);
            $offset = (int) ($queryParams['offset'] ?? 0);
            
            $transactions = $this->transactionModel->findByClientId($clientId, $filters, $limit, $offset);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'client_id' => $clientId,
                    'transactions' => $transactions
                ]
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve client transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getClientInvoices(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $queryParams = $request->getQueryParams();
            
            $filters = [
                'status' => $queryParams['status'] ?? null,
                'start_date' => $queryParams['start_date'] ?? null,
                'end_date' => $queryParams['end_date'] ?? null
            ];
            
            $limit = (int) ($queryParams['limit'] ?? 50);
            $offset = (int) ($queryParams['offset'] ?? 0);
            
            $invoices = $this->invoiceModel->findByClientId($clientId, $filters, $limit, $offset);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'client_id' => $clientId,
                    'invoices' => $invoices
                ]
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve client invoices: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $invoiceId = $args['id'];
            $invoice = $this->invoiceModel->getWithTransactions($invoiceId);
            
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $invoice
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to retrieve invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    public function generateMonthlyInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $data = $request->getParsedBody();
            
            // Validate input
            if (empty($data['year']) || empty($data['month'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Year and month are required'
                ], 400);
            }
            
            $options = [
                'issue_date' => $data['issue_date'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null
            ];
            
            $invoice = $this->feeService->generateMonthlyInvoice(
                $clientId,
                $data['year'],
                $data['month'],
                $options
            );
            
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No pending fees found for the specified period'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Monthly invoice generated successfully',
                'data' => $invoice
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to generate monthly invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    public function generateCustomInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $data = $request->getParsedBody();
            
            // Validate input
            if (empty($data['start_date']) || empty($data['end_date'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Start date and end date are required'
                ], 400);
            }
            
            $options = [
                'issue_date' => $data['issue_date'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null
            ];
            
            $invoice = $this->feeService->generateCustomInvoice(
                $clientId,
                $data['start_date'],
                $data['end_date'],
                $options
            );
            
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No pending fees found for the specified period'
                ], 404);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Custom invoice generated successfully',
                'data' => $invoice
            ], 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to generate custom invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    public function issueInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $invoiceId = $args['id'];
            
            // Check if invoice exists
            $invoice = $this->invoiceModel->find($invoiceId);
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }
            
            // Issue invoice
            $result = $this->invoiceModel->issueInvoice($invoiceId);
            
            if (!$result) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Failed to issue invoice. It may already be issued or paid.'
                ], 400);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Invoice issued successfully',
                'data' => $this->invoiceModel->find($invoiceId)
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to issue invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    public function markInvoiceAsPaid(Request $request, Response $response, array $args): Response
    {
        try {
            $invoiceId = $args['id'];
            $data = $request->getParsedBody();
            
            // Check if invoice exists
            $invoice = $this->invoiceModel->find($invoiceId);
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }
            
            // Mark invoice as paid
            $result = $this->invoiceModel->markAsPaid($invoiceId, $data['paid_date'] ?? null);
            
            if (!$result) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Failed to mark invoice as paid. It may already be cancelled.'
                ], 400);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Invoice marked as paid successfully',
                'data' => $this->invoiceModel->find($invoiceId)
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to mark invoice as paid: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelInvoice(Request $request, Response $response, array $args): Response
    {
        try {
            $invoiceId = $args['id'];
            
            // Check if invoice exists
            $invoice = $this->invoiceModel->find($invoiceId);
            if (!$invoice) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invoice not found'
                ], 404);
            }
            
            // Cancel invoice
            $result = $this->invoiceModel->cancelInvoice($invoiceId);
            
            if (!$result) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Failed to cancel invoice. It may already be paid.'
                ], 400);
            }
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Invoice cancelled successfully',
                'data' => $this->invoiceModel->find($invoiceId)
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to cancel invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    // Reports

    public function getClientFeeReport(Request $request, Response $response, array $args): Response
    {
        try {
            $clientId = $args['clientId'];
            $queryParams = $request->getQueryParams();
            
            // Validate input
            if (empty($queryParams['start_date']) || empty($queryParams['end_date'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Start date and end date are required'
                ], 400);
            }
            
            $report = $this->feeService->getClientFeeReport(
                $clientId,
                $queryParams['start_date'],
                $queryParams['end_date']
            );
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to generate client fee report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAccrualReport(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            
            // Validate input
            if (empty($queryParams['start_date']) || empty($queryParams['end_date'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Start date and end date are required'
                ], 400);
            }
            
            $report = $this->feeService->getAccrualReport(
                $queryParams['start_date'],
                $queryParams['end_date']
            );
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to generate accrual report: ' . $e->getMessage()
            ], 500);
        }
    }
}