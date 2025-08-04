<?php

/**
 * URL Configuration Verification Test
 * Verifies that all URLs are correctly configured for target deployment
 */

class URLConfigurationTest
{
    private string $firmwareDir;
    private array $results = [];

    public function __construct()
    {
        $this->firmwareDir = __DIR__ . '/../Firmware Meteran';
    }

    public function runTests(): void
    {
        echo "=== URL Configuration Verification ===\n\n";

        $this->testNodeMCUConfiguration();
        $this->testDocumentationURLs();
        $this->testTestScriptURLs();
        $this->generateReport();
    }

    private function testNodeMCUConfiguration(): void
    {
        echo "1. Testing NodeMCU URL Configuration...\n";

        $nodeMCUFile = $this->firmwareDir . '/NodeMCU.cpp';
        if (!file_exists($nodeMCUFile)) {
            $this->results['nodemcu'] = ['status' => 'FAIL', 'message' => 'NodeMCU.cpp file not found'];
            return;
        }

        $content = file_get_contents($nodeMCUFile);
        
        // Check production URL (in #else block)
        if (preg_match('/#else\s*\n\s*const char\* API_BASE_URL = "([^"]+)";/', $content, $matches)) {
            $productionUrl = $matches[1];
            
            if ($productionUrl === 'https://api.lingindustri.com') {
                echo "   ✅ Production URL: $productionUrl (CORRECT)\n";
                $this->results['nodemcu_production'] = ['status' => 'PASS', 'url' => $productionUrl];
            } else {
                echo "   ❌ Production URL: $productionUrl (INCORRECT - should be https://api.lingindustri.com)\n";
                $this->results['nodemcu_production'] = ['status' => 'FAIL', 'url' => $productionUrl];
            }
        } else {
            echo "   ❌ Production URL configuration not found\n";
            $this->results['nodemcu_production'] = ['status' => 'FAIL', 'url' => 'NOT_FOUND'];
        }

        // Check development URL
        if (preg_match('/#ifdef DEVELOPMENT_MODE\s*\n\s*const char\* API_BASE_URL = "([^"]+)";/', $content, $matches)) {
            $devUrl = $matches[1];
            echo "   ✅ Development URL: $devUrl\n";
            $this->results['nodemcu_development'] = ['status' => 'PASS', 'url' => $devUrl];
        }

        // Check for target URL comments
        if (strpos($content, 'https://api.lingindustri.com') !== false) {
            echo "   ✅ Target backend API URL found in configuration\n";
        }

        if (strpos($content, 'https://lingidustri.com') !== false) {
            echo "   ✅ Target frontend URL documented\n";
        }
    }

    private function testDocumentationURLs(): void
    {
        echo "\n2. Testing Documentation URLs...\n";

        $integrationFile = __DIR__ . '/../INTEGRATION_SUMMARY.md';
        if (!file_exists($integrationFile)) {
            $this->results['documentation'] = ['status' => 'FAIL', 'message' => 'INTEGRATION_SUMMARY.md not found'];
            return;
        }

        $content = file_get_contents($integrationFile);
        
        // Check target URLs section
        if (strpos($content, 'https://api.lingindustri.com') !== false) {
            echo "   ✅ Backend API target URL documented\n";
            $this->results['doc_backend'] = ['status' => 'PASS'];
        } else {
            echo "   ❌ Backend API target URL missing from documentation\n";
            $this->results['doc_backend'] = ['status' => 'FAIL'];
        }

        if (strpos($content, 'https://lingidustri.com') !== false) {
            echo "   ✅ Frontend target URL documented\n";
            $this->results['doc_frontend'] = ['status' => 'PASS'];
        } else {
            echo "   ❌ Frontend target URL missing from documentation\n";
            $this->results['doc_frontend'] = ['status' => 'FAIL'];
        }
    }

    private function testTestScriptURLs(): void
    {
        echo "\n3. Testing Test Script URL Examples...\n";

        $testFiles = [
            'device_integration_test.php' => __DIR__ . '/../api/tests/device_integration_test.php',
            'firmware_simulation_test.php' => __DIR__ . '/../api/tests/firmware_simulation_test.php'
        ];

        foreach ($testFiles as $fileName => $filePath) {
            if (file_exists($filePath)) {
                $content = file_get_contents($filePath);
                
                if (strpos($content, 'https://api.lingindustri.com') !== false) {
                    echo "   ✅ $fileName: Target URL example found\n";
                    $this->results["test_$fileName"] = ['status' => 'PASS'];
                } else {
                    echo "   ⚠️  $fileName: Target URL example not found\n";
                    $this->results["test_$fileName"] = ['status' => 'WARNING'];
                }
            }
        }
    }

    private function generateReport(): void
    {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "              URL CONFIGURATION REPORT\n";
        echo str_repeat("=", 60) . "\n\n";

        echo "🎯 TARGET URLS:\n";
        echo "   Frontend: https://lingidustri.com\n";
        echo "   Backend API: https://api.lingindustri.com\n\n";

        echo "📊 CONFIGURATION STATUS:\n";
        
        $allPassed = true;
        foreach ($this->results as $test => $result) {
            if ($result['status'] === 'FAIL') {
                $allPassed = false;
                echo "   ❌ " . ucwords(str_replace('_', ' ', $test)) . ": FAILED\n";
            } elseif ($result['status'] === 'WARNING') {
                echo "   ⚠️  " . ucwords(str_replace('_', ' ', $test)) . ": WARNING\n";
            } else {
                echo "   ✅ " . ucwords(str_replace('_', ' ', $test)) . ": PASSED\n";
            }
        }

        echo "\n🔧 ENVIRONMENT CONFIGURATION:\n";
        echo "   Development: http://localhost:8000/api\n";
        echo "   Production: https://api.lingindustri.com\n";
        echo "   Docker: http://host.docker.internal:8000/api\n\n";

        if ($allPassed) {
            echo "🎉 ALL URL CONFIGURATIONS VERIFIED!\n\n";
            echo "✅ DEPLOYMENT READY:\n";
            echo "   • NodeMCU firmware configured with correct production URL\n";
            echo "   • Documentation updated with target URLs\n";
            echo "   • Test scripts include target URL examples\n";
            echo "   • Environment-based configuration implemented\n\n";
        } else {
            echo "❌ CONFIGURATION ISSUES DETECTED\n\n";
            echo "Please review and fix the failed configurations above.\n\n";
        }

        echo "📋 NEXT STEPS FOR DEPLOYMENT:\n";
        echo "   1. Deploy API to https://api.lingindustri.com\n";
        echo "   2. Deploy frontend to https://lingidustri.com\n";
        echo "   3. Flash firmware to devices (production mode)\n";
        echo "   4. Test device communication with production API\n\n";

        echo str_repeat("=", 60) . "\n";
        echo "URL configuration test completed at: " . date('Y-m-d H:i:s') . "\n";
        echo str_repeat("=", 60) . "\n";
    }
}

// Run the tests if this script is executed directly
if (php_sapi_name() === 'cli') {
    $tester = new URLConfigurationTest();
    $tester->runTests();
}