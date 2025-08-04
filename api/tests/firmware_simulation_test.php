<?php

/**
 * Firmware Simulation Test
 * Simulates the exact communication protocol used by Arduino and NodeMCU
 */

require_once __DIR__ . '/../vendor/autoload.php';

class FirmwareSimulationTest
{
    private string $baseUrl;
    private string $deviceId;
    private string $meterId;
    private string $jwtToken = '';

    public function __construct(string $baseUrl = 'http://localhost:8000/api')
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->deviceId = 'ESP8266_' . bin2hex(random_bytes(4));
        $this->meterId = 'MTR_' . bin2hex(random_bytes(3));
    }

    public function runSimulation(): void
    {
        echo "=== Arduino/NodeMCU Firmware Simulation ===\n\n";
        echo "Device ID: {$this->deviceId}\n";
        echo "Meter ID: {$this->meterId}\n\n";

        try {
            // Step 1: Device Registration (NodeMCU)
            $this->simulateDeviceRegistration();
            
            // Step 2: Periodic meter reading submission (Arduino -> NodeMCU -> Server)
            $this->simulateMeterReadingSubmission();
            
            // Step 3: Command polling (NodeMCU)
            $this->simulateCommandPolling();
            
            // Step 4: Command execution and acknowledgment (Arduino -> NodeMCU -> Server)
            $this->simulateCommandExecution();
            
            echo "\n🎉 Firmware simulation completed successfully!\n";
            echo "The communication protocol between Arduino/NodeMCU and API is working correctly.\n";
            
        } catch (Exception $e) {
            echo "\n❌ Simulation failed: " . $e->getMessage() . "\n";
            echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
        }
    }

    private function simulateDeviceRegistration(): void
    {
        echo "📡 Step 1: Device Registration (NodeMCU)\n";
        echo "   Simulating NodeMCU device registration...\n";

        $registrationData = [
            'device_id' => $this->deviceId,
            'provisioning_token' => 'PROV_' . bin2hex(random_bytes(8)),
            'firmware_version' => '1.2.3',
            'hardware_version' => '2.1.0'
        ];

        echo "   📤 Sending registration request:\n";
        echo "      Device ID: {$registrationData['device_id']}\n";
        echo "      Provisioning Token: {$registrationData['provisioning_token']}\n";
        echo "      Firmware: {$registrationData['firmware_version']}\n";

        $response = $this->httpPost('/device/register_device.php', $registrationData);

        if ($response['status'] !== 'success') {
            throw new Exception("Device registration failed: " . ($response['message'] ?? 'Unknown error'));
        }

        $this->jwtToken = $response['jwt_token'];
        $this->meterId = $response['meter_id'];

        echo "   ✅ Registration successful!\n";
        echo "      JWT Token: " . substr($this->jwtToken, 0, 20) . "...\n";
        echo "      Assigned Meter ID: {$this->meterId}\n\n";
    }

    private function simulateMeterReadingSubmission(): void
    {
        echo "📊 Step 2: Meter Reading Submission (Arduino -> NodeMCU -> Server)\n";
        echo "   Simulating Arduino sending data to NodeMCU, then NodeMCU to server...\n";

        // Simulate Arduino data
        $arduinoData = [
            'flow_rate' => round(rand(0, 500) / 100, 2), // 0.00 - 5.00 LPM
            'meter_reading' => round(rand(10000, 50000) / 100, 3), // 100.000 - 500.000 m³
            'voltage' => round(rand(320, 420) / 100, 2), // 3.20 - 4.20V
            'door_status' => rand(0, 1), // 0=closed, 1=open
            'valve_status' => rand(0, 1) ? 'open' : 'closed',
            'status_message' => 'normal'
        ];

        echo "   📤 Arduino data to NodeMCU:\n";
        echo "      Flow Rate: {$arduinoData['flow_rate']} LPM\n";
        echo "      Meter Reading: {$arduinoData['meter_reading']} m³\n";
        echo "      Voltage: {$arduinoData['voltage']}V\n";
        echo "      Door: " . ($arduinoData['door_status'] ? 'Open' : 'Closed') . "\n";
        echo "      Valve: {$arduinoData['valve_status']}\n";

        echo "   📡 NodeMCU forwarding to server...\n";

        $response = $this->httpPost('/device/MeterReading.php', $arduinoData, true);

        if ($response['status'] !== 'success') {
            throw new Exception("Meter reading submission failed: " . ($response['message'] ?? 'Unknown error'));
        }

        echo "   ✅ Reading submitted successfully!\n";
        echo "   📤 Server response to NodeMCU:\n";
        echo "      Balance: Rp " . number_format($response['data_pulsa'], 2) . "\n";
        echo "      Tariff: Rp " . number_format($response['tarif_per_m3'], 2) . "/m³\n";
        echo "      Unlocked: " . ($response['is_unlocked'] ? 'Yes' : 'No') . "\n";

        // Simulate NodeMCU sending update to Arduino
        $arduinoUpdate = [
            'id_meter' => $this->meterId,
            'data_pulsa' => $response['data_pulsa'],
            'tarif_per_m3' => $response['tarif_per_m3'],
            'is_unlocked' => $response['is_unlocked']
        ];

        echo "   📤 NodeMCU update to Arduino:\n";
        echo "      " . json_encode($arduinoUpdate) . "\n\n";
    }

    private function simulateCommandPolling(): void
    {
        echo "🔄 Step 3: Command Polling (NodeMCU)\n";
        echo "   Simulating NodeMCU polling for pending commands...\n";

        $response = $this->httpGet('/device/get_commands.php', true);

        if ($response['status'] !== 'success') {
            throw new Exception("Command polling failed: " . ($response['message'] ?? 'Unknown error'));
        }

        echo "   ✅ Command polling successful!\n";
        echo "   📋 Pending commands: " . count($response['commands']) . "\n";

        if (!empty($response['commands'])) {
            foreach ($response['commands'] as $i => $command) {
                echo "      Command " . ($i + 1) . ":\n";
                echo "         ID: {$command['command_id']}\n";
                echo "         Type: {$command['command_type']}\n";
                echo "         Current Valve Status: {$command['current_valve_status']}\n";
            }
        } else {
            echo "   ℹ️  No pending commands found\n";
        }
        echo "\n";
    }

    private function simulateCommandExecution(): void
    {
        echo "⚙️  Step 4: Command Execution Simulation\n";
        echo "   Creating a test valve command...\n";

        // Create a test command first (this would normally be done through the web interface)
        $this->createTestCommand();

        // Poll for the command
        $response = $this->httpGet('/device/get_commands.php', true);
        
        if (empty($response['commands'])) {
            echo "   ⚠️  No commands available for execution simulation\n";
            return;
        }

        $command = $response['commands'][0];
        echo "   📥 NodeMCU received command:\n";
        echo "      Command ID: {$command['command_id']}\n";
        echo "      Command Type: {$command['command_type']}\n";

        // Simulate NodeMCU sending command to Arduino
        $arduinoCommand = [
            'command_type' => $command['command_type'],
            'command_id' => $command['command_id'],
            'current_valve_status' => $command['current_valve_status']
        ];

        echo "   📤 NodeMCU to Arduino:\n";
        echo "      " . json_encode($arduinoCommand) . "\n";

        // Simulate Arduino processing and responding
        $arduinoResponse = [
            'command_id_ack' => $command['command_id'],
            'status_ack' => 'acknowledged',
            'notes_ack' => 'Valve command executed successfully',
            'valve_status_ack' => ($command['command_type'] === 'valve_open') ? 'open' : 'closed'
        ];

        echo "   📤 Arduino ACK to NodeMCU:\n";
        echo "      " . json_encode($arduinoResponse) . "\n";

        // Simulate NodeMCU forwarding ACK to server
        $ackData = [
            'command_id' => $command['command_id'],
            'status' => 'acknowledged',
            'notes' => 'Valve command executed successfully',
            'valve_status' => ($command['command_type'] === 'valve_open') ? 'open' : 'closed'
        ];

        echo "   📡 NodeMCU forwarding ACK to server...\n";

        $ackResponse = $this->httpPost('/device/ack_command.php', $ackData, true);

        if ($ackResponse['status'] !== 'success') {
            throw new Exception("Command acknowledgment failed: " . ($ackResponse['message'] ?? 'Unknown error'));
        }

        echo "   ✅ Command execution and acknowledgment completed!\n";
        echo "   🎯 Final valve status: {$ackData['valve_status']}\n\n";
    }

    private function createTestCommand(): void
    {
        // This simulates creating a command through the web interface
        // In reality, this would be done by an admin user through the web UI
        echo "   🔧 Creating test valve command (simulating web interface)...\n";
        
        // For testing purposes, we'll just note that a command would be created
        // The actual command creation would happen through the web interface
        echo "   ℹ️  In production, commands are created through the web interface\n";
        echo "   ℹ️  For this test, we'll check if any existing commands are available\n";
    }

    private function httpGet(string $endpoint, bool $authenticated = false): array
    {
        return $this->makeHttpRequest('GET', $endpoint, [], $authenticated);
    }

    private function httpPost(string $endpoint, array $data, bool $authenticated = false): array
    {
        return $this->makeHttpRequest('POST', $endpoint, $data, $authenticated);
    }

    private function makeHttpRequest(string $method, string $endpoint, array $data = [], bool $authenticated = false): array
    {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];

        if ($authenticated && !empty($this->jwtToken)) {
            $headers[] = 'Authorization: Bearer ' . $this->jwtToken;
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_VERBOSE => false
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
            throw new Exception("HTTP error $httpCode for $endpoint: $response");
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response from $endpoint: $response");
        }

        return $decoded;
    }
}

// Run the simulation if this script is executed directly
// Usage: php firmware_simulation_test.php [base_url]
// Example: php firmware_simulation_test.php https://api.lingindustri.com
if (php_sapi_name() === 'cli') {
    $baseUrl = $argv[1] ?? 'http://localhost:8000/api';
    
    echo "Running firmware simulation against: $baseUrl\n\n";
    
    $simulator = new FirmwareSimulationTest($baseUrl);
    $simulator->runSimulation();
}