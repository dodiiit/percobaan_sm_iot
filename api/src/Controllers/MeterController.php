<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Models\Meter;
use IndoWater\Api\Services\RealtimeService;
use Respect\Validation\Validator as v;

class MeterController
{
    private Meter $meterModel;
    private RealtimeService $realtimeService;

    public function __construct(Meter $meterModel, RealtimeService $realtimeService)
    {
        $this->meterModel = $meterModel;
        $this->realtimeService = $realtimeService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 20);
            $offset = (int) ($queryParams['offset'] ?? 0);
            $status = $queryParams['status'] ?? null;

            $conditions = [];
            if ($status) {
                $conditions['status'] = $status;
            }

            $meters = $this->meterModel->findAll($conditions, $limit, $offset);
            $total = $this->meterModel->count($conditions);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'meters' => $meters,
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
            $meter = $this->meterModel->find($id);

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $meter
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('meter_id', v::stringType()->notEmpty())
                        ->key('customer_id', v::stringType()->notEmpty())
                        ->key('property_id', v::stringType()->notEmpty())
                        ->key('installation_date', v::date())
                        ->key('meter_type', v::stringType()->notEmpty())
                        ->key('meter_model', v::stringType()->notEmpty())
                        ->key('meter_serial', v::stringType()->notEmpty());

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            // Check if meter_id already exists
            if ($this->meterModel->findByMeterId($data['meter_id'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter ID already exists'
                ], 409);
            }

            $meter = $this->meterModel->create($data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Meter created successfully',
                'data' => $meter
            ], 201);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $updatedMeter = $this->meterModel->update($id, $data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Meter updated successfully',
                'data' => $updatedMeter
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $this->meterModel->delete($id);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Meter deleted successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function consumption(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $queryParams = $request->getQueryParams();
            
            $startDate = $queryParams['start_date'] ?? date('Y-m-01'); // First day of current month
            $endDate = $queryParams['end_date'] ?? date('Y-m-d'); // Today

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $consumption = $this->meterModel->getConsumption($id, $startDate, $endDate);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'meter_id' => $meter['meter_id'],
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate
                    ],
                    'consumption' => $consumption
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function credits(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            // Get credit history
            $sql = "SELECT * FROM credits WHERE meter_id = ? ORDER BY created_at DESC LIMIT 50";
            $stmt = $this->meterModel->db->prepare($sql);
            $stmt->execute([$id]);
            $credits = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'meter_id' => $meter['meter_id'],
                    'current_credit' => $meter['last_credit'],
                    'last_credit_at' => $meter['last_credit_at'],
                    'credit_history' => $credits
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function topup(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('amount', v::numericVal()->positive());

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid amount'
                ], 400);
            }

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            // Start transaction
            $this->meterModel->beginTransaction();

            try {
                $amount = (float) $data['amount'];
                $previousBalance = $meter['last_credit'];
                $newBalance = $previousBalance + $amount;

                // Update meter credit
                $this->meterModel->updateCredit($id, $newBalance);

                // Create credit record
                $creditData = [
                    'meter_id' => $id,
                    'customer_id' => $meter['customer_id'],
                    'amount' => $amount,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $newBalance,
                    'status' => 'success'
                ];

                $sql = "INSERT INTO credits (id, meter_id, customer_id, amount, previous_balance, new_balance, status, created_at, updated_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $this->meterModel->db->prepare($sql);
                $stmt->execute([
                    \Ramsey\Uuid\Uuid::uuid4()->toString(),
                    $creditData['meter_id'],
                    $creditData['customer_id'],
                    $creditData['amount'],
                    $creditData['previous_balance'],
                    $creditData['new_balance'],
                    $creditData['status'],
                    date('Y-m-d H:i:s'),
                    date('Y-m-d H:i:s')
                ]);

                $this->meterModel->commit();

                return $this->jsonResponse($response, [
                    'status' => 'success',
                    'message' => 'Credit topped up successfully',
                    'data' => [
                        'meter_id' => $meter['meter_id'],
                        'amount' => $amount,
                        'previous_balance' => $previousBalance,
                        'new_balance' => $newBalance
                    ]
                ]);

            } catch (\Exception $e) {
                $this->meterModel->rollback();
                throw $e;
            }

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

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $status = $this->realtimeService->getMeterStatus($meter['meter_id']);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $status
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function ota(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            // This would typically trigger an OTA update process
            // For now, we'll just return a success response
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'OTA update initiated',
                'data' => [
                    'meter_id' => $meter['meter_id'],
                    'update_status' => 'pending'
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function control(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $action = $data['action'] ?? '';
            $validActions = ['start', 'stop', 'reset', 'calibrate'];

            if (!in_array($action, $validActions)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid action'
                ], 400);
            }

            // This would typically send a control command to the meter
            // For now, we'll just return a success response
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => "Control command '{$action}' sent successfully",
                'data' => [
                    'meter_id' => $meter['meter_id'],
                    'action' => $action,
                    'timestamp' => date('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}