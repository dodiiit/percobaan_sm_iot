<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Controllers\BaseController;
use IndoWater\Api\Models\Meter;
use IndoWater\Api\Services\RealtimeService;
use IndoWater\Api\Services\ValveControlService;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;
use Respect\Validation\Validator as v;

class MeterController extends BaseController
{
    private Meter $meterModel;
    private RealtimeService $realtimeService;
    private ValveControlService $valveService;

    public function __construct(
        Meter $meterModel, 
        RealtimeService $realtimeService,
        ValveControlService $valveService,
        CacheService $cache,
        LoggerInterface $logger
    ) {
        parent::__construct($cache, $logger);
        $this->meterModel = $meterModel;
        $this->realtimeService = $realtimeService;
        $this->valveService = $valveService;
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

            // Generate cache key for this request
            $cacheKey = $this->getPaginatedCacheKey('meters', $conditions, $limit, $offset);

            return $this->cachedJsonResponse($response, $cacheKey, function() use ($conditions, $limit, $offset) {
                $meters = $this->meterModel->findAll($conditions, $limit, $offset);
                $total = $this->meterModel->count($conditions);

                return [
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
                ];
            }, 300); // Cache for 5 minutes

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $cacheKey = $this->cache->generateApiKey('meter', ['id' => $id]);

            return $this->cachedJsonResponse($response, $cacheKey, function() use ($id) {
                $meter = $this->meterModel->find($id);

                if (!$meter) {
                    throw new \Exception('Meter not found');
                }

                return [
                    'status' => 'success',
                    'data' => $meter
                ];
            }, 300); // Cache for 5 minutes

        } catch (\Exception $e) {
            if ($e->getMessage() === 'Meter not found') {
                return $this->errorResponse($response, $e->getMessage(), 404);
            }
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $this->sanitizeInput($request->getParsedBody());

            // Validate required fields
            $required = ['meter_id', 'customer_id', 'property_id', 'installation_date', 'meter_type', 'meter_model', 'meter_serial'];
            $missing = $this->validateRequired($data, $required);
            
            if (!empty($missing)) {
                return $this->errorResponse($response, 'Missing required fields: ' . implode(', ', $missing), 400);
            }

            // Validate input
            $validator = v::key('meter_id', v::stringType()->notEmpty())
                        ->key('customer_id', v::stringType()->notEmpty())
                        ->key('property_id', v::stringType()->notEmpty())
                        ->key('installation_date', v::date())
                        ->key('meter_type', v::stringType()->notEmpty())
                        ->key('meter_model', v::stringType()->notEmpty())
                        ->key('meter_serial', v::stringType()->notEmpty());

            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Invalid input data', 400);
            }

            // Check if meter_id already exists
            if ($this->meterModel->findByMeterId($data['meter_id'])) {
                return $this->errorResponse($response, 'Meter ID already exists', 409);
            }

            $meter = $this->meterModel->create($data);

            // Invalidate related cache
            $this->invalidateCache(['meters*', 'properties*']);

            return $this->successResponse($response, $meter, 'Meter created successfully', 201);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
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

    public function balance(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $cacheKey = $this->cache->generateApiKey('meter_balance', ['id' => $id]);

            return $this->cachedJsonResponse($response, $cacheKey, function() use ($id) {
                $meter = $this->meterModel->find($id);
                if (!$meter) {
                    throw new \Exception('Meter not found');
                }

                $balance = $this->meterModel->getBalance($id);

                return [
                    'status' => 'success',
                    'data' => [
                        'meter_id' => $meter['meter_id'],
                        'current_balance' => $balance,
                        'last_updated' => $meter['last_credit_at'],
                        'status' => $meter['status']
                    ]
                ];
            }, 60); // Cache for 1 minute (real-time data)

        } catch (\Exception $e) {
            if ($e->getMessage() === 'Meter not found') {
                return $this->errorResponse($response, $e->getMessage(), 404);
            }
            return $this->errorResponse($response, $e->getMessage());
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

            // Get credit history using the new method
            $credits = $this->meterModel->getCreditHistory($id);

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
            $validator = v::key('amount', v::numericVal()->positive())
                        ->key('description', v::stringType()->notEmpty()->optional());

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            $meter = $this->meterModel->find($id);
            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            $amount = (float) $data['amount'];
            $description = $data['description'] ?? 'Manual credit top-up';

            // Use the new addCredit method
            $result = $this->meterModel->addCredit($id, $amount, $description);

            // Check if valve should be opened due to credit restoration
            $previousBalance = $result['previous_balance'];
            $newBalance = $result['new_balance'];
            $lowCreditThreshold = $meter['low_credit_threshold'] ?? 10.00;

            if ($previousBalance <= $lowCreditThreshold && $newBalance > $lowCreditThreshold) {
                try {
                    // Auto-open valves if credit is restored above threshold
                    $valveResults = $this->valveService->autoOpenValveForCreditRestore($id);
                    $result['valve_actions'] = $valveResults;
                } catch (\Exception $e) {
                    $this->logger->warning('Failed to auto-open valves after credit top-up', [
                        'meter_id' => $meter['meter_id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Invalidate balance and credit cache
            $this->invalidateCache([
                'meter_balance:*:' . $id,
                'meter_credits:*:' . $id,
                'meter:*:' . $id,
                'valve_*'
            ]);

            // Send real-time notification
            if ($this->realtimeService) {
                $this->realtimeService->broadcastMeterUpdate($meter['meter_id'], [
                    'type' => 'credit_topup',
                    'amount' => $amount,
                    'new_balance' => $result['new_balance'],
                    'valve_actions' => $result['valve_actions'] ?? [],
                    'timestamp' => time()
                ]);
            }

            return $this->successResponse($response, $result, 'Credit topped up successfully', 201);

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
            return $this->errorResponse($response, $e->getMessage());
        }
    }
}