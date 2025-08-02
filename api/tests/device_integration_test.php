<?php

/**
 * Device Integration Test Script
 * Tests the communication between Arduino/NodeMCU firmware and the API
 */

require_once __DIR__ . '/../vendor/autoload.php';

class DeviceIntegrationTest
{
    private string $baseUrl;
    private string $testDeviceId = 'TEST_ESP8266_001';
    private string $testMeterId = 'MTR001';
    private string $jwtToken = '';

    public function __construct(string $baseUrl = 'http://localhost:8000/api')
    {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public function runAllTests(): void
    {
        echo "=== Device Integration Test Suite ===\n\n";

        try {
            $this->testDeviceRegistration();
            $this->testGetCredit();
            $this->testSubmitMeterReading();
            $this->testGetCommands();
            $this->testAcknowledgeCommand();
            
            echo "\n✅ All tests passed successfully!\n";
        } catch (Exception $e) {
            echo "\n❌ Test failed: " . $e->getMessage() . "\n";
            echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
        }
    }

    private function testDeviceRegistration(): void
    {
        echo "1. Testing Device Registration...\n";

        $data = [
            'device_id' => $this->testDeviceId,
            'provisioning_token' => 'test_provisioning_token',
            'firmware_version' => '1.0.0',
            'hardware_version' => '1.0.0'
        ];

        $response = $this->makeRequest('POST', '/device/register_device.php', $data);
        
        if ($response['status'] !== 'success') {
            throw new Exception("Device registration failed: " . ($response['message'] ?? 'Unknown error'));
        }

        if (!isset($response['jwt_token'])) {
            throw new Exception("JWT token not returned in registration response");
        }

        $this->jwtToken = $response['jwt_token'];
        echo "   ✅ Device registered successfully\n";
        echo "   📝 JWT Token: " . substr($this->jwtToken, 0, 20) . "...\n";
    }

    private function testGetCredit(): void
    {
        echo "\n2. Testing Get Credit...\n";

        $response = $this->makeAuthenticatedRequest('GET', '/device/credit.php');
        
        if ($response['status'] !== 'success') {
            throw new Exception("Get credit failed: " . ($response['message'] ?? 'Unknown error'));
        }

        $requiredFields = ['data_pulsa', 'tarif_per_m3', 'is_unlocked'];
        foreach ($requiredFields as $field) {
            if (!isset($response[$field])) {
                throw new Exception("Missing field in credit response: $field");
            }
        }

        echo "   ✅ Credit retrieved successfully\n";
        echo "   💰 Balance: Rp " . number_format($response['data_pulsa'], 2) . "\n";
        echo "   💧 Tariff: Rp " . number_format($response['tarif_per_m3'], 2) . "/m³\n";
        echo "   🔓 Unlocked: " . ($response['is_unlocked'] ? 'Yes' : 'No') . "\n";
    }

    private function testSubmitMeterReading(): void
    {
        echo "\n3. Testing Submit Meter Reading...\n";

        $data = [
            'flow_rate' => 2.5,
            'meter_reading' => 123.456,
            'voltage' => 3.7,
            'door_status' => 0,
            'valve_status' => 'open',
            'status_message' => 'normal'
        ];

        $response = $this->makeAuthenticatedRequest('POST', '/device/MeterReading.php', $data);
        
        if ($response['status'] !== 'success') {
            throw new Exception("Submit meter reading failed: " . ($response['message'] ?? 'Unknown error'));
        }

        echo "   ✅ Meter reading submitted successfully\n";
        echo "   📊 Flow Rate: " . $data['flow_rate'] . " LPM\n";
        echo "   📏 Reading: " . $data['meter_reading'] . " m³\n";
        echo "   🔋 Voltage: " . $data['voltage'] . "V\n";
    }

    private function testGetCommands(): void
    {
        echo "\n4. Testing Get Commands...\n";

        $response = $this->makeAuthenticatedRequest('GET', '/device/get_commands.php');
        
        if ($response['status'] !== 'success') {
            throw new Exception("Get commands failed: " . ($response['message'] ?? 'Unknown error'));
        }

        if (!isset($response['commands'])) {
            throw new Exception("Commands array not found in response");
        }

        echo "   ✅ Commands retrieved successfully\n";
        echo "   📋 Pending commands: " . count($response['commands']) . "\n";

        if (!empty($response['commands'])) {
            $command = $response['commands'][0];
            echo "   🎯 First command: " . ($command['command_type'] ?? 'Unknown') . "\n";
        }
    }

    private function testAcknowledgeCommand(): void
    {
        echo "\n5. Testing Acknowledge Command...\n";

        // First, try to get a command to acknowledge
        $commandsResponse = $this->makeAuthenticatedRequest('GET', '/device/get_commands.php');
        
        if (empty($commandsResponse['commands'])) {
            echo "   ⚠️  No pending commands to acknowledge\n";
            return;
        }

        $command = $commandsResponse['commands'][0];
        $commandId = $command['command_id'];

        $data = [
            'command_id' => $commandId,
            'status' => 'acknowledged',
            'notes' => 'Command executed successfully by test',
            'valve_status' => 'open'
        ];

        $response = $this->makeAuthenticatedRequest('POST', '/device/ack_command.php', $data);
        
        if ($response['status'] !== 'success') {
            throw new Exception("Acknowledge command failed: " . ($response['message'] ?? 'Unknown error'));
        }

        echo "   ✅ Command acknowledged successfully\n";
        echo "   🆔 Command ID: $commandId\n";
    }

    private function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30
        ]);

        if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL error: $error");
        }

        if ($httpCode >= 400) {
            throw new Exception("HTTP error $httpCode: $response");
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: $response");
        }

        return $decoded;
    }

    private function makeAuthenticatedRequest(string $method, string $endpoint, array $data = []): array
    {
        if (empty($this->jwtToken)) {
            throw new Exception("No JWT token available. Run device registration first.");
        }

        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $this->jwtToken
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30
        ]);

        if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception("cURL error: $error");
        }

        if ($httpCode >= 400) {
            throw new Exception("HTTP error $httpCode: $response");
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: $response");
        }

        return $decoded;
    }
}

// Run the tests if this script is executed directly
if (php_sapi_name() === 'cli') {
    $baseUrl = $argv[1] ?? 'http://localhost:8000/api';
    
    echo "Testing API at: $baseUrl\n\n";
    
    $tester = new DeviceIntegrationTest($baseUrl);
    $tester->runAllTests();
}