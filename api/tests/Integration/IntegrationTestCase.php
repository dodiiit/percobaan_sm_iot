<?php

declare(strict_types=1);

namespace IndoWater\Api\Tests\Integration;

use PHPUnit\Framework\TestCase;
use Slim\App;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use DI\Container;
use IndoWater\Api\Services\CacheService;
use Predis\Client;

abstract class IntegrationTestCase extends TestCase
{
    protected App $app;
    protected Container $container;
    protected CacheService $cacheService;

    protected function setUp(): void
    {
        // Create application instance
        $this->container = new Container();
        $this->app = new App($this->container);
        
        // Load configuration
        $this->loadConfiguration();
        
        // Set up test database
        $this->setUpDatabase();
        
        // Set up cache service
        $this->setUpCache();
        
        // Load routes and middleware
        $this->loadRoutes();
        $this->loadMiddleware();
    }

    protected function tearDown(): void
    {
        // Clean up test data
        $this->cleanUpDatabase();
        
        // Clear cache
        if (isset($this->cacheService)) {
            $this->cacheService->flush();
        }
    }

    protected function loadConfiguration(): void
    {
        // Load test configuration
        $settings = require __DIR__ . '/../../config/settings.php';
        
        // Override with test settings
        $settings['db']['database'] = ':memory:';
        $settings['cache']['driver'] = 'redis';
        $settings['cache']['enabled'] = true;
        
        $this->container->set('settings', $settings);
    }

    protected function setUpDatabase(): void
    {
        // Set up SQLite in-memory database for testing
        $pdo = new \PDO('sqlite::memory:');
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        // Create test tables
        $this->createTestTables($pdo);
        
        $this->container->set(\PDO::class, $pdo);
    }

    protected function setUpCache(): void
    {
        // Set up Redis client for testing
        $redis = new Client([
            'scheme' => 'tcp',
            'host' => '127.0.0.1',
            'port' => 6379,
            'database' => 1, // Use different database for testing
        ]);
        
        $this->cacheService = new CacheService($redis);
        $this->container->set(CacheService::class, $this->cacheService);
        $this->container->set(Client::class, $redis);
    }

    protected function loadRoutes(): void
    {
        $routes = require __DIR__ . '/../../config/routes.php';
        $routes($this->app);
    }

    protected function loadMiddleware(): void
    {
        $middleware = require __DIR__ . '/../../config/middleware.php';
        $middleware($this->app);
    }

    protected function createTestTables(\PDO $pdo): void
    {
        // Create meters table
        $pdo->exec("
            CREATE TABLE meters (
                id TEXT PRIMARY KEY,
                meter_id TEXT UNIQUE NOT NULL,
                customer_id TEXT,
                property_id TEXT,
                meter_type TEXT DEFAULT 'prepaid',
                meter_model TEXT,
                meter_serial TEXT,
                installation_date DATE,
                status TEXT DEFAULT 'active',
                current_balance DECIMAL(10,2) DEFAULT 0.00,
                last_reading DECIMAL(10,2) DEFAULT 0.00,
                last_reading_at DATETIME,
                last_credit DECIMAL(10,2) DEFAULT 0.00,
                last_credit_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Create users table
        $pdo->exec("
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                status TEXT DEFAULT 'active',
                phone TEXT,
                address TEXT,
                email_verified_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Create properties table
        $pdo->exec("
            CREATE TABLE properties (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT,
                postal_code TEXT,
                client_id TEXT,
                property_type TEXT DEFAULT 'residential',
                total_units INTEGER DEFAULT 1,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Create payments table
        $pdo->exec("
            CREATE TABLE payments (
                id TEXT PRIMARY KEY,
                customer_id TEXT,
                meter_id TEXT,
                amount DECIMAL(10,2) NOT NULL,
                payment_method TEXT,
                payment_status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

        // Create consumption table
        $pdo->exec("
            CREATE TABLE consumption (
                id TEXT PRIMARY KEY,
                meter_id TEXT,
                reading_date DATE,
                consumption DECIMAL(10,2),
                cost DECIMAL(10,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    protected function cleanUpDatabase(): void
    {
        if ($this->container->has(\PDO::class)) {
            $pdo = $this->container->get(\PDO::class);
            
            // Clear all test data
            $pdo->exec("DELETE FROM meters");
            $pdo->exec("DELETE FROM users");
            $pdo->exec("DELETE FROM properties");
            $pdo->exec("DELETE FROM payments");
            $pdo->exec("DELETE FROM consumption");
        }
    }

    protected function request(
        string $method,
        string $uri,
        array $data = [],
        array $headers = []
    ): ResponseInterface {
        $request = $this->createRequest($method, $uri, $data, $headers);
        return $this->app->handle($request);
    }

    protected function authenticatedRequest(
        string $method,
        string $uri,
        array $data = [],
        array $user = [],
        array $headers = []
    ): ResponseInterface {
        // Add authentication header
        $token = $this->generateTestToken($user);
        $headers['Authorization'] = 'Bearer ' . $token;
        
        $request = $this->createRequest($method, $uri, $data, $headers);
        
        // Add user context to request
        if (!empty($user)) {
            $request = $request->withAttribute('user_id', $user['id']);
            $request = $request->withAttribute('user', $user);
        }
        
        return $this->app->handle($request);
    }

    protected function createRequest(
        string $method,
        string $uri,
        array $data = [],
        array $headers = []
    ): ServerRequestInterface {
        $request = (new ServerRequestFactory())->createServerRequest($method, $uri);
        
        // Add headers
        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }
        
        // Add body data for POST/PUT requests
        if (!empty($data) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $body = (new StreamFactory())->createStream(json_encode($data));
            $request = $request->withBody($body);
            $request = $request->withHeader('Content-Type', 'application/json');
        }
        
        return $request;
    }

    protected function generateTestToken(array $user = []): string
    {
        // Generate a simple test token (in real implementation, use proper JWT)
        $payload = [
            'user_id' => $user['id'] ?? 'test-user-id',
            'email' => $user['email'] ?? 'test@example.com',
            'role' => $user['role'] ?? 'client',
            'exp' => time() + 3600
        ];
        
        return base64_encode(json_encode($payload));
    }

    protected function insertTestData(string $table, array $data): void
    {
        $pdo = $this->container->get(\PDO::class);
        
        $columns = array_keys($data);
        $placeholders = array_map(fn($col) => ":$col", $columns);
        
        $sql = "INSERT INTO $table (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
    }

    protected function getTestData(string $table, array $where = []): array
    {
        $pdo = $this->container->get(\PDO::class);
        
        $sql = "SELECT * FROM $table";
        $params = [];
        
        if (!empty($where)) {
            $conditions = [];
            foreach ($where as $column => $value) {
                $conditions[] = "$column = :$column";
                $params[$column] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    protected function assertCacheHit(ResponseInterface $response): void
    {
        $this->assertEquals('HIT', $response->getHeaderLine('X-Cache'));
    }

    protected function assertCacheMiss(ResponseInterface $response): void
    {
        $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
    }

    protected function assertCacheHeaders(ResponseInterface $response, int $expectedMaxAge = null): void
    {
        $cacheControl = $response->getHeaderLine('Cache-Control');
        $this->assertNotEmpty($cacheControl);
        
        if ($expectedMaxAge !== null) {
            $this->assertStringContains("max-age=$expectedMaxAge", $cacheControl);
        }
    }

    protected function assertNoCacheHeaders(ResponseInterface $response): void
    {
        $this->assertEmpty($response->getHeaderLine('X-Cache'));
        $this->assertEmpty($response->getHeaderLine('Cache-Control'));
    }
}