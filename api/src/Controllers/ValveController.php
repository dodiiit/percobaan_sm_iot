<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Controllers\BaseController;
use IndoWater\Api\Models\Valve;
use IndoWater\Api\Models\ValveCommand;
use IndoWater\Api\Services\ValveControlService;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;
use Respect\Validation\Validator as v;

class ValveController extends BaseController
{
    private Valve $valveModel;
    private ValveCommand $commandModel;
    private ValveControlService $valveService;

    public function __construct(
        Valve $valveModel,
        ValveCommand $commandModel,
        ValveControlService $valveService,
        CacheService $cache,
        LoggerInterface $logger
    ) {
        parent::__construct($cache, $logger);
        $this->valveModel = $valveModel;
        $this->commandModel = $commandModel;
        $this->valveService = $valveService;
    }

    /**
     * Get all valves with pagination and filtering
     */
    public function index(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 20);
            $offset = (int) ($queryParams['offset'] ?? 0);
            $status = $queryParams['status'] ?? null;
            $state = $queryParams['state'] ?? null;
            $meterId = $queryParams['meter_id'] ?? null;

            $conditions = [];
            if ($status) $conditions['status'] = $status;
            if ($state) $conditions['current_state'] = $state;
            if ($meterId) $conditions['meter_id'] = $meterId;

            $cacheKey = $this->getPaginatedCacheKey('valves', $conditions, $limit, $offset);

            return $this->cachedJsonResponse($response, $cacheKey, function() use ($conditions, $limit, $offset) {
                $valves = $this->valveModel->findAll($conditions, $limit, $offset);
                $total = $this->valveModel->count($conditions);

                return [
                    'status' => 'success',
                    'data' => [
                        'valves' => $valves,
                        'pagination' => [
                            'total' => $total,
                            'limit' => $limit,
                            'offset' => $offset,
                            'has_more' => ($offset + $limit) < $total
                        ]
                    ]
                ];
            }, 300);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get valve overview with health status
     */
    public function overview(Request $request, Response $response): Response
    {
        try {
            $cacheKey = 'valve_overview';

            return $this->cachedJsonResponse($response, $cacheKey, function() {
                $overview = $this->valveModel->getValveOverview();
                $statistics = $this->valveService->getSystemStatistics();

                return [
                    'status' => 'success',
                    'data' => [
                        'valves' => $overview,
                        'statistics' => $statistics
                    ]
                ];
            }, 60); // Cache for 1 minute

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get specific valve details
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            
            return $this->successResponse($response, $this->valveService->getValveStatus($id));

        } catch (\Exception $e) {
            if ($e->getMessage() === 'Valve not found') {
                return $this->errorResponse($response, $e->getMessage(), 404);
            }
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Create a new valve
     */
    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $this->sanitizeInput($request->getParsedBody());

            // Validate required fields
            $required = ['valve_id', 'meter_id', 'property_id', 'valve_type', 'valve_model', 'valve_serial', 'installation_date'];
            $missing = $this->validateRequired($data, $required);
            
            if (!empty($missing)) {
                return $this->errorResponse($response, 'Missing required fields: ' . implode(', ', $missing), 400);
            }

            // Validate input
            $validator = v::key('valve_id', v::stringType()->notEmpty())
                        ->key('meter_id', v::stringType()->notEmpty())
                        ->key('property_id', v::stringType()->notEmpty())
                        ->key('valve_type', v::in(['main', 'secondary', 'emergency', 'bypass']))
                        ->key('valve_model', v::stringType()->notEmpty())
                        ->key('valve_serial', v::stringType()->notEmpty())
                        ->key('installation_date', v::date());

            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Invalid input data', 400);
            }

            // Check if valve_id already exists
            if ($this->valveModel->findByValveId($data['valve_id'])) {
                return $this->errorResponse($response, 'Valve ID already exists', 409);
            }

            $valve = $this->valveModel->create($data);

            // Invalidate related cache
            $this->invalidateCache(['valves*', 'valve_*']);

            return $this->successResponse($response, $valve, 'Valve created successfully', 201);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Update valve information
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $this->sanitizeInput($request->getParsedBody());

            $valve = $this->valveModel->find($id);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            $updatedValve = $this->valveModel->update($id, $data);

            // Invalidate cache
            $this->invalidateCache(['valves*', 'valve_*']);

            return $this->successResponse($response, $updatedValve, 'Valve updated successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Delete a valve
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];

            $valve = $this->valveModel->find($id);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            $this->valveModel->delete($id);

            // Invalidate cache
            $this->invalidateCache(['valves*', 'valve_*']);

            return $this->successResponse($response, null, 'Valve deleted successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Open a valve
     */
    public function open(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            $reason = $data['reason'] ?? 'Manual open command';
            $priority = $data['priority'] ?? 'normal';

            $result = $this->valveService->openValve($id, $userId, $reason, $priority);

            return $this->successResponse($response, $result, 'Open command sent successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Close a valve
     */
    public function close(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            $reason = $data['reason'] ?? 'Manual close command';
            $priority = $data['priority'] ?? 'normal';

            $result = $this->valveService->closeValve($id, $userId, $reason, $priority);

            return $this->successResponse($response, $result, 'Close command sent successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Partially open a valve
     */
    public function partialOpen(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            // Validate percentage
            $validator = v::key('percentage', v::intVal()->between(0, 100));
            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Invalid percentage. Must be between 0 and 100.', 400);
            }

            $percentage = (int) $data['percentage'];
            $reason = $data['reason'] ?? "Partial open to {$percentage}%";
            $priority = $data['priority'] ?? 'normal';

            $result = $this->valveService->partialOpenValve($id, $percentage, $userId, $reason, $priority);

            return $this->successResponse($response, $result, 'Partial open command sent successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Emergency close a valve
     */
    public function emergencyClose(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            $reason = $data['reason'] ?? 'Emergency close command';

            $result = $this->valveService->emergencyCloseValve($id, $userId, $reason);

            return $this->successResponse($response, $result, 'Emergency close command sent successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Check valve status
     */
    public function status(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $userId = $this->getUserId($request);

            $result = $this->valveService->checkValveStatus($id, $userId);

            return $this->successResponse($response, $result, 'Status check command sent successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get valve command history
     */
    public function commands(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 50);

            $valve = $this->valveModel->find($id);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            $commands = $this->commandModel->getCommandsByValve($id, $limit);

            return $this->successResponse($response, [
                'valve_id' => $valve['valve_id'],
                'commands' => $commands
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get valve status history
     */
    public function history(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 50);

            $valve = $this->valveModel->find($id);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            $history = $this->valveModel->getStatusHistory($id, $limit);

            return $this->successResponse($response, [
                'valve_id' => $valve['valve_id'],
                'status_history' => $history
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get valve alerts
     */
    public function alerts(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];

            $valve = $this->valveModel->find($id);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            $alerts = $this->valveModel->getActiveAlerts($id);

            return $this->successResponse($response, [
                'valve_id' => $valve['valve_id'],
                'active_alerts' => $alerts
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledgeAlert(Request $request, Response $response, array $args): Response
    {
        try {
            $alertId = $args['alert_id'];
            $userId = $this->getUserId($request);

            $result = $this->valveModel->acknowledgeAlert($alertId, $userId);

            if (!$result) {
                return $this->errorResponse($response, 'Alert not found or already acknowledged', 404);
            }

            return $this->successResponse($response, null, 'Alert acknowledged successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Resolve an alert
     */
    public function resolveAlert(Request $request, Response $response, array $args): Response
    {
        try {
            $alertId = $args['alert_id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            $resolutionNotes = $data['resolution_notes'] ?? null;

            $result = $this->valveModel->resolveAlert($alertId, $userId, $resolutionNotes);

            if (!$result) {
                return $this->errorResponse($response, 'Alert not found or already resolved', 404);
            }

            return $this->successResponse($response, null, 'Alert resolved successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Enable manual override
     */
    public function enableOverride(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            // Validate reason
            $validator = v::key('reason', v::stringType()->notEmpty());
            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Reason is required for manual override', 400);
            }

            $reason = $data['reason'];

            $result = $this->valveService->enableManualOverride($id, $userId, $reason);

            if (!$result) {
                return $this->errorResponse($response, 'Failed to enable manual override', 500);
            }

            return $this->successResponse($response, null, 'Manual override enabled successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Disable manual override
     */
    public function disableOverride(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $userId = $this->getUserId($request);

            $result = $this->valveService->disableManualOverride($id, $userId);

            if (!$result) {
                return $this->errorResponse($response, 'Failed to disable manual override', 500);
            }

            return $this->successResponse($response, null, 'Manual override disabled successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get system statistics
     */
    public function statistics(Request $request, Response $response): Response
    {
        try {
            $statistics = $this->valveService->getSystemStatistics();

            return $this->successResponse($response, $statistics);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get failed commands
     */
    public function failedCommands(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $hours = (int) ($queryParams['hours'] ?? 24);

            $failedCommands = $this->commandModel->getFailedCommands($hours);

            return $this->successResponse($response, [
                'failed_commands' => $failedCommands,
                'period_hours' => $hours
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Process device response (webhook endpoint for IoT devices)
     */
    public function deviceResponse(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate required fields
            $validator = v::key('command_id', v::stringType()->notEmpty())
                        ->key('valve_id', v::stringType()->notEmpty())
                        ->key('response_data', v::arrayType());

            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Invalid device response format', 400);
            }

            $commandId = $data['command_id'];
            $valveId = $data['valve_id'];
            $responseData = $data['response_data'];

            // Verify valve exists
            $valve = $this->valveModel->findByValveId($valveId);
            if (!$valve) {
                return $this->errorResponse($response, 'Valve not found', 404);
            }

            // Process the response
            $success = $this->valveService->processCommandResponse($commandId, $responseData);

            return $this->successResponse($response, [
                'processed' => $success,
                'command_id' => $commandId,
                'valve_id' => $valveId
            ], 'Device response processed successfully');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Bulk valve operations
     */
    public function bulkOperation(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $userId = $this->getUserId($request);

            // Validate input
            $validator = v::key('valve_ids', v::arrayType()->notEmpty())
                        ->key('operation', v::in(['open', 'close', 'emergency_close', 'status_check']))
                        ->key('reason', v::stringType()->notEmpty());

            if (!$validator->validate($data)) {
                return $this->errorResponse($response, 'Invalid bulk operation data', 400);
            }

            $valveIds = $data['valve_ids'];
            $operation = $data['operation'];
            $reason = $data['reason'];
            $priority = $data['priority'] ?? 'normal';

            $results = [];
            $errors = [];

            foreach ($valveIds as $valveId) {
                try {
                    switch ($operation) {
                        case 'open':
                            $result = $this->valveService->openValve($valveId, $userId, $reason, $priority);
                            break;
                        case 'close':
                            $result = $this->valveService->closeValve($valveId, $userId, $reason, $priority);
                            break;
                        case 'emergency_close':
                            $result = $this->valveService->emergencyCloseValve($valveId, $userId, $reason);
                            break;
                        case 'status_check':
                            $result = $this->valveService->checkValveStatus($valveId, $userId);
                            break;
                    }
                    $results[] = $result;
                } catch (\Exception $e) {
                    $errors[] = [
                        'valve_id' => $valveId,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return $this->successResponse($response, [
                'operation' => $operation,
                'successful' => $results,
                'errors' => $errors,
                'total_processed' => count($results),
                'total_errors' => count($errors)
            ], 'Bulk operation completed');

        } catch (\Exception $e) {
            return $this->errorResponse($response, $e->getMessage());
        }
    }

    /**
     * Get user ID from request (override BaseController method)
     */
    protected function getUserId($request): string
    {
        // Use parent method if available, otherwise return system user
        $userId = parent::getUserId($request);
        return $userId ?? 'system';
    }
}