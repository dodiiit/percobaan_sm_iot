<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Exception;

/**
 * Device Command Controller
 * Handles remote commands for water meter devices
 */
class DeviceCommandController
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
     * Send valve control command
     * POST /device/command/valve
     * 
     * Expected payload:
     * {
     *   "meter_id": "METER_ID",
     *   "action": "open|close",
     *   "reason": "Manual control by admin"
     * }
     */
    public function controlValve(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            $requiredFields = ['meter_id', 'action'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Missing required field: $field"
                    ], 400);
                }
            }

            $meterId = $data['meter_id'];
            $action = $data['action'];
            $reason = $data['reason'] ?? 'Remote valve control';

            if (!in_array($action, ['open', 'close'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid action. Must be "open" or "close"'
                ], 400);
            }

            // Get meter information
            $stmt = $this->db->prepare("
                SELECT id, meter_id, client_id, customer_id, status, current_valve_status
                FROM meters 
                WHERE meter_id = ? AND status = 'active'
            ");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found or inactive'
                ], 404);
            }

            $commandType = $action === 'open' ? 'valve_open' : 'valve_close';
            $currentValveStatus = $meter['current_valve_status'] ?? 'unknown';

            // Create device command
            $commandId = $this->createDeviceCommand(
                $meter['id'],
                $commandType,
                ['reason' => $reason],
                $currentValveStatus
            );

            $this->logger->info("Valve control command created", [
                'command_id' => $commandId,
                'meter_id' => $meterId,
                'action' => $action,
                'reason' => $reason
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Valve control command sent successfully',
                'command_id' => $commandId,
                'action' => $action,
                'meter_id' => $meterId
            ]);

        } catch (Exception $e) {
            $this->logger->error("Valve control command failed", [
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
     * Send configuration update command
     * POST /device/command/config
     * 
     * Expected payload:
     * {
     *   "meter_id": "METER_ID",
     *   "config": {
     *     "k_factor": 7.5,
     *     "distance_tolerance": 15.0
     *   }
     * }
     */
    public function updateConfig(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['meter_id']) || !isset($data['config'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required fields: meter_id, config'
                ], 400);
            }

            $meterId = $data['meter_id'];
            $config = $data['config'];

            // Validate config parameters
            $allowedParams = ['k_factor', 'distance_tolerance'];
            $validConfig = [];

            foreach ($config as $key => $value) {
                if (!in_array($key, $allowedParams)) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Invalid config parameter: $key"
                    ], 400);
                }

                if (!is_numeric($value) || $value < 0) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Invalid value for $key: must be a positive number"
                    ], 400);
                }

                $validConfig[$key] = (float)$value;
            }

            if (empty($validConfig)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'No valid config parameters provided'
                ], 400);
            }

            // Get meter information
            $stmt = $this->db->prepare("
                SELECT id, meter_id, client_id, current_valve_status
                FROM meters 
                WHERE meter_id = ? AND status = 'active'
            ");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found or inactive'
                ], 404);
            }

            // Create device command
            $commandId = $this->createDeviceCommand(
                $meter['id'],
                'arduino_config_update',
                ['config_data' => $validConfig],
                $meter['current_valve_status'] ?? 'unknown'
            );

            // Update meter configuration in database
            $updateFields = [];
            $updateParams = [];

            if (isset($validConfig['k_factor'])) {
                $updateFields[] = 'k_factor = ?';
                $updateParams[] = $validConfig['k_factor'];
            }

            if (isset($validConfig['distance_tolerance'])) {
                $updateFields[] = 'distance_tolerance = ?';
                $updateParams[] = $validConfig['distance_tolerance'];
            }

            if (!empty($updateFields)) {
                $updateFields[] = 'updated_at = NOW()';
                $updateParams[] = $meterId;

                $updateQuery = "UPDATE meters SET " . implode(', ', $updateFields) . " WHERE meter_id = ?";
                $stmt = $this->db->prepare($updateQuery);
                $stmt->execute($updateParams);
            }

            $this->logger->info("Config update command created", [
                'command_id' => $commandId,
                'meter_id' => $meterId,
                'config' => $validConfig
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Configuration update command sent successfully',
                'command_id' => $commandId,
                'config' => $validConfig,
                'meter_id' => $meterId
            ]);

        } catch (Exception $e) {
            $this->logger->error("Config update command failed", [
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
     * Set meter unlock status
     * POST /device/command/unlock
     * 
     * Expected payload:
     * {
     *   "meter_id": "METER_ID",
     *   "unlock": true,
     *   "reason": "Maintenance work"
     * }
     */
    public function setUnlockStatus(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            $requiredFields = ['meter_id', 'unlock'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Missing required field: $field"
                    ], 400);
                }
            }

            $meterId = $data['meter_id'];
            $unlock = (bool)$data['unlock'];
            $reason = $data['reason'] ?? ($unlock ? 'Device unlocked for maintenance' : 'Device locked');

            // Get meter information
            $stmt = $this->db->prepare("
                SELECT id, meter_id, client_id, is_unlocked
                FROM meters 
                WHERE meter_id = ? AND status = 'active'
            ");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found or inactive'
                ], 404);
            }

            // Update unlock status in database
            $stmt = $this->db->prepare("
                UPDATE meters 
                SET is_unlocked = ?, updated_at = NOW()
                WHERE meter_id = ?
            ");
            $stmt->execute([$unlock, $meterId]);

            // Log the unlock status change
            $stmt = $this->db->prepare("
                INSERT INTO meter_logs (
                    meter_id, log_type, message, created_at
                ) VALUES (?, 'unlock_status', ?, NOW())
            ");
            $stmt->execute([
                $meter['id'],
                $reason . ' - Status: ' . ($unlock ? 'UNLOCKED' : 'LOCKED')
            ]);

            $this->logger->info("Meter unlock status changed", [
                'meter_id' => $meterId,
                'unlock' => $unlock,
                'reason' => $reason
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Meter unlock status updated successfully',
                'meter_id' => $meterId,
                'unlock' => $unlock,
                'reason' => $reason
            ]);

        } catch (Exception $e) {
            $this->logger->error("Set unlock status failed", [
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
     * Get command history
     * GET /device/command/history?meter_id=METER_ID&limit=20
     */
    public function getCommandHistory(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $meterId = $params['meter_id'] ?? null;
            $limit = min(100, max(10, (int)($params['limit'] ?? 20)));
            $page = max(1, (int)($params['page'] ?? 1));
            $offset = ($page - 1) * $limit;

            if (!$meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required parameter: meter_id'
                ], 400);
            }

            // Get meter database ID
            $stmt = $this->db->prepare("SELECT id FROM meters WHERE meter_id = ?");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            // Get total count
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as total
                FROM device_commands
                WHERE meter_id = ?
            ");
            $stmt->execute([$meter['id']]);
            $totalCount = $stmt->fetch()['total'];

            // Get command history
            $stmt = $this->db->prepare("
                SELECT 
                    id, command_type, parameters, current_valve_status,
                    status, response_data, created_at, executed_at
                FROM device_commands
                WHERE meter_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$meter['id'], $limit, $offset]);
            $commands = $stmt->fetchAll();

            $formattedCommands = [];
            foreach ($commands as $command) {
                $parameters = json_decode($command['parameters'], true) ?? [];
                $responseData = json_decode($command['response_data'], true) ?? [];

                $formattedCommands[] = [
                    'id' => (int)$command['id'],
                    'command_type' => $command['command_type'],
                    'parameters' => $parameters,
                    'current_valve_status' => $command['current_valve_status'],
                    'status' => $command['status'],
                    'response_data' => $responseData,
                    'created_at' => $command['created_at'],
                    'executed_at' => $command['executed_at']
                ];
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $formattedCommands,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$totalCount,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error("Get command history failed", [
                'error' => $e->getMessage(),
                'meter_id' => $meterId ?? 'unknown'
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Cancel pending command
     * POST /device/command/cancel
     * 
     * Expected payload:
     * {
     *   "command_id": 123
     * }
     */
    public function cancelCommand(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['command_id'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required field: command_id'
                ], 400);
            }

            $commandId = (int)$data['command_id'];

            // Get command details
            $stmt = $this->db->prepare("
                SELECT dc.*, m.meter_id
                FROM device_commands dc
                JOIN meters m ON dc.meter_id = m.id
                WHERE dc.id = ?
            ");
            $stmt->execute([$commandId]);
            $command = $stmt->fetch();

            if (!$command) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Command not found'
                ], 404);
            }

            if ($command['status'] !== 'pending') {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Command cannot be cancelled (status: ' . $command['status'] . ')'
                ], 400);
            }

            // Cancel the command
            $stmt = $this->db->prepare("
                UPDATE device_commands 
                SET status = 'cancelled', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$commandId]);

            $this->logger->info("Command cancelled", [
                'command_id' => $commandId,
                'meter_id' => $command['meter_id'],
                'command_type' => $command['command_type']
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Command cancelled successfully',
                'command_id' => $commandId
            ]);

        } catch (Exception $e) {
            $this->logger->error("Cancel command failed", [
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
     * Create a device command
     */
    private function createDeviceCommand(int $meterId, string $commandType, array $parameters, string $currentValveStatus): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO device_commands (
                meter_id, command_type, parameters, current_valve_status,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
        ");
        
        $stmt->execute([
            $meterId,
            $commandType,
            json_encode($parameters),
            $currentValveStatus
        ]);

        return (int)$this->db->lastInsertId();
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