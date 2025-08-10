<?php

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

/**
 * OTA (Over-The-Air) Update Controller
 * Handles firmware updates for water meter devices
 */
class OTAController
{
    protected $container;
    protected $db;
    protected $logger;
    protected $jwtSecret;
    protected $firmwareDir;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->db = $container->get('db');
        $this->logger = $container->get('logger');
        $this->jwtSecret = $container->get('settings')['jwt']['secret'];
        $this->firmwareDir = __DIR__ . '/../../storage/firmware/';
        
        // Create firmware directory if it doesn't exist
        if (!is_dir($this->firmwareDir)) {
            mkdir($this->firmwareDir, 0755, true);
        }
    }

    /**
     * Download firmware binary
     * GET /ota/firmware.bin
     */
    public function downloadFirmware(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $deviceId = $params['device_id'] ?? null;
            $currentVersion = $params['version'] ?? '1.0.0';

            // Verify device authentication
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $response->withStatus(401);
            }

            if ($deviceId && $deviceData['device_id'] !== $deviceId) {
                return $response->withStatus(403);
            }

            // Get latest firmware for this device/client
            $stmt = $this->db->prepare("
                SELECT f.*, c.name as client_name
                FROM firmware_versions f
                JOIN clients c ON f.client_id = c.id
                WHERE f.client_id = ? AND f.status = 'active'
                ORDER BY f.version_number DESC, f.created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$deviceData['client_id']]);
            $firmware = $stmt->fetch();

            if (!$firmware) {
                // No firmware available
                return $response->withStatus(404);
            }

            // Check if device already has this version
            if (version_compare($currentVersion, $firmware['version_number'], '>=')) {
                // Device is up to date
                return $response->withStatus(304); // Not Modified
            }

            $firmwarePath = $this->firmwareDir . $firmware['file_path'];
            
            if (!file_exists($firmwarePath)) {
                $this->logger->error("Firmware file not found", [
                    'file_path' => $firmwarePath,
                    'firmware_id' => $firmware['id']
                ]);
                return $response->withStatus(404);
            }

            // Log OTA update attempt
            $this->logOTAUpdate($deviceData['meter_id'], $firmware['id'], 'download_started');

            // Stream the firmware file
            $fileSize = filesize($firmwarePath);
            $response = $response
                ->withHeader('Content-Type', 'application/octet-stream')
                ->withHeader('Content-Length', (string)$fileSize)
                ->withHeader('Content-Disposition', 'attachment; filename="firmware.bin"')
                ->withHeader('X-Firmware-Version', $firmware['version_number'])
                ->withHeader('X-Firmware-Size', (string)$fileSize)
                ->withHeader('X-Firmware-Checksum', $firmware['checksum'] ?? '');

            $stream = $response->getBody();
            $handle = fopen($firmwarePath, 'rb');
            
            if ($handle) {
                while (!feof($handle)) {
                    $chunk = fread($handle, 8192);
                    $stream->write($chunk);
                }
                fclose($handle);
            }

            $this->logger->info("Firmware download initiated", [
                'device_id' => $deviceData['device_id'],
                'meter_id' => $deviceData['meter_id'],
                'firmware_version' => $firmware['version_number'],
                'file_size' => $fileSize
            ]);

            return $response;

        } catch (Exception $e) {
            $this->logger->error("Firmware download failed", [
                'error' => $e->getMessage(),
                'device_id' => $deviceId ?? 'unknown'
            ]);

            return $response->withStatus(500);
        }
    }

    /**
     * Check for firmware updates
     * GET /ota/check
     */
    public function checkUpdate(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $currentVersion = $params['version'] ?? '1.0.0';

            // Verify device authentication
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Authentication required'
                ], 401);
            }

            // Get latest firmware for this client
            $stmt = $this->db->prepare("
                SELECT version_number, file_size, checksum, release_notes, created_at
                FROM firmware_versions
                WHERE client_id = ? AND status = 'active'
                ORDER BY version_number DESC, created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$deviceData['client_id']]);
            $firmware = $stmt->fetch();

            if (!$firmware) {
                return $this->jsonResponse($response, [
                    'status' => 'success',
                    'update_available' => false,
                    'message' => 'No firmware available'
                ]);
            }

            $updateAvailable = version_compare($currentVersion, $firmware['version_number'], '<');

            $responseData = [
                'status' => 'success',
                'update_available' => $updateAvailable,
                'current_version' => $currentVersion,
                'latest_version' => $firmware['version_number']
            ];

            if ($updateAvailable) {
                $responseData['firmware_info'] = [
                    'version' => $firmware['version_number'],
                    'size' => (int)$firmware['file_size'],
                    'checksum' => $firmware['checksum'],
                    'release_notes' => $firmware['release_notes'],
                    'release_date' => $firmware['created_at']
                ];
            }

            return $this->jsonResponse($response, $responseData);

        } catch (Exception $e) {
            $this->logger->error("Check update failed", [
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Report OTA update status
     * POST /ota/status
     * 
     * Expected payload:
     * {
     *   "status": "success|failed",
     *   "version": "1.2.0",
     *   "error_message": "Optional error message"
     * }
     */
    public function reportStatus(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            
            if (!isset($data['status']) || !isset($data['version'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Missing required fields: status, version'
                ], 400);
            }

            // Verify device authentication
            $deviceData = $this->verifyDeviceToken($request);
            if (!$deviceData) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Authentication required'
                ], 401);
            }

            $status = $data['status'];
            $version = $data['version'];
            $errorMessage = $data['error_message'] ?? null;

            // Get firmware version ID
            $stmt = $this->db->prepare("
                SELECT id FROM firmware_versions
                WHERE client_id = ? AND version_number = ?
            ");
            $stmt->execute([$deviceData['client_id'], $version]);
            $firmware = $stmt->fetch();

            $firmwareId = $firmware ? $firmware['id'] : null;

            // Log OTA update result
            $this->logOTAUpdate($deviceData['meter_id'], $firmwareId, $status, $errorMessage);

            // Update device firmware version if successful
            if ($status === 'success') {
                $stmt = $this->db->prepare("
                    UPDATE meters 
                    SET firmware_version = ?, updated_at = NOW()
                    WHERE meter_id = ?
                ");
                $stmt->execute([$version, $deviceData['meter_id']]);
            }

            $this->logger->info("OTA status reported", [
                'device_id' => $deviceData['device_id'],
                'meter_id' => $deviceData['meter_id'],
                'status' => $status,
                'version' => $version,
                'error' => $errorMessage
            ]);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Status reported successfully'
            ]);

        } catch (Exception $e) {
            $this->logger->error("Report OTA status failed", [
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
     * Upload firmware (Admin only)
     * POST /ota/upload
     */
    public function uploadFirmware(Request $request, Response $response): Response
    {
        try {
            // This would typically require admin authentication
            // For now, we'll create a placeholder implementation
            
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Firmware upload endpoint not implemented yet'
            ], 501);

        } catch (Exception $e) {
            $this->logger->error("Firmware upload failed", [
                'error' => $e->getMessage()
            ]);

            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
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
     * Log OTA update activity
     */
    private function logOTAUpdate(string $meterId, ?int $firmwareId, string $status, ?string $errorMessage = null): void
    {
        try {
            // Get meter database ID
            $stmt = $this->db->prepare("SELECT id FROM meters WHERE meter_id = ?");
            $stmt->execute([$meterId]);
            $meter = $stmt->fetch();

            if (!$meter) {
                return;
            }

            $stmt = $this->db->prepare("
                INSERT INTO ota_updates (
                    meter_id, firmware_version_id, status, error_message, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $meter['id'],
                $firmwareId,
                $status,
                $errorMessage
            ]);
        } catch (Exception $e) {
            $this->logger->error("Failed to log OTA update", [
                'meter_id' => $meterId,
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