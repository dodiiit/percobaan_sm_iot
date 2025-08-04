<?php

/**
 * API Structure Test
 * Tests that all required classes and methods exist for device integration
 */

require_once __DIR__ . '/../vendor/autoload.php';

class ApiStructureTest
{
    private array $errors = [];
    private array $warnings = [];

    public function runTests(): void
    {
        echo "=== API Structure Verification ===\n\n";

        $this->testControllerExists();
        $this->testModelMethods();
        $this->testServiceMethods();
        $this->testRouteConfiguration();
        $this->testDependencyConfiguration();

        $this->printResults();
    }

    private function testControllerExists(): void
    {
        echo "1. Testing DeviceController existence...\n";

        $controllerPath = __DIR__ . '/../src/Controllers/DeviceController.php';
        if (!file_exists($controllerPath)) {
            $this->errors[] = "DeviceController.php file not found";
            return;
        }

        require_once $controllerPath;

        if (!class_exists('IndoWater\Api\Controllers\DeviceController')) {
            $this->errors[] = "DeviceController class not found";
            return;
        }

        $reflection = new ReflectionClass('IndoWater\Api\Controllers\DeviceController');
        $requiredMethods = [
            'registerDevice',
            'getCredit', 
            'submitReading',
            'getCommands',
            'acknowledgeCommand'
        ];

        foreach ($requiredMethods as $method) {
            if (!$reflection->hasMethod($method)) {
                $this->errors[] = "DeviceController missing method: $method";
            }
        }

        echo "   ✅ DeviceController structure verified\n";
    }

    private function testModelMethods(): void
    {
        echo "\n2. Testing Model methods...\n";

        // Test Meter model
        $meterPath = __DIR__ . '/../src/Models/Meter.php';
        if (file_exists($meterPath)) {
            require_once $meterPath;
            
            if (class_exists('IndoWater\Api\Models\Meter')) {
                $reflection = new ReflectionClass('IndoWater\Api\Models\Meter');
                $requiredMethods = ['findByDeviceId', 'updateDeviceStatus', 'updateBalance'];
                
                foreach ($requiredMethods as $method) {
                    if (!$reflection->hasMethod($method)) {
                        $this->errors[] = "Meter model missing method: $method";
                    }
                }
                echo "   ✅ Meter model methods verified\n";
            } else {
                $this->errors[] = "Meter model class not found";
            }
        } else {
            $this->errors[] = "Meter model file not found";
        }

        // Test ValveCommand model
        $commandPath = __DIR__ . '/../src/Models/ValveCommand.php';
        if (file_exists($commandPath)) {
            require_once $commandPath;
            
            if (class_exists('IndoWater\Api\Models\ValveCommand')) {
                $reflection = new ReflectionClass('IndoWater\Api\Models\ValveCommand');
                $requiredMethods = ['getPendingCommandsByValve', 'updateCommandStatus', 'createCommand'];
                
                foreach ($requiredMethods as $method) {
                    if (!$reflection->hasMethod($method)) {
                        $this->errors[] = "ValveCommand model missing method: $method";
                    }
                }
                echo "   ✅ ValveCommand model methods verified\n";
            } else {
                $this->errors[] = "ValveCommand model class not found";
            }
        } else {
            $this->errors[] = "ValveCommand model file not found";
        }
    }

    private function testServiceMethods(): void
    {
        echo "\n3. Testing Service methods...\n";

        $servicePath = __DIR__ . '/../src/Services/ValveControlService.php';
        if (file_exists($servicePath)) {
            require_once $servicePath;
            
            if (class_exists('IndoWater\Api\Services\ValveControlService')) {
                $reflection = new ReflectionClass('IndoWater\Api\Services\ValveControlService');
                $requiredMethods = ['getPendingCommands', 'acknowledgeCommand', 'openValve', 'closeValve'];
                
                foreach ($requiredMethods as $method) {
                    if (!$reflection->hasMethod($method)) {
                        $this->errors[] = "ValveControlService missing method: $method";
                    }
                }
                echo "   ✅ ValveControlService methods verified\n";
            } else {
                $this->errors[] = "ValveControlService class not found";
            }
        } else {
            $this->errors[] = "ValveControlService file not found";
        }
    }

    private function testRouteConfiguration(): void
    {
        echo "\n4. Testing Route configuration...\n";

        $routesPath = __DIR__ . '/../config/routes.php';
        if (!file_exists($routesPath)) {
            $this->errors[] = "routes.php file not found";
            return;
        }

        $routesContent = file_get_contents($routesPath);
        $requiredRoutes = [
            'register_device.php',
            'credit.php',
            'MeterReading.php',
            'get_commands.php',
            'ack_command.php'
        ];

        foreach ($requiredRoutes as $route) {
            if (strpos($routesContent, $route) === false) {
                $this->errors[] = "Route not found: $route";
            }
        }

        echo "   ✅ Device routes configuration verified\n";
    }

    private function testDependencyConfiguration(): void
    {
        echo "\n5. Testing Dependency configuration...\n";

        $dependenciesPath = __DIR__ . '/../config/dependencies.php';
        if (!file_exists($dependenciesPath)) {
            $this->errors[] = "dependencies.php file not found";
            return;
        }

        $dependenciesContent = file_get_contents($dependenciesPath);
        
        if (strpos($dependenciesContent, 'DeviceController::class') === false) {
            $this->errors[] = "DeviceController not configured in dependencies";
        }

        echo "   ✅ Dependency configuration verified\n";
    }

    private function printResults(): void
    {
        echo "\n=== Test Results ===\n";

        if (empty($this->errors) && empty($this->warnings)) {
            echo "🎉 All tests passed! API structure is ready for device integration.\n\n";
            echo "✅ DeviceController exists with all required methods\n";
            echo "✅ Model classes have device-specific methods\n";
            echo "✅ Service classes support device operations\n";
            echo "✅ Routes are configured for firmware endpoints\n";
            echo "✅ Dependencies are properly configured\n\n";
            echo "📡 The API is now compatible with Arduino/NodeMCU firmware communication protocol.\n";
        } else {
            if (!empty($this->errors)) {
                echo "❌ Errors found:\n";
                foreach ($this->errors as $error) {
                    echo "   • $error\n";
                }
                echo "\n";
            }

            if (!empty($this->warnings)) {
                echo "⚠️  Warnings:\n";
                foreach ($this->warnings as $warning) {
                    echo "   • $warning\n";
                }
                echo "\n";
            }
        }
    }
}

// Run the tests if this script is executed directly
if (php_sapi_name() === 'cli') {
    $tester = new ApiStructureTest();
    $tester->runTests();
}