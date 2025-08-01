<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

/**
 * Device Controller
 * Handles all device-related API endpoints for water meter devices
 * 
 * Endpoints:
 * - POST /device/register_device.php - Device registration/provisioning
 * - GET /device/credit.php - Get credit balance and tariff info
 * - POST /device/MeterReading.php - Submit meter readings
 * - GET /device/get_commands.php - Poll for pending commands
 * - POST /device/ack_command.php - Acknowledge command execution
 */
class DeviceController
{
    protected $container;
    protected $db;
    protected $logger;
    protected $jwtSecret;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->db = $container->get('db');
        $this->logger = $container->get('logger');
        $this->jwtSecret = $container->get('settings')['jwt']['secret'];
    }

    /**
     * Register a new device (provisioning)
     * POST /device/register_device.php
     * 
     * Expected payload:
     * {
     *   "provisioning_token": "token_from_admin",
     *   "device_id": "unique_chip_id"
     * }
     */
    public function registerDevice(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['provisioning_token']) || !isset($data['device_id'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required fields: provisioning_token, device_id'
                ], 400);
            }

            $provisioningToken = $data['provisioning_token'];
            $deviceId = $data['device_id'];

            // Validate provisioning token
            $stmt = $this->db->prepare("
                SELECT pt.*, c.id as client_id, c.name as client_name, c.status as client_status
                FROM provisioning_tokens pt
                JOIN clients c ON pt.client_id = c.id
                WHERE pt.token = ? AND pt.status = 'active' AND pt.expires_at > NOW()
            ");
            $stmt->execute([$provisioningToken]);
            $tokenData = $stmt->fetch();

            if (!$tokenData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid or expired provisioning token'
                ], 401);
            }

            if ($tokenData['client_status'] !== 'active') {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Client account is not active'
                ], 403);
            }

            // Check if device already exists
            $stmt = $this->db->prepare("SELECT id, meter_id FROM meters WHERE device_id = ?");
            $stmt->execute([$deviceId]);
            $existingDevice = $stmt->fetch();

            if ($existingDevice) {
                // Device already registered, return existing info
                $meterId = $existingDevice['meter_id'];
                
                // Generate JWT token for device
                $payload = [
                    'device_id' => $deviceId,
                    'meter_id' => $meterId,
                    'client_id' => $tokenData['client_id'],
                    'iat' => time(),
                    'exp' => time() + (365 * 24 * 60 * 60) // 1 year expiry
                ];
                
                $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');

                return $this->jsonResponse($response, [
                    'status' => 'success',
                    'message' => 'Device already registered',
                    'id_meter' => $meterId,
                    'jwt_token' => $jwt,
                    'client_name' => $tokenData['client_name']
                ]);
            }

            // Generate unique meter ID
            $meterId = $this->generateMeterId($tokenData['client_id']);

            // Create new meter record
            $stmt = $this->db->prepare("
                INSERT INTO meters (
                    meter_id, device_id, client_id, property_id, status, 
                    installation_date, k_factor, distance_tolerance, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, NULL, 'active', NOW(), 7.5, 15.0, NOW(), NOW())
            ");
            $stmt->execute([$meterId, $deviceId, $tokenData['client_id']]);
            
            $meterDbId = $this->db->lastInsertId();

            // Create initial credit record
            $stmt = $this->db->prepare("
                INSERT INTO credits (
                    meter_id, customer_id, amount, balance, transaction_type, 
                    status, created_at, updated_at
                ) VALUES (?, NULL, 0, 0, 'initial', 'completed', NOW(), NOW())
            ");
            $stmt->execute([$meterDbId]);

            // Mark provisioning token as used
            $stmt = $this->db->prepare("
                UPDATE provisioning_tokens 
                SET status = 'used', used_at = NOW(), used_by_device = ?
                WHERE token = ?
            ");
            $stmt->execute([$deviceId, $provisioningToken]);

            // Generate JWT token for device
            $payload = [
                'device_id' => $deviceId,
                'meter_id' => $meterId,
                'client_id' => $tokenData['client_id'],
                'iat' => time(),
                'exp' => time() + (365 * 24 * 60 * 60) // 1 year expiry
            ];
            
            $jwt = JWT::encode($payload, $this->jwtSecret, 'HS256');

            $this->logger->info("Device registered successfully", [
                'device_id' => $deviceId,
                'meter_id' => $meterId,
                'client_id' => $tokenData['client_id']
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Device registered successfully',
                'id_meter' => $meterId,
                'jwt_token' => $jwt,
                'client_name' => $tokenData['client_name']
            ]);

        } catch (Exception $e) {
            $this->logger->error("Device registration failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get device credit balance and tariff information
     * GET /device/credit.php?id_meter=METER_ID
     */
    public function getCredit(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $meterId = $params['id_meter'] ?? null;

            if (!$meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required parameter: id_meter'
                ], 400);
            }

            // Verify JWT token
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid or missing authentication token'
                ], 401);
            }

            if ($deviceData['meter_id'] !== $meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token does not match requested meter'
                ], 403);
            }

            // Get meter and credit information
            $stmt = $this->db->prepare("
                SELECT 
                    m.id, m.meter_id, m.client_id, m.customer_id, m.status as meter_status,
                    m.is_unlocked, m.k_factor, m.distance_tolerance,
                    c.name as client_name,
                    cust.name as customer_name,
                    COALESCE(cr.balance, 0) as current_balance,
                    COALESCE(t.price_per_m3, 1000) as tariff_per_m3
                FROM meters m
                LEFT JOIN clients c ON m.client_id = c.id
                LEFT JOIN customers cust ON m.customer_id = cust.id
                LEFT JOIN (
                    SELECT meter_id, balance 
                    FROM credits 
                    WHERE id IN (
                        SELECT MAX(id) FROM credits GROUP BY meter_id
                    )
                ) cr ON m.id = cr.meter_id
                LEFT JOIN tariffs t ON c.id = t.client_id AND t.status = 'active'
                WHERE m.meter_id = ? AND m.status = 'active'
            ");
            $stmt->execute([$meterId]);
            $meterData = $stmt->fetch();

            if (!$meterData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found or inactive'
                ], 404);
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data_pulsa' => (float)$meterData['current_balance'],
                'tarif_per_m3' => (float)$meterData['tariff_per_m3'],
                'is_unlocked' => (bool)$meterData['is_unlocked'],
                'meter_status' => $meterData['meter_status'],
                'client_name' => $meterData['client_name'],
                'customer_name' => $meterData['customer_name']
            ]);

        } catch (Exception $e) {
            $this->logger->error("Get credit failed", [
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
     * Submit meter reading data
     * POST /device/MeterReading.php
     * 
     * Expected payload:
     * {
     *   "id_meter": "METER_ID",
     *   "flow_rate_lpm": 2.5,
     *   "meter_reading_m3": 123.456,
     *   "current_voltage": 12.5,
     *   "door_status": 0,
     *   "status_message": "normal",
     *   "valve_status": "open"
     * }
     */
    public function submitMeterReading(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            $requiredFields = ['id_meter', 'flow_rate_lpm', 'meter_reading_m3', 'current_voltage', 'door_status', 'valve_status'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Missing required field: $field"
                    ], 400);
                }
            }

            // Verify JWT token
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid or missing authentication token'
                ], 401);
            }

            $meterId = $data['id_meter'];
            if ($deviceData['meter_id'] !== $meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token does not match requested meter'
                ], 403);
            }

            // Get meter information
            $stmt = $this->db->prepare("
                SELECT 
                    m.id, m.meter_id, m.client_id, m.customer_id, m.status,
                    m.is_unlocked,
                    COALESCE(cr.balance, 0) as current_balance,
                    COALESCE(t.price_per_m3, 1000) as tariff_per_m3,
                    COALESCE(lr.total_volume_m3, 0) as last_reading
                FROM meters m
                LEFT JOIN (
                    SELECT meter_id, balance 
                    FROM credits 
                    WHERE id IN (
                        SELECT MAX(id) FROM credits GROUP BY meter_id
                    )
                ) cr ON m.id = cr.meter_id
                LEFT JOIN tariffs t ON m.client_id = t.client_id AND t.status = 'active'
                LEFT JOIN (
                    SELECT meter_id, total_volume_m3
                    FROM meter_readings
                    WHERE id IN (
                        SELECT MAX(id) FROM meter_readings GROUP BY meter_id
                    )
                ) lr ON m.id = lr.meter_id
                WHERE m.meter_id = ? AND m.status = 'active'
            ");
            $stmt->execute([$meterId]);
            $meterData = $stmt->fetch();

            if (!$meterData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found or inactive'
                ], 404);
            }

            // Calculate consumption since last reading
            $currentReading = (float)$data['meter_reading_m3'];
            $lastReading = (float)$meterData['last_reading'];
            $consumption = max(0, $currentReading - $lastReading);
            
            // Calculate cost and update balance
            $tariffPerM3 = (float)$meterData['tariff_per_m3'];
            $consumptionCost = $consumption * $tariffPerM3;
            $currentBalance = (float)$meterData['current_balance'];
            $newBalance = max(0, $currentBalance - $consumptionCost);

            // Insert meter reading
            $stmt = $this->db->prepare("
                INSERT INTO meter_readings (
                    meter_id, flow_rate_lpm, total_volume_m3, consumption_m3,
                    voltage, door_status, valve_status, status_message,
                    reading_timestamp, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
            ");
            $stmt->execute([
                $meterData['id'],
                (float)$data['flow_rate_lpm'],
                $currentReading,
                $consumption,
                (float)$data['current_voltage'],
                (int)$data['door_status'],
                $data['valve_status'],
                $data['status_message'] ?? 'normal'
            ]);

            // Update balance if there was consumption
            if ($consumption > 0 && $consumptionCost > 0) {
                $stmt = $this->db->prepare("
                    INSERT INTO credits (
                        meter_id, customer_id, amount, balance, transaction_type,
                        consumption_m3, cost_amount, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, 'consumption', ?, ?, 'completed', NOW(), NOW())
                ");
                $stmt->execute([
                    $meterData['id'],
                    $meterData['customer_id'],
                    -$consumptionCost,
                    $newBalance,
                    $consumption,
                    $consumptionCost
                ]);
            }

            // Check for low balance alert
            if ($newBalance <= 5000 && $newBalance > 0) {
                $this->createAlert($meterData['id'], 'low_balance', "Low balance: Rp " . number_format($newBalance, 0, ',', '.'));
            } elseif ($newBalance <= 0) {
                $this->createAlert($meterData['id'], 'no_balance', "Balance depleted");
            }

            // Check for other alerts
            if ((int)$data['door_status'] === 1) {
                $this->createAlert($meterData['id'], 'door_open', "Door is open");
            }

            if ((float)$data['current_voltage'] < 5.0) {
                $this->createAlert($meterData['id'], 'low_voltage', "Low voltage: " . $data['current_voltage'] . "V");
            }

            $this->logger->info("Meter reading submitted", [
                'meter_id' => $meterId,
                'consumption' => $consumption,
                'new_balance' => $newBalance
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Meter reading submitted successfully',
                'data_pulsa' => $newBalance,
                'tarif_per_m3' => $tariffPerM3,
                'is_unlocked' => (bool)$meterData['is_unlocked'],
                'consumption_m3' => $consumption,
                'cost_amount' => $consumptionCost
            ]);

        } catch (Exception $e) {
            $this->logger->error("Submit meter reading failed", [
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
     * Get pending commands for device
     * GET /device/get_commands.php?id_meter=METER_ID
     */
    public function getCommands(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $meterId = $params['id_meter'] ?? null;

            if (!$meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required parameter: id_meter'
                ], 400);
            }

            // Verify JWT token
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid or missing authentication token'
                ], 401);
            }

            if ($deviceData['meter_id'] !== $meterId) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Token does not match requested meter'
                ], 403);
            }

            // Get meter ID from database
            $stmt = $this->db->prepare("SELECT id FROM meters WHERE meter_id = ? AND status = 'active'");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Meter not found'
                ], 404);
            }

            // Get pending commands
            $stmt = $this->db->prepare("
                SELECT id, command_type, parameters, current_valve_status, created_at
                FROM device_commands 
                WHERE meter_id = ? AND status = 'pending'
                ORDER BY created_at ASC
                LIMIT 10
            ");
            $stmt->execute([$meter['id']]);
            $commands = $stmt->fetchAll();

            $formattedCommands = [];
            foreach ($commands as $command) {
                $parameters = json_decode($command['parameters'], true) ?? [];
                
                $formattedCommands[] = [
                    'command_id' => (int)$command['id'],
                    'command_type' => $command['command_type'],
                    'current_valve_status' => $command['current_valve_status'],
                    'parameters' => $parameters,
                    'created_at' => $command['created_at']
                ];
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'commands' => $formattedCommands
            ]);

        } catch (Exception $e) {
            $this->logger->error("Get commands failed", [
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
     * Acknowledge command execution
     * POST /device/ack_command.php
     * 
     * Expected payload:
     * {
     *   "command_id": 123,
     *   "status": "acknowledged|failed",
     *   "notes": "Command executed successfully",
     *   "valve_status_ack": "open|closed"
     * }
     */
    public function acknowledgeCommand(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            $requiredFields = ['command_id', 'status', 'valve_status_ack'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    return $this->jsonResponse($response, [
                        'status' => 'error',
                        'message' => "Missing required field: $field"
                    ], 400);
                }
            }

            // Verify JWT token
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid or missing authentication token'
                ], 401);
            }

            $commandId = (int)$data['command_id'];
            $status = $data['status'];
            $notes = $data['notes'] ?? '';
            $valveStatusAck = $data['valve_status_ack'];

            // Verify command belongs to this device
            $stmt = $this->db->prepare("
                SELECT dc.*, m.meter_id 
                FROM device_commands dc
                JOIN meters m ON dc.meter_id = m.id
                WHERE dc.id = ? AND m.meter_id = ?
            ");
            $stmt->execute([$commandId, $deviceData['meter_id']]);
            $command = $stmt->fetch();

            if (!$command) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Command not found or does not belong to this device'
                ], 404);
            }

            // Update command status
            $newStatus = ($status === 'acknowledged') ? 'completed' : 'failed';
            $stmt = $this->db->prepare("
                UPDATE device_commands 
                SET status = ?, response_data = ?, executed_at = NOW(), updated_at = NOW()
                WHERE id = ?
            ");
            
            $responseData = json_encode([
                'valve_status' => $valveStatusAck,
                'notes' => $notes,
                'acknowledged_at' => date('Y-m-d H:i:s')
            ]);
            
            $stmt->execute([$newStatus, $responseData, $commandId]);

            // Update meter valve status if command was successful
            if ($status === 'acknowledged' && in_array($command['command_type'], ['valve_open', 'valve_close'])) {
                $stmt = $this->db->prepare("
                    UPDATE meters 
                    SET current_valve_status = ?, updated_at = NOW()
                    WHERE meter_id = ?
                ");
                $stmt->execute([$valveStatusAck, $deviceData['meter_id']]);
            }

            $this->logger->info("Command acknowledged", [
                'command_id' => $commandId,
                'meter_id' => $deviceData['meter_id'],
                'status' => $status,
                'valve_status' => $valveStatusAck
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Command acknowledgment received'
            ]);

        } catch (Exception $e) {
            $this->logger->error("Command acknowledgment failed", [
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
     * Generate unique meter ID
     */
    private function generateMeterId(int $clientId): string
    {
        $prefix = str_pad($clientId, 3, '0', STR_PAD_LEFT);
        $timestamp = date('ymd');
        
        // Get next sequence number for today
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count 
            FROM meters 
            WHERE client_id = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$clientId]);
        $result = $stmt->fetch();
        $sequence = str_pad(($result['count'] + 1), 4, '0', STR_PAD_LEFT);
        
        return $prefix . $timestamp . $sequence;
    }

    /**
     * Verify device JWT token
     */
    private function verifyDeviceToken(Request $request): ?array
    {
        try {
            $authHeader = $request->getHeaderLine('Authorization');
            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return null;
            }

            $token = $matches[1];
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            return [
                'device_id' => $decoded->device_id,
                'meter_id' => $decoded->meter_id,
                'client_id' => $decoded->client_id
            ];
        } catch (Exception $e) {
            $this->logger->warning("JWT verification failed", ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create alert for meter
     */
    private function createAlert(int $meterId, string $type, string $message): void
    {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO alerts (
                    meter_id, alert_type, message, status, created_at, updated_at
                ) VALUES (?, ?, ?, 'active', NOW(), NOW())
            ");
            $stmt->execute([$meterId, $type, $message]);
        } catch (Exception $e) {
            $this->logger->error("Failed to create alert", [
                'meter_id' => $meterId,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
        }
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