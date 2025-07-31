# IndoWater IoT API Documentation

## Overview

The IndoWater IoT API provides comprehensive endpoints for managing smart water meters, customers, payments, and real-time data streaming. The API is built with PHP using Slim Framework and supports JWT authentication.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "status": "success|error",
  "message": "Response message",
  "data": {
    // Response data
  }
}
```

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01 12:00:00",
  "version": "1.0.0"
}
```

---

### Authentication

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "customer"
    },
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "customer"
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh-token"
}
```

#### POST /auth/logout
Logout user (client-side token removal).

#### POST /auth/forgot-password
Request password reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

#### GET /auth/verify-email/{token}
Verify email address using verification token.

---

### Users

#### GET /api/users
Get list of users (Admin only).

**Query Parameters:**
- `limit` (int): Number of records per page (default: 20)
- `offset` (int): Number of records to skip (default: 0)
- `role` (string): Filter by user role

#### GET /api/users/me
Get current user profile.

#### PUT /api/users/me
Update current user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+6281234567890"
}
```

#### PUT /api/users/me/password
Update current user password.

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

#### GET /api/users/{id}
Get user by ID (Admin only).

#### POST /api/users
Create new user (Admin only).

#### PUT /api/users/{id}
Update user (Admin only).

#### DELETE /api/users/{id}
Delete user (Admin only).

---

### Meters

#### GET /api/meters
Get list of meters.

**Query Parameters:**
- `limit` (int): Number of records per page
- `offset` (int): Number of records to skip
- `status` (string): Filter by meter status

#### GET /api/meters/{id}
Get meter details by ID.

#### POST /api/meters
Create new meter.

**Request Body:**
```json
{
  "meter_id": "MTR000001",
  "customer_id": "customer-uuid",
  "property_id": "property-uuid",
  "installation_date": "2024-01-01",
  "meter_type": "smart",
  "meter_model": "IndoWater SM-100",
  "meter_serial": "SN00000001",
  "firmware_version": "1.2.3",
  "hardware_version": "2.1.0",
  "location_description": "Main water inlet",
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

#### PUT /api/meters/{id}
Update meter details.

#### DELETE /api/meters/{id}
Delete meter.

#### GET /api/meters/{id}/consumption
Get meter consumption data.

**Query Parameters:**
- `start_date` (date): Start date (YYYY-MM-DD)
- `end_date` (date): End date (YYYY-MM-DD)

**Response:**
```json
{
  "status": "success",
  "data": {
    "meter_id": "MTR000001",
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    },
    "consumption": [
      {
        "date": "2024-01-01",
        "start_reading": 1000,
        "end_reading": 1050,
        "consumption": 50,
        "reading_count": 24
      }
    ]
  }
}
```

#### GET /api/meters/{id}/credits
Get meter credit history.

#### POST /api/meters/{id}/topup
Top up meter credit.

**Request Body:**
```json
{
  "amount": 100000
}
```

#### GET /api/meters/{id}/status
Get real-time meter status.

**Response:**
```json
{
  "status": "success",
  "data": {
    "meter_id": "MTR000001",
    "status": "connected",
    "last_reading": 1500.5,
    "last_reading_at": "2024-01-01 12:00:00",
    "last_credit": 75000,
    "last_credit_at": "2024-01-01 10:00:00",
    "latest_data": {
      "reading": 1500.5,
      "flow_rate": 2.5,
      "battery_level": 85,
      "signal_strength": -65,
      "temperature": 28.5,
      "pressure": 2.1,
      "timestamp": "2024-01-01 12:00:00"
    },
    "alerts": [
      {
        "type": "low_credit",
        "severity": "warning",
        "message": "Credit balance is low",
        "value": 75000
      }
    ]
  }
}
```

#### POST /api/meters/{id}/ota
Initiate OTA (Over-The-Air) update.

#### POST /api/meters/{id}/control
Send control command to meter.

**Request Body:**
```json
{
  "action": "start|stop|reset|calibrate"
}
```

---

### Real-time Data

#### GET /api/realtime/stream/meters
Stream real-time meter data using Server-Sent Events (SSE).

**Headers:**
```
Accept: text/event-stream
Cache-Control: no-cache
```

**Response Stream:**
```
id: 1
event: meter-update
data: {"timestamp": 1640995200, "meters": [...]}

id: 2
event: meter-update
data: {"timestamp": 1640995205, "meters": [...]}
```

#### GET /api/realtime/stream/notifications
Stream real-time notifications using SSE.

#### GET /api/realtime/poll/updates
Poll for meter updates (alternative to SSE).

**Query Parameters:**
- `since` (timestamp): Get updates since this timestamp

**Response:**
```json
{
  "status": "success",
  "data": {
    "timestamp": 1640995200,
    "updates": [
      {
        "meter_id": "MTR000001",
        "status": "connected",
        "last_reading": 1500.5,
        "last_credit": 75000,
        "updated_at": "2024-01-01 12:00:00"
      }
    ],
    "has_updates": true
  }
}
```

#### GET /api/realtime/meter/{meter_id}/status
Get real-time status for specific meter.

---

### Payments

#### GET /api/payments
Get payment history.

#### GET /api/payments/{id}
Get payment details.

#### POST /api/payments
Create new payment.

**Request Body:**
```json
{
  "amount": 100000,
  "method": "midtrans|doku",
  "description": "Water credit top-up",
  "return_url": "http://localhost:3000/dashboard/payments"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Payment created successfully",
  "data": {
    "id": "payment-uuid",
    "amount": 100000,
    "method": "midtrans",
    "status": "pending",
    "payment_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/token"
  }
}
```

#### GET /api/payments/{id}/status
Check payment status.

#### GET /api/payments/summary
Get payment summary for current user.

---

### Webhooks

#### POST /webhook/realtime
Receive real-time data from IoT devices.

**Request Body:**
```json
{
  "type": "meter_reading",
  "meter_id": "MTR000001",
  "reading": 1500.5,
  "flow_rate": 2.5,
  "battery_level": 85,
  "signal_strength": -65,
  "temperature": 28.5,
  "pressure": 2.1,
  "timestamp": "2024-01-01 12:00:00"
}
```

#### POST /webhook/payment/{method}
Receive payment notifications from payment gateways.

---

## Real-time Features

### Server-Sent Events (SSE)

The API supports real-time data streaming using Server-Sent Events. Clients can connect to SSE endpoints to receive live updates.

**JavaScript Example:**
```javascript
const eventSource = new EventSource('/api/realtime/stream/meters', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

eventSource.addEventListener('meter-update', function(event) {
  const data = JSON.parse(event.data);
  console.log('Meter update:', data);
});
```

### Polling

For clients that don't support SSE, polling endpoints are available:

```javascript
async function pollUpdates() {
  const response = await fetch('/api/realtime/poll/updates?since=' + lastUpdate, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  const data = await response.json();
  
  if (data.data.has_updates) {
    // Process updates
    console.log('Updates:', data.data.updates);
    lastUpdate = data.data.timestamp;
  }
}

// Poll every 5 seconds
setInterval(pollUpdates, 5000);
```

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 422  | Validation Error |
| 500  | Internal Server Error |

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Default: 60 requests per minute per IP
- Authenticated users: Higher limits based on role

## Security

- All endpoints (except auth and webhooks) require JWT authentication
- CORS is configured for allowed origins
- Input validation and sanitization
- SQL injection protection using prepared statements
- Password hashing using bcrypt

## Development

### Running Tests
```bash
composer test
```

### Code Style
```bash
composer cs-fix
```

### Static Analysis
```bash
composer analyze
```

## Support

For API support and questions, please contact the development team or check the project documentation.