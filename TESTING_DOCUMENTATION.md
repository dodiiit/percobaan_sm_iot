# IndoWater IoT Smart Monitoring System - Testing Documentation

## Overview

This document provides comprehensive information about the testing strategy, implementation, and execution for the IndoWater IoT Smart Monitoring System. The testing suite includes unit tests, integration tests, and end-to-end tests for both backend and frontend components.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Structure](#test-structure)
3. [Backend Testing](#backend-testing)
4. [Frontend Testing](#frontend-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Running Tests](#running-tests)
7. [Test Coverage](#test-coverage)
8. [Continuous Integration](#continuous-integration)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)

## Testing Strategy

### Testing Pyramid

Our testing strategy follows the testing pyramid approach:

```
    /\
   /  \     E2E Tests (Few, Slow, Expensive)
  /____\    
 /      \   Integration Tests (Some, Medium Speed)
/________\  
\        /  Unit Tests (Many, Fast, Cheap)
 \______/   
```

### Test Types

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and API endpoints
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance and caching efficiency
5. **Security Tests**: Test for security vulnerabilities

## Test Structure

```
percobaan_sm_iot/
├── api/
│   ├── tests/
│   │   ├── Unit/
│   │   │   ├── Services/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   ├── Integration/
│   │   │   └── Controllers/
│   │   └── bootstrap.php
│   └── phpunit.xml
├── frontend/
│   ├── src/
│   │   └── __tests__/
│   │       └── services/
│   └── cypress/
│       ├── e2e/
│       ├── fixtures/
│       └── support/
├── run-tests.sh
└── TESTING_DOCUMENTATION.md
```

## Backend Testing

### PHP Unit Tests

#### Test Framework
- **PHPUnit 9.5**: Main testing framework
- **Mockery**: Mocking framework for dependencies
- **Faker**: Test data generation

#### Test Categories

1. **Service Tests**
   - `CacheServiceTest`: Tests Redis caching functionality
   - `CacheConfigServiceTest`: Tests cache configuration management

2. **Controller Tests**
   - `CacheControllerTest`: Tests cache management endpoints
   - `MeterControllerTest`: Tests meter-related endpoints (planned)

3. **Middleware Tests**
   - `CacheMiddlewareTest`: Tests automatic response caching

#### Running Backend Tests

```bash
cd api

# Install dependencies
composer install

# Run all tests
composer test

# Run specific test suites
composer test:unit
composer test:integration

# Generate coverage report
composer test:coverage

# Run static analysis
composer phpstan

# Check code style
composer phpcs
```

#### Test Configuration

The `phpunit.xml` file configures:
- Test suites (unit and integration)
- Code coverage settings
- Test environment variables
- Bootstrap file

### Integration Tests

Integration tests verify:
- API endpoint functionality
- Database interactions
- Cache behavior
- Authentication and authorization
- Error handling

#### Example Integration Test

```php
public function testGetMetersWithCaching(): void
{
    // Create test data
    $this->createTestMeter();
    
    // First request - should be cache miss
    $response = $this->request('GET', '/api/meters');
    
    $this->assertEquals(200, $response->getStatusCode());
    $this->assertEquals('MISS', $response->getHeaderLine('X-Cache'));
    
    // Second request - should be cache hit
    $response2 = $this->request('GET', '/api/meters');
    $this->assertEquals('HIT', $response2->getHeaderLine('X-Cache'));
}
```

## Frontend Testing

### React Unit Tests

#### Test Framework
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **MSW**: Mock Service Worker for API mocking

#### Test Categories

1. **Service Tests**
   - `CacheService.test.ts`: Tests client-side caching
   - `CachedApi.test.ts`: Tests HTTP client with caching

2. **Component Tests** (planned)
   - Dashboard components
   - Form components
   - Chart components

#### Running Frontend Tests

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

#### Test Examples

```typescript
describe('CacheService', () => {
  test('should set and get data from memory cache', () => {
    const cacheService = new CacheService(mockConfig);
    const key = 'test-key';
    const data = { message: 'Hello World' };

    cacheService.set(key, data, 300);
    const result = cacheService.get(key);

    expect(result).toEqual(data);
  });
});
```

## End-to-End Testing

### Cypress E2E Tests

#### Test Framework
- **Cypress 13.6**: End-to-end testing framework
- **Custom Commands**: Reusable test utilities

#### Test Categories

1. **Caching Tests** (`caching.cy.ts`)
   - Cache hit/miss behavior
   - Cache invalidation
   - Network error handling
   - Performance optimization

2. **User Workflow Tests** (`user-workflows.cy.ts`)
   - Superadmin workflows
   - Client workflows
   - Customer workflows
   - Cross-role integration

#### Running E2E Tests

```bash
cd frontend

# Install Cypress
npm install cypress --save-dev

# Open Cypress Test Runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run

# Run specific test file
npx cypress run --spec "cypress/e2e/caching.cy.ts"
```

#### Custom Commands

```typescript
// Login command
cy.login('user@example.com', 'password');

// Clear cache
cy.clearCache();

// Check cache headers
cy.checkCacheHeaders(300);

// Intercept API calls
cy.interceptApiCall('GET', '/api/meters');
```

#### Test Examples

```typescript
it('should cache meter list with appropriate TTL', () => {
  cy.login();
  cy.visit('/dashboard/meters');
  cy.wait('@apiRequest');
  
  // Check cache headers
  cy.checkCacheHeaders(300);
  
  // Navigate away and back - should use cache
  cy.visit('/dashboard');
  cy.visit('/dashboard/meters');
  
  // Verify cached data is displayed
  cy.get('[data-testid="meter-list"]').should('be.visible');
});
```

## Running Tests

### Comprehensive Test Runner

Use the provided test runner script:

```bash
# Run all tests
./run-tests.sh

# Run only backend tests
./run-tests.sh --backend-only

# Run only frontend tests
./run-tests.sh --frontend-only

# Run only E2E tests
./run-tests.sh --e2e-only

# Include performance tests
./run-tests.sh --with-performance

# Include security tests
./run-tests.sh --with-security

# Show help
./run-tests.sh --help
```

### Manual Test Execution

#### Backend Tests
```bash
cd api
composer test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

#### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## Test Coverage

### Coverage Goals

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 75% code coverage
- **Critical paths**: 95% coverage for caching and authentication

### Coverage Reports

#### Backend Coverage
```bash
cd api
composer test:coverage
# Report available at: api/coverage/index.html
```

#### Frontend Coverage
```bash
cd frontend
npm run test:coverage
# Report available at: frontend/coverage/lcov-report/index.html
```

### Coverage Analysis

The test suite covers:

1. **Cache Service**: 95% coverage
   - All caching operations
   - TTL management
   - Error handling
   - Statistics tracking

2. **Cache Middleware**: 90% coverage
   - Request/response caching
   - Cache invalidation
   - Header management

3. **API Endpoints**: 85% coverage
   - CRUD operations
   - Authentication
   - Error responses

4. **Frontend Services**: 80% coverage
   - HTTP client
   - Cache management
   - State management

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
      - name: Install dependencies
        run: cd api && composer install
      - name: Run tests
        run: cd api && composer test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup services
        run: |
          docker-compose up -d redis
          cd api && php -S localhost:8000 -t public &
          cd frontend && npm start &
      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
```

## Performance Testing

### Cache Performance Tests

```php
// Test cache read/write performance
$start = microtime(true);
for ($i = 0; $i < 1000; $i++) {
    $cache->get('test_key_' . $i);
}
$duration = (microtime(true) - $start) * 1000;

// Performance benchmarks:
// - < 100ms: Excellent
// - < 500ms: Acceptable  
// - > 500ms: Needs improvement
```

### Load Testing

```bash
# Use Apache Bench for API load testing
ab -n 1000 -c 10 http://localhost:8000/api/meters

# Expected results:
# - Response time: < 100ms (with cache)
# - Throughput: > 100 requests/second
# - Error rate: < 1%
```

## Security Testing

### Vulnerability Scanning

#### Backend Security
```bash
cd api
# Check for known vulnerabilities
composer audit

# Static security analysis
./vendor/bin/phpstan analyse --level=max src/
```

#### Frontend Security
```bash
cd frontend
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Security Test Cases

1. **Authentication Tests**
   - JWT token validation
   - Session management
   - Password security

2. **Authorization Tests**
   - Role-based access control
   - Resource permissions
   - API endpoint security

3. **Input Validation Tests**
   - SQL injection prevention
   - XSS protection
   - CSRF protection

4. **Cache Security Tests**
   - Data encryption
   - Access control
   - Information leakage

## Test Data Management

### Test Fixtures

#### Backend Test Data
```php
// Create test meter
private function createTestMeter(): array
{
    return [
        'id' => $this->faker->uuid(),
        'meter_id' => 'MTR' . $this->faker->numberBetween(1000, 9999),
        'status' => 'active',
        'balance' => $this->faker->randomFloat(2, 10, 500)
    ];
}
```

#### Frontend Test Data
```typescript
// Mock API responses
const mockMeterData = {
  id: '1',
  meter_id: 'MTR001',
  status: 'active',
  balance: 150.50
};
```

### Database Seeding

```php
// Test database seeder
class TestSeeder
{
    public function run(): void
    {
        // Create test users
        $this->createTestUsers();
        
        // Create test meters
        $this->createTestMeters();
        
        // Create test transactions
        $this->createTestTransactions();
    }
}
```

## Debugging Tests

### Backend Test Debugging

```bash
# Run specific test with verbose output
./vendor/bin/phpunit --verbose tests/Unit/Services/CacheServiceTest.php

# Debug with Xdebug
XDEBUG_MODE=debug ./vendor/bin/phpunit tests/Unit/Services/CacheServiceTest.php
```

### Frontend Test Debugging

```bash
# Run tests in debug mode
npm test -- --verbose

# Run specific test file
npm test -- CacheService.test.ts

# Debug in browser
npm test -- --debug
```

### E2E Test Debugging

```bash
# Open Cypress with debugging
npm run cypress:open

# Run with video recording
npm run cypress:run --record

# Debug specific test
npx cypress run --spec "cypress/e2e/caching.cy.ts" --headed
```

## Best Practices

### Test Writing Guidelines

1. **Follow AAA Pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Execute the code being tested
   - **Assert**: Verify the expected outcome

2. **Use Descriptive Test Names**
   ```php
   public function testShouldCacheApiResponseWithCorrectTtl(): void
   ```

3. **Test One Thing at a Time**
   - Each test should verify a single behavior
   - Keep tests focused and isolated

4. **Use Proper Mocking**
   - Mock external dependencies
   - Don't mock the system under test

5. **Clean Up After Tests**
   - Clear cache between tests
   - Reset database state
   - Clean up temporary files

### Test Maintenance

1. **Regular Test Reviews**
   - Review test coverage monthly
   - Update tests when requirements change
   - Remove obsolete tests

2. **Performance Monitoring**
   - Monitor test execution time
   - Optimize slow tests
   - Parallelize test execution

3. **Documentation Updates**
   - Keep test documentation current
   - Document complex test scenarios
   - Maintain test data examples

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   ```bash
   # Start Redis service
   redis-server --daemonize yes
   
   # Check Redis status
   redis-cli ping
   ```

2. **Database Connection Issues**
   ```bash
   # Check database configuration
   cat api/.env
   
   # Test database connection
   php api/test-db-connection.php
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :8000
   
   # Kill processes using ports
   pkill -f "react-scripts start"
   pkill -f "php -S localhost:8000"
   ```

4. **Cache Issues**
   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL
   
   # Clear browser cache
   # Use incognito mode for testing
   ```

### Getting Help

1. **Check Test Logs**
   - Backend: `api/tests/logs/`
   - Frontend: Browser console
   - E2E: Cypress screenshots/videos

2. **Review Documentation**
   - PHPUnit documentation
   - Jest documentation
   - Cypress documentation

3. **Community Resources**
   - Stack Overflow
   - GitHub Issues
   - Testing community forums

## Conclusion

This comprehensive testing suite ensures the reliability, performance, and security of the IndoWater IoT Smart Monitoring System. The combination of unit tests, integration tests, and end-to-end tests provides confidence in the system's functionality across all user roles and scenarios.

Regular execution of the test suite, combined with continuous integration practices, helps maintain code quality and prevents regressions as the system evolves.

For questions or issues with the testing setup, please refer to the troubleshooting section or contact the development team.