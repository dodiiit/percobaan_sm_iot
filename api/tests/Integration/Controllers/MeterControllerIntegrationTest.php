<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Integration\Controllers;

use IndoWater\Api\Tests\Integration\IntegrationTestCase;
use Faker\Factory as Faker;

class MeterControllerIntegrationTest extends IntegrationTestCase
{
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->faker = Faker::create();
    }

    public function testGetMetersWithCaching(): void
    {
        // Create test data
        $this->createTestMeter();
        
        // First request - should be cache miss
        $response = $this->request('GET', '/api/meters');
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
        $this->assertNotEmpty($response->getHeaderLine('Cache-Control'));
        
        $data = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('data', $data);
        
        // Second request - should be cache hit
        $response2 = $this->request('GET', '/api/meters');
        
        $this->assertEquals(200, $response2->getStatusCode());
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
        
        $data2 = json_decode((string) $response2->getBody(), true);
        $this->assertEquals($data, $data2);
    }

    public function testGetMeterByIdWithCaching(): void
    {
        $meter = $this->createTestMeter();
        
        // First request - cache miss
        $response = $this->request('GET', "/api/meters/{$meter['id']}");
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
        
        $data = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertEquals($meter['id'], $data['data']['id']);
        
        // Second request - cache hit
        $response2 = $this->request('GET', "/api/meters/{$meter['id']}");
        
        $this->assertEquals(200, $response2->getStatusCode());
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
        
        $data2 = json_decode((string) $response2->getBody(), true);
        $this->assertEquals($data, $data2);
    }

    public function testGetMeterBalanceWithShortCaching(): void
    {
        $meter = $this->createTestMeter();
        
        // First request
        $response = $this->request('GET', "/api/meters/{$meter['id']}/balance");
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
        
        // Check cache control header for short TTL
        $cacheControl = $response->getHeaderLine('Cache-Control');
        $this->assertStringContains('max-age=60', $cacheControl);
        
        $data = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('balance', $data['data']);
        
        // Second request - cache hit
        $response2 = $this->request('GET', "/api/meters/{$meter['id']}/balance");
        
        $this->assertEquals(200, $response2->getStatusCode());
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
    }

    public function testMeterUpdateInvalidatesCache(): void
    {
        $meter = $this->createTestMeter();
        
        // Cache the meter data
        $this->request('GET', "/api/meters/{$meter['id']}");
        $this->request('GET', "/api/meters/{$meter['id']}/balance");
        
        // Update the meter
        $updateData = [
            'name' => 'Updated Meter Name',
            'status' => 'maintenance'
        ];
        
        $response = $this->request('PUT', "/api/meters/{$meter['id']}", $updateData);
        $this->assertEquals(200, $response->getStatusCode());
        
        // Verify cache was invalidated - next request should be cache miss
        $response2 = $this->request('GET', "/api/meters/{$meter['id']}");
        $this->assertEquals('MISS', $response2->getHeaderLine('X-Cache'));
        
        $data = json_decode((string) $response2->getBody(), true);
        $this->assertEquals('Updated Meter Name', $data['data']['name']);
        $this->assertEquals('maintenance', $data['data']['status']);
    }

    public function testMeterTopupInvalidatesBalanceCache(): void
    {
        $meter = $this->createTestMeter();
        
        // Cache the balance
        $response1 = $this->request('GET', "/api/meters/{$meter['id']}/balance");
        $this->assertEquals('MISS', $response1->getHeaderLine('X-Cache'));
        
        $originalData = json_decode((string) $response1->getBody(), true);
        $originalBalance = $originalData['data']['balance'];
        
        // Verify cache hit
        $response2 = $this->request('GET', "/api/meters/{$meter['id']}/balance");
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
        
        // Perform top-up
        $topupData = [
            'amount' => 50.00,
            'description' => 'Test top-up'
        ];
        
        $topupResponse = $this->request('POST', "/api/meters/{$meter['id']}/topup", $topupData);
        $this->assertEquals(200, $topupResponse->getStatusCode());
        
        // Verify balance cache was invalidated
        $response3 = $this->request('GET', "/api/meters/{$meter['id']}/balance");
        $this->assertEquals('MISS', $response3->getHeaderLine('X-Cache'));
        
        $newData = json_decode((string) $response3->getBody(), true);
        $newBalance = $newData['data']['balance'];
        
        $this->assertEquals($originalBalance + 50.00, $newBalance);
    }

    public function testMeterConsumptionWithCaching(): void
    {
        $meter = $this->createTestMeter();
        
        // Add query parameters
        $params = [
            'start_date' => '2024-01-01',
            'end_date' => '2024-01-31',
            'interval' => 'daily'
        ];
        
        $queryString = http_build_query($params);
        
        // First request - cache miss
        $response = $this->request('GET', "/api/meters/{$meter['id']}/consumption?{$queryString}");
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
        
        // Check TTL for consumption data (should be 10 minutes)
        $cacheControl = $response->getHeaderLine('Cache-Control');
        $this->assertStringContains('max-age=600', $cacheControl);
        
        $data = json_decode((string) $response->getBody(), true);
        $this->assertEquals('success', $data['status']);
        $this->assertArrayHasKey('consumption', $data['data']);
        
        // Second request with same parameters - cache hit
        $response2 = $this->request('GET', "/api/meters/{$meter['id']}/consumption?{$queryString}");
        
        $this->assertEquals(200, $response2->getStatusCode());
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
        
        $data2 = json_decode((string) $response2->getBody(), true);
        $this->assertEquals($data, $data2);
        
        // Different parameters - should be cache miss
        $params2 = [
            'start_date' => '2024-02-01',
            'end_date' => '2024-02-28',
            'interval' => 'daily'
        ];
        
        $queryString2 = http_build_query($params2);
        $response3 = $this->request('GET', "/api/meters/{$meter['id']}/consumption?{$queryString2}");
        
        $this->assertEquals('MISS', $response3->getHeaderLine('X-Cache'));
    }

    public function testNonCacheableEndpoints(): void
    {
        $meter = $this->createTestMeter();
        
        // OTA endpoint should not be cached
        $response = $this->request('POST', "/api/meters/{$meter['id']}/ota", [
            'firmware_version' => '1.2.0'
        ]);
        
        $this->assertEmpty($response->getHeaderLine('X-Cache'));
        $this->assertEmpty($response->getHeaderLine('Cache-Control'));
        
        // Control endpoint should not be cached
        $response2 = $this->request('POST', "/api/meters/{$meter['id']}/control", [
            'action' => 'start'
        ]);
        
        $this->assertEmpty($response2->getHeaderLine('X-Cache'));
        $this->assertEmpty($response2->getHeaderLine('Cache-Control'));
    }

    public function testCacheWithUserContext(): void
    {
        $meter = $this->createTestMeter();
        $user = $this->createTestUser();
        
        // Request with user authentication
        $response = $this->authenticatedRequest('GET', "/api/meters/{$meter['id']}", [], $user);
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
        
        // Cache control should be private for user-specific data
        $cacheControl = $response->getHeaderLine('Cache-Control');
        $this->assertStringContains('private', $cacheControl);
        
        // Second request with same user - cache hit
        $response2 = $this->authenticatedRequest('GET', "/api/meters/{$meter['id']}", [], $user);
        $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
        
        // Request with different user - cache miss (different cache key)
        $user2 = $this->createTestUser();
        $response3 = $this->authenticatedRequest('GET', "/api/meters/{$meter['id']}", [], $user2);
        $this->assertEquals('MISS', $response3->getHeaderLine('X-Cache'));
    }

    private function createTestMeter(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'meter_id' => 'MTR' . $this->faker->numberBetween(1000, 9999),
            'customer_id' => $this->faker->uuid(),
            'property_id' => $this->faker->uuid(),
            'meter_type' => 'prepaid',
            'meter_model' => 'WM-2024',
            'meter_serial' => 'SN' . $this->faker->numberBetween(100000, 999999),
            'status' => 'active',
            'current_balance' => $this->faker->randomFloat(2, 10, 500),
            'last_reading' => $this->faker->randomFloat(2, 0, 10000),
            'created_at' => $this->faker->dateTime()->format('Y-m-d H:i:s'),
            'updated_at' => $this->faker->dateTime()->format('Y-m-d H:i:s')
        ];
    }

    private function createTestUser(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'email' => $this->faker->email(),
            'name' => $this->faker->name(),
            'role' => 'client',
            'status' => 'active'
        ];
    }
}