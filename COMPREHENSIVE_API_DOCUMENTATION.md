# IndoWater IoT Smart Monitoring System - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Caching](#caching)
8. [Webhooks](#webhooks)
9. [SDK Examples](#sdk-examples)
10. [Testing](#testing)

## Overview

The IndoWater API provides comprehensive access to the IoT Smart Monitoring system for prepaid water meters. The API follows RESTful principles and returns JSON responses.

### Base URL
```
Production: https://api.indowater.com/api
Development: http://localhost:8000/api
```

### API Version
Current version: `v1`

### Content Type
All requests and responses use `application/json` content type.

## Authentication

The API uses JWT (JSON Web Token) authentication for secure access.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "client",
      "name": "John Doe"
    }
  }
}
```

### Using the Token
Include the token in the Authorization header:
```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Token Refresh
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive access token.

#### POST /auth/register
Register new user account.

#### POST /auth/logout
Invalidate current session.

#### POST /auth/refresh
Refresh access token using refresh token.

#### POST /auth/forgot-password
Request password reset email.

#### POST /auth/reset-password
Reset password using reset token.

### User Management

#### GET /users
List all users (admin only).

**Query Parameters:**
- `limit` (int): Number of results per page (default: 20)
- `offset` (int): Offset for pagination (default: 0)
- `role` (string): Filter by user role
- `status` (string): Filter by user status

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "client",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "has_more": true,
      "current_page": 1,
      "total_pages": 5
    }
  }
}
```

#### GET /users/{id}
Get specific user details.

#### POST /users
Create new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "client",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

#### PUT /users/{id}
Update user information.

#### DELETE /users/{id}
Delete user account.

### Meter Management

#### GET /meters
List all meters with filtering and pagination.

**Query Parameters:**
- `limit` (int): Results per page
- `offset` (int): Pagination offset
- `status` (string): Filter by status (active, inactive, maintenance)
- `property_id` (string): Filter by property
- `customer_id` (string): Filter by customer

**Cache TTL:** 5 minutes

#### GET /meters/{id}
Get specific meter details.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "meter_id": "MTR001",
    "customer_id": "uuid",
    "property_id": "uuid",
    "meter_type": "prepaid",
    "meter_model": "WM-2024",
    "meter_serial": "SN123456",
    "installation_date": "2024-01-01",
    "status": "active",
    "current_balance": 50.00,
    "last_reading": 1234.56,
    "last_reading_at": "2024-01-01T12:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /meters
Create new meter.

#### PUT /meters/{id}
Update meter information.

#### DELETE /meters/{id}
Delete meter.

#### GET /meters/{id}/consumption
Get meter consumption data.

**Query Parameters:**
- `start_date` (date): Start date for consumption data
- `end_date` (date): End date for consumption data
- `interval` (string): Data interval (hourly, daily, monthly)

**Cache TTL:** 10 minutes

**Response:**
```json
{
  "status": "success",
  "data": {
    "meter_id": "MTR001",
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    },
    "consumption": [
      {
        "date": "2024-01-01",
        "consumption": 12.5,
        "cost": 25.00
      }
    ],
    "total_consumption": 350.5,
    "total_cost": 701.00
  }
}
```

#### GET /meters/{id}/balance
Get current meter balance.

**Cache TTL:** 1 minute

#### POST /meters/{id}/topup
Add credit to meter.

**Request Body:**
```json
{
  "amount": 100.00,
  "description": "Credit top-up"
}
```

#### GET /meters/{id}/credits
Get meter credit history.

#### GET /meters/{id}/status
Get real-time meter status.

#### POST /meters/{id}/control
Send control command to meter.

**Request Body:**
```json
{
  "action": "start|stop|reset|calibrate"
}
```

#### POST /meters/{id}/ota
Initiate over-the-air update.

### Property Management

#### GET /properties
List all properties.

**Cache TTL:** 30 minutes

#### GET /properties/{id}
Get specific property details.

#### POST /properties
Create new property.

**Request Body:**
```json
{
  "name": "Apartment Complex A",
  "address": "123 Main Street",
  "city": "Jakarta",
  "postal_code": "12345",
  "client_id": "uuid",
  "property_type": "residential",
  "total_units": 50
}
```

#### PUT /properties/{id}
Update property information.

#### DELETE /properties/{id}
Delete property.

#### GET /properties/{id}/meters
Get all meters for a property.

#### GET /properties/{id}/customers
Get all customers for a property.

### Payment Management

#### GET /payments
List all payments.

#### GET /payments/{id}
Get specific payment details.

#### POST /payments
Create new payment.

**Request Body:**
```json
{
  "customer_id": "uuid",
  "amount": 100.00,
  "payment_method": "midtrans",
  "description": "Water credit purchase"
}
```

#### POST /payments/midtrans
Process Midtrans payment.

#### POST /payments/doku
Process DOKU payment.

#### GET /payments/{id}/receipt
Get payment receipt.

### Tariff Management

#### GET /tariffs
List all tariffs.

**Cache TTL:** 1 hour

#### GET /tariffs/{id}
Get specific tariff details.

#### POST /tariffs
Create new tariff.

**Request Body:**
```json
{
  "name": "Residential Standard",
  "rate_per_unit": 2.50,
  "minimum_charge": 10.00,
  "property_type": "residential",
  "effective_date": "2024-01-01"
}
```

#### PUT /tariffs/{id}
Update tariff.

#### DELETE /tariffs/{id}
Delete tariff.

### Service Fee Management

#### GET /service-fees
List all service fees.

**Cache TTL:** 1 hour

#### GET /service-fees/{id}
Get specific service fee details.

#### POST /service-fees
Create new service fee.

#### PUT /service-fees/{id}
Update service fee.

#### DELETE /service-fees/{id}
Delete service fee.

### Dashboard & Reports

#### GET /dashboard/superadmin
Get superadmin dashboard data.

#### GET /dashboard/client
Get client dashboard data.

#### GET /dashboard/customer
Get customer dashboard data.

#### GET /reports/revenue
Get revenue reports.

#### GET /reports/consumption
Get consumption reports.

#### GET /reports/customers
Get customer reports.

### Cache Management (Admin Only)

#### GET /cache/stats
Get cache statistics.

#### GET /cache/health
Get cache health status.

#### POST /cache/clear
Clear all cache.

#### POST /cache/clear-pattern
Clear cache by pattern.

#### POST /cache/warmup
Warm up cache with frequently accessed data.

#### POST /cache/invalidate
Invalidate cache for specific operations.

## Data Models

### User Model
```json
{
  "id": "string (UUID)",
  "email": "string",
  "name": "string",
  "role": "superadmin|admin|client|customer",
  "status": "active|inactive|suspended",
  "phone": "string",
  "address": "string",
  "email_verified_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Meter Model
```json
{
  "id": "string (UUID)",
  "meter_id": "string",
  "customer_id": "string (UUID)",
  "property_id": "string (UUID)",
  "meter_type": "prepaid|postpaid",
  "meter_model": "string",
  "meter_serial": "string",
  "installation_date": "date",
  "status": "active|inactive|maintenance|error",
  "current_balance": "decimal",
  "last_reading": "decimal",
  "last_reading_at": "datetime",
  "last_credit": "decimal",
  "last_credit_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Property Model
```json
{
  "id": "string (UUID)",
  "name": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "client_id": "string (UUID)",
  "property_type": "residential|commercial|industrial",
  "total_units": "integer",
  "status": "active|inactive",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Payment Model
```json
{
  "id": "string (UUID)",
  "customer_id": "string (UUID)",
  "amount": "decimal",
  "payment_method": "midtrans|doku|manual",
  "payment_status": "pending|completed|failed|cancelled",
  "transaction_id": "string",
  "description": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "details": {
    "field": "Specific field error"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Common Error Scenarios

#### Authentication Errors
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

#### Validation Errors
```json
{
  "status": "error",
  "message": "Validation failed",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

#### Resource Not Found
```json
{
  "status": "error",
  "message": "Meter not found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default Limit**: 60 requests per minute per IP
- **Authenticated Users**: 120 requests per minute
- **Admin Users**: 300 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Caching

The API implements comprehensive caching for improved performance:

### Cache Headers
```http
Cache-Control: public, max-age=300
Expires: Wed, 01 Jan 2024 12:05:00 GMT
X-Cache: HIT
Vary: Authorization, Accept-Encoding
```

### Cache TTL by Endpoint

| Endpoint | TTL | Description |
|----------|-----|-------------|
| `/meters` | 5 minutes | Meter listings |
| `/meters/{id}/balance` | 1 minute | Real-time balance |
| `/meters/{id}/consumption` | 10 minutes | Consumption data |
| `/tariffs` | 1 hour | Tariff data |
| `/properties` | 30 minutes | Property data |

### ETag Support
The API supports ETag validation for efficient cache revalidation:

```http
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

## Webhooks

The API supports webhooks for real-time notifications:

### Webhook Endpoints

#### POST /webhooks/midtrans
Handle Midtrans payment notifications.

#### POST /webhooks/doku
Handle DOKU payment notifications.

#### POST /webhooks/meter
Handle meter status updates.

### Webhook Payload Example
```json
{
  "event": "meter.balance.low",
  "data": {
    "meter_id": "MTR001",
    "current_balance": 5.00,
    "threshold": 10.00,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class IndoWaterAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getMeters(params = {}) {
    const response = await this.client.get('/meters', { params });
    return response.data;
  }

  async getMeterBalance(meterId) {
    const response = await this.client.get(`/meters/${meterId}/balance`);
    return response.data;
  }

  async topupMeter(meterId, amount, description) {
    const response = await this.client.post(`/meters/${meterId}/topup`, {
      amount,
      description
    });
    return response.data;
  }
}

// Usage
const api = new IndoWaterAPI('http://localhost:8000/api', 'your-token');
const meters = await api.getMeters({ limit: 10 });
```

### PHP
```php
<?php

class IndoWaterAPI {
    private $baseURL;
    private $token;
    
    public function __construct($baseURL, $token) {
        $this->baseURL = $baseURL;
        $this->token = $token;
    }
    
    private function request($method, $endpoint, $data = null) {
        $curl = curl_init();
        
        curl_setopt_array($curl, [
            CURLOPT_URL => $this->baseURL . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->token,
                'Content-Type: application/json'
            ]
        ]);
        
        if ($data) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($curl);
        curl_close($curl);
        
        return json_decode($response, true);
    }
    
    public function getMeters($params = []) {
        $query = http_build_query($params);
        return $this->request('GET', '/meters?' . $query);
    }
    
    public function getMeterBalance($meterId) {
        return $this->request('GET', "/meters/{$meterId}/balance");
    }
}

// Usage
$api = new IndoWaterAPI('http://localhost:8000/api', 'your-token');
$meters = $api->getMeters(['limit' => 10]);
```

### Python
```python
import requests

class IndoWaterAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_meters(self, params=None):
        response = requests.get(
            f'{self.base_url}/meters',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def get_meter_balance(self, meter_id):
        response = requests.get(
            f'{self.base_url}/meters/{meter_id}/balance',
            headers=self.headers
        )
        return response.json()
    
    def topup_meter(self, meter_id, amount, description):
        data = {
            'amount': amount,
            'description': description
        }
        response = requests.post(
            f'{self.base_url}/meters/{meter_id}/topup',
            headers=self.headers,
            json=data
        )
        return response.json()

# Usage
api = IndoWaterAPI('http://localhost:8000/api', 'your-token')
meters = api.get_meters({'limit': 10})
```

## Testing

### Unit Tests
```bash
# Run PHP unit tests
cd api
composer test

# Run JavaScript tests
cd frontend
npm test
```

### API Testing with Postman
Import the Postman collection from `/docs/postman/IndoWater-API.postman_collection.json`

### cURL Examples

#### Authentication
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

#### Get Meters
```bash
curl -X GET http://localhost:8000/api/meters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Meter Top-up
```bash
curl -X POST http://localhost:8000/api/meters/METER_ID/topup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100.00,"description":"Credit top-up"}'
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/meters

# Using wrk
wrk -t12 -c400 -d30s -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/meters
```

## Support

For API support, please contact:
- **Email**: api-support@indowater.com
- **Documentation**: https://docs.indowater.com
- **Status Page**: https://status.indowater.com

## Changelog

### v1.2.0 (2024-01-01)
- Added comprehensive caching system
- Implemented ETag support
- Added cache management endpoints
- Improved performance monitoring

### v1.1.0 (2023-12-01)
- Added service fee management
- Implemented webhook support
- Enhanced error handling
- Added rate limiting

### v1.0.0 (2023-11-01)
- Initial API release
- Basic CRUD operations
- JWT authentication
- Payment integration