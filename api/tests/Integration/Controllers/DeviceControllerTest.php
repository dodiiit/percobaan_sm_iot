<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Integration\Controllers;

use IndoWater\Api\Tests\Integration\IntegrationTestCase;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\ResponseFactory;

class DeviceControllerTest extends IntegrationTestCase
{
    private string $testDeviceId = 'TEST_ESP8266_001';
    private string $testMeterId = 'MTR001';
    private string $testJwtToken;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test meter and device data
        $this->createTestMeter();
        $this->testJwtToken = $this->generateTestJwtToken();
    }

    protected function tearDown(): void
    {
        // Clean up test data
        $this->cleanupTestData();
        parent::tearDown();
    }

    public function testDeviceRegistration(): void
    {
        $requestData = [
            'device_id' => $this->testDeviceId,
            'provisioning_token' => 'test_provisioning_token',
            'firmware_version' => '1.0.0',
            'hardware_version' => '1.0.0'
        ];

        $request = $this->createJsonRequest('POST', '/device/register_device.php', $requestData);
        $response = $this->app->handle($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $responseData['status']);
        $this->assertArrayHasKey('jwt_token', $responseData);
        $this->assertArrayHasKey('meter_id', $responseData);
        $this->assertEquals($this->testMeterId, $responseData['meter_id']);
    }

    public function testGetCredit(): void
    {
        $request = $this->createAuthenticatedRequest('GET', '/device/credit.php');
        $response = $this->app->handle($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $responseData['status']);
        $this->assertArrayHasKey('data_pulsa', $responseData);
        $this->assertArrayHasKey('tarif_per_m3', $responseData);
        $this->assertArrayHasKey('is_unlocked', $responseData);
    }

    public function testSubmitMeterReading(): void
    {
        $requestData = [
            'flow_rate' => 2.5,
            'meter_reading' => 123.456,
            'voltage' => 3.7,
            'door_status' => 0,
            'valve_status' => 'open',
            'status_message' => 'normal'
        ];

        $request = $this->createAuthenticatedJsonRequest('POST', '/device/MeterReading.php', $requestData);
        $response = $this->app->handle($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $responseData['status']);
        $this->assertArrayHasKey('data_pulsa', $responseData);
        $this->assertArrayHasKey('tarif_per_m3', $responseData);
        $this->assertArrayHasKey('is_unlocked', $responseData);
    }

    public function testGetCommands(): void
    {
        // First create a test command
        $this->createTestValveCommand();

        $request = $this->createAuthenticatedRequest('GET', '/device/get_commands.php');
        $response = $this->app->handle($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $responseData['status']);
        $this->assertArrayHasKey('commands', $responseData);
        
        if (!empty($responseData['commands'])) {
            $command = $responseData['commands'][0];
            $this->assertArrayHasKey('command_id', $command);
            $this->assertArrayHasKey('command_type', $command);
            $this->assertArrayHasKey('current_valve_status', $command);
        }
    }

    public function testAcknowledgeCommand(): void
    {
        // First create a test command
        $commandId = $this->createTestValveCommand();

        $requestData = [
            'command_id' => $commandId,
            'status' => 'acknowledged',
            'notes' => 'Command executed successfully',
            'valve_status' => 'open'
        ];

        $request = $this->createAuthenticatedJsonRequest('POST', '/device/ack_command.php', $requestData);
        $response = $this->app->handle($request);

        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $responseData['status']);
    }

    public function testInvalidJwtToken(): void
    {
        $request = $this->createRequest('GET', '/device/credit.php')
            ->withHeader('Authorization', 'Bearer invalid_token');
        
        $response = $this->app->handle($request);
        $this->assertEquals(401, $response->getStatusCode());
    }

    public function testMissingDeviceId(): void
    {
        $requestData = [
            'provisioning_token' => 'test_token',
            'firmware_version' => '1.0.0'
        ];

        $request = $this->createJsonRequest('POST', '/device/register_device.php', $requestData);
        $response = $this->app->handle($request);

        $this->assertEquals(400, $response->getStatusCode());
    }

    private function createTestMeter(): void
    {
        $db = $this->container->get(\PDO::class);
        
        // Create test client
        $clientId = $this->generateUuid();
        $stmt = $db->prepare("INSERT INTO clients (id, company_name, email, phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$clientId, 'Test Company', 'test@example.com', '1234567890']);

        // Create test property
        $propertyId = $this->generateUuid();
        $stmt = $db->prepare("INSERT INTO properties (id, client_id, name, address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$propertyId, $clientId, 'Test Property', 'Test Address']);

        // Create test meter
        $meterId = $this->generateUuid();
        $stmt = $db->prepare("
            INSERT INTO meters (id, meter_id, property_id, device_id, status, last_credit, valve_status, is_unlocked) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $meterId, 
            $this->testMeterId, 
            $propertyId, 
            $this->testDeviceId, 
            'active', 
            50000.00, 
            'closed', 
            false
        ]);

        // Create test valve
        $valveId = $this->generateUuid();
        $stmt = $db->prepare("
            INSERT INTO valves (id, valve_id, meter_id, property_id, valve_type, valve_model, valve_serial, installation_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $valveId,
            'VLV_' . $this->testDeviceId,
            $meterId,
            $propertyId,
            'main',
            'Test Valve',
            'VLV001',
            date('Y-m-d')
        ]);
    }

    private function createTestValveCommand(): string
    {
        $db = $this->container->get(\PDO::class);
        
        // Get meter ID
        $stmt = $db->prepare("SELECT id FROM meters WHERE meter_id = ?");
        $stmt->execute([$this->testMeterId]);
        $meter = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Get valve ID
        $stmt = $db->prepare("SELECT id FROM valves WHERE meter_id = ?");
        $stmt->execute([$meter['id']]);
        $valve = $stmt->fetch(\PDO::FETCH_ASSOC);

        // Create test user
        $userId = $this->generateUuid();
        $stmt = $db->prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, 'Test User', 'testuser@example.com', 'admin']);

        // Create test command
        $commandId = $this->generateUuid();
        $stmt = $db->prepare("
            INSERT INTO valve_commands (id, valve_id, command_type, initiated_by, reason, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $commandId,
            $valve['id'],
            'valve_open',
            $userId,
            'Test command',
            'pending'
        ]);

        return $commandId;
    }

    private function generateTestJwtToken(): string
    {
        // Simple test JWT token - in production this should use proper JWT library
        return base64_encode(json_encode([
            'device_id' => $this->testDeviceId,
            'meter_id' => $this->testMeterId,
            'exp' => time() + 3600
        ]));
    }

    private function createAuthenticatedRequest(string $method, string $uri): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->createRequest($method, $uri)
            ->withHeader('Authorization', 'Bearer ' . $this->testJwtToken);
    }

    private function createAuthenticatedJsonRequest(string $method, string $uri, array $data): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->createJsonRequest($method, $uri, $data)
            ->withHeader('Authorization', 'Bearer ' . $this->testJwtToken);
    }

    private function cleanupTestData(): void
    {
        $db = $this->container->get(\PDO::class);
        
        // Clean up in reverse order due to foreign key constraints
        $db->exec("DELETE FROM valve_commands WHERE id LIKE 'test_%'");
        $db->exec("DELETE FROM valves WHERE valve_serial = 'VLV001'");
        $db->exec("DELETE FROM meters WHERE meter_id = '{$this->testMeterId}'");
        $db->exec("DELETE FROM properties WHERE name = 'Test Property'");
        $db->exec("DELETE FROM clients WHERE company_name = 'Test Company'");
        $db->exec("DELETE FROM users WHERE email = 'testuser@example.com'");
    }

    private function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}