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

/**
 * DeviceController handles IoT device communication endpoints
 * These endpoints are specifically designed for Arduino/NodeMCU firmware communication
 */
class DeviceController extends BaseController
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

    /**
     * Device registration endpoint
     * POST /device/register_device.php
     */
    public function registerDevice(Request $request, Response $response): Response
    {
        try {
            $data = $this->sanitizeInput($request->getParsedBody());

            // Validate required fields
            if (!isset($data['provisioning_token']) || !isset($data['device_id'])) {
                return $this->errorResponse($response, 'Missing required fields: provisioning_token, device_id', 400);
            }

            $provisioningToken = $data['provisioning_token'];
            $deviceId = $data['device_id'];

            // Validate provisioning token (this should be implemented based on your business logic)
            if (!$this->validateProvisioningToken($provisioningToken)) {
                return $this->errorResponse($response, 'Invalid provisioning token', 401);
            }

            // Check if device already exists
            $existingMeter = $this->meterModel->findByDeviceId($deviceId);
            if ($existingMeter) {
                // Device already registered, return existing info
                $jwt = $this->generateDeviceJWT($existingMeter['meter_id']);
                
                return $this->successResponse($response, [
                    'id_meter' => $existingMeter['meter_id'],
                    'jwt' => $jwt,
                    'device_id' => $deviceId
                ], 'Device already registered');
            }

            // Create new meter entry
            $meterData = [
                'meter_id' => $this->generateMeterId(),
                'device_id' => $deviceId,
                'status' => 'active',
                'installation_date' => date('Y-m-d H:i:s'),
                'meter_type' => 'smart_water_meter',
                'meter_model' => 'Arduino_NodeMCU_v1',
                'meter_serial' => $deviceId,
                'current_credit' => 0.0,
                'last_reading' => 0.0,
                'is_unlocked' => false
            ];

            $meter = $this->meterModel->create($meterData);
            $jwt = $this->generateDeviceJWT($meter['meter_id']);

            // Invalidate related cache
            $this->invalidateCache(['meters*']);

            return $this->successResponse($response, [
                'id_meter' => $meter['meter_id'],
                'jwt' => $jwt,
                'device_id' => $deviceId
            ], 'Device registered successfully', 201);

        } catch (\Exception $e) {
            $this->logger->error('Device registration failed', [
                'error' => $e->getMessage(),
                'data' => $data ?? null
            ]);
            return $this->errorResponse($response, 'Registration failed: ' . $e->getMessage());
        }
    }

    /**
     * Get device credit/balance
     * GET /device/credit.php
     */
    public function getCredit(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $meterId = $queryParams['id_meter'] ?? null;

            if (!$meterId) {
                return $this->errorResponse($response, 'Missing id_meter parameter', 400);
            }

            // Authenticate device using JWT
            $jwt = $this->extractJWTFromRequest($request);
            if (!$this->validateDeviceJWT($jwt, $meterId)) {
                return $this->errorResponse($response, 'Invalid or expired token', 401);
            }

            $meter = $this->meterModel->findByMeterId($meterId);
            if (!$meter) {
                return $this->errorResponse($response, 'Meter not found', 404);
            }

            // Get current balance and tariff
            $balance = $this->meterModel->getBalance($meter['id']);
            $tariff = $this->meterModel->getCurrentTariff($meter['id']);

            return $this->successResponse($response, [
                'data_pulsa' => $balance,
                'tarif_per_m3' => $tariff,
                'is_unlocked' => (bool)$meter['is_unlocked'],
                'id_meter' => $meterId
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Get credit failed', [
                'error' => $e->getMessage(),
                'meter_id' => $meterId ?? 'unknown'
            ]);
            return $this->errorResponse($response, 'Failed to get credit: ' . $e->getMessage());
        }
    }

    /**
     * Submit meter reading
     * POST /device/MeterReading.php
     */
    public function submitReading(Request $request, Response $response): Response
    {
        try {
            $data = $this->sanitizeInput($request->getParsedBody());

            // Validate required fields
            $required = ['id_meter', 'flow_rate_lpm', 'meter_reading_m3', 'current_voltage', 'door_status', 'valve_status'];
            $missing = $this->validateRequired($data, $required);
            
            if (!empty($missing)) {
                return $this->errorResponse($response, 'Missing required fields: ' . implode(', ', $missing), 400);
            }

            $meterId = $data['id_meter'];

            // Authenticate device using JWT
            $jwt = $this->extractJWTFromRequest($request);
            if (!$this->validateDeviceJWT($jwt, $meterId)) {
                return $this->errorResponse($response, 'Invalid or expired token', 401);
            }

            $meter = $this->meterModel->findByMeterId($meterId);
            if (!$meter) {
                return $this->errorResponse($response, 'Meter not found', 404);
            }

            // Process meter reading
            $readingData = [
                'meter_id' => $meter['id'],
                'flow_rate' => (float)$data['flow_rate_lpm'],
                'reading_value' => (float)$data['meter_reading_m3'],
                'voltage' => (float)$data['current_voltage'],
                'door_status' => (int)$data['door_status'],
                'valve_status' => $data['valve_status'],
                'reading_time' => date('Y-m-d H:i:s'),
                'status_message' => $data['status_message'] ?? 'normal'
            ];

            // Save reading to database
            $this->meterModel->saveReading($readingData);

            // Update meter's last reading
            $this->meterModel->update($meter['id'], [
                'last_reading' => $readingData['reading_value'],
                'last_reading_at' => $readingData['reading_time'],
                'current_voltage' => $readingData['voltage'],
                'valve_status' => $readingData['valve_status']
            ]);

            // Calculate credit deduction if water was consumed
            $creditDeduction = 0;
            if ($readingData['flow_rate'] > 0) {
                $tariff = $this->meterModel->getCurrentTariff($meter['id']);
                $creditDeduction = $readingData['flow_rate'] * $tariff / 1000; // Convert LPM to m3
                
                // Deduct credit
                $this->meterModel->deductCredit($meter['id'], $creditDeduction);
            }

            // Get updated balance and status
            $updatedBalance = $this->meterModel->getBalance($meter['id']);
            $updatedMeter = $this->meterModel->find($meter['id']);
            $tariff = $this->meterModel->getCurrentTariff($meter['id']);

            // Send real-time update
            if ($this->realtimeService) {
                $this->realtimeService->broadcastMeterUpdate($meterId, [
                    'type' => 'reading_update',
                    'reading' => $readingData,
                    'balance' => $updatedBalance,
                    'timestamp' => time()
                ]);
            }

            // Invalidate cache
            $this->invalidateCache([
                'meter_balance:*:' . $meter['id'],
                'meter:*:' . $meter['id']
            ]);

            return $this->successResponse($response, [
                'data_pulsa' => $updatedBalance,
                'tarif_per_m3' => $tariff,
                'is_unlocked' => (bool)$updatedMeter['is_unlocked'],
                'credit_deducted' => $creditDeduction
            ], 'Reading submitted successfully');

        } catch (\Exception $e) {
            $this->logger->error('Submit reading failed', [
                'error' => $e->getMessage(),
                'data' => $data ?? null
            ]);
            return $this->errorResponse($response, 'Failed to submit reading: ' . $e->getMessage());
        }
    }

    /**
     * Get pending commands for device
     * GET /device/get_commands.php
     */
    public function getCommands(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $meterId = $queryParams['id_meter'] ?? null;

            if (!$meterId) {
                return $this->errorResponse($response, 'Missing id_meter parameter', 400);
            }

            // Authenticate device using JWT
            $jwt = $this->extractJWTFromRequest($request);
            if (!$this->validateDeviceJWT($jwt, $meterId)) {
                return $this->errorResponse($response, 'Invalid or expired token', 401);
            }

            $meter = $this->meterModel->findByMeterId($meterId);
            if (!$meter) {
                return $this->errorResponse($response, 'Meter not found', 404);
            }

            // Get pending commands from valve service
            $commands = $this->valveService->getPendingCommands($meter['id']);

            return $this->successResponse($response, [
                'commands' => $commands
            ], 'Commands retrieved successfully');

        } catch (\Exception $e) {
            $this->logger->error('Get commands failed', [
                'error' => $e->getMessage(),
                'meter_id' => $meterId ?? 'unknown'
            ]);
            return $this->errorResponse($response, 'Failed to get commands: ' . $e->getMessage());
        }
    }

    /**
     * Acknowledge command execution
     * POST /device/ack_command.php
     */
    public function acknowledgeCommand(Request $request, Response $response): Response
    {
        try {
            $data = $this->sanitizeInput($request->getParsedBody());

            // Validate required fields
            $required = ['id_meter', 'command_id_ack', 'status_ack', 'valve_status_ack'];
            $missing = $this->validateRequired($data, $required);
            
            if (!empty($missing)) {
                return $this->errorResponse($response, 'Missing required fields: ' . implode(', ', $missing), 400);
            }

            $meterId = $data['id_meter'];

            // Authenticate device using JWT
            $jwt = $this->extractJWTFromRequest($request);
            if (!$this->validateDeviceJWT($jwt, $meterId)) {
                return $this->errorResponse($response, 'Invalid or expired token', 401);
            }

            $meter = $this->meterModel->findByMeterId($meterId);
            if (!$meter) {
                return $this->errorResponse($response, 'Meter not found', 404);
            }

            // Process command acknowledgment
            $ackData = [
                'meter_id' => $meter['id'],
                'command_id' => (int)$data['command_id_ack'],
                'status' => $data['status_ack'],
                'notes' => $data['notes_ack'] ?? '',
                'valve_status' => $data['valve_status_ack'],
                'acknowledged_at' => date('Y-m-d H:i:s')
            ];

            // Update command status in valve service
            $this->valveService->acknowledgeCommand($ackData);

            // Update meter valve status
            $this->meterModel->update($meter['id'], [
                'valve_status' => $ackData['valve_status'],
                'last_command_ack_at' => $ackData['acknowledged_at']
            ]);

            // Send real-time update
            if ($this->realtimeService) {
                $this->realtimeService->broadcastMeterUpdate($meterId, [
                    'type' => 'command_ack',
                    'command_id' => $ackData['command_id'],
                    'status' => $ackData['status'],
                    'valve_status' => $ackData['valve_status'],
                    'timestamp' => time()
                ]);
            }

            // Invalidate cache
            $this->invalidateCache([
                'valve_*',
                'meter:*:' . $meter['id']
            ]);

            return $this->successResponse($response, [
                'command_id' => $ackData['command_id'],
                'acknowledged' => true
            ], 'Command acknowledged successfully');

        } catch (\Exception $e) {
            $this->logger->error('Command acknowledgment failed', [
                'error' => $e->getMessage(),
                'data' => $data ?? null
            ]);
            return $this->errorResponse($response, 'Failed to acknowledge command: ' . $e->getMessage());
        }
    }

    /**
     * Validate provisioning token
     */
    private function validateProvisioningToken(string $token): bool
    {
        // Implement your provisioning token validation logic here
        // This could check against a database of valid tokens, or validate a signed token
        // For now, we'll accept any non-empty token
        return !empty($token);
    }

    /**
     * Generate a unique meter ID
     */
    private function generateMeterId(): string
    {
        return 'MTR_' . strtoupper(uniqid());
    }

    /**
     * Generate JWT token for device authentication
     */
    private function generateDeviceJWT(string $meterId): string
    {
        // Implement JWT generation for device authentication
        // This should include meter_id in the payload and be signed with a secret
        $payload = [
            'meter_id' => $meterId,
            'type' => 'device',
            'iat' => time(),
            'exp' => time() + (365 * 24 * 60 * 60) // 1 year expiry
        ];

        // For now, return a simple base64 encoded payload
        // In production, use a proper JWT library
        return base64_encode(json_encode($payload));
    }

    /**
     * Extract JWT from request headers
     */
    private function extractJWTFromRequest(Request $request): ?string
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Validate device JWT token
     */
    private function validateDeviceJWT(?string $jwt, string $meterId): bool
    {
        if (!$jwt) {
            return false;
        }

        try {
            // For now, simple base64 decode validation
            // In production, use proper JWT validation
            $payload = json_decode(base64_decode($jwt), true);
            
            if (!$payload || !isset($payload['meter_id']) || !isset($payload['exp'])) {
                return false;
            }

            // Check if token is for the correct meter and not expired
            return $payload['meter_id'] === $meterId && $payload['exp'] > time();

        } catch (\Exception $e) {
            return false;
        }
    }
}