# Payment Gateway API Documentation

## Overview

The Payment Gateway API provides endpoints for managing payment gateway configurations and processing payments. It supports multiple payment gateways (Midtrans and DOKU) with a multi-tenant architecture, allowing both system-wide and client-specific configurations.

## Authentication

All API endpoints (except notification webhooks) require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer {your_token}
```

## Base URL

```
https://your-indowater-server.com/api/v1
```

## Payment Gateway Management

### Get All Payment Gateways

Retrieves all payment gateways based on user role and permissions.

**Endpoint:** `GET /payment-gateways`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `gateway` (optional): Filter by gateway type (midtrans, doku)
- `is_active` (optional): Filter by active status (true, false)
- `client_id` (optional, superadmin only): Filter by client ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "client_id": "550e8400-e29b-41d4-a716-446655440001",
      "client_name": "Example Client",
      "gateway": "midtrans",
      "is_active": true,
      "is_production": false,
      "created_at": "2025-07-29 12:00:00",
      "updated_at": "2025-07-29 12:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Payment Gateway by ID

Retrieves a specific payment gateway by ID.

**Endpoint:** `GET /payment-gateways/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "client_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_name": "Example Client",
    "gateway": "midtrans",
    "is_active": true,
    "is_production": false,
    "created_at": "2025-07-29 12:00:00",
    "updated_at": "2025-07-29 12:00:00",
    "credentials": {
      "server_key": "SB-Mid-server-XXXXXXXXXXXXXXXX",
      "client_key": "SB-Mid-client-XXXXXXXXXXXXXXXX"
    }
  }
}
```

### Create Payment Gateway

Creates a new payment gateway configuration.

**Endpoint:** `POST /payment-gateways`

**Request Body:**
```json
{
  "gateway": "midtrans",
  "client_id": "550e8400-e29b-41d4-a716-446655440001", // Optional for superadmin, omit for client
  "is_active": true,
  "is_production": false,
  "credentials": {
    "server_key": "SB-Mid-server-XXXXXXXXXXXXXXXX",
    "client_key": "SB-Mid-client-XXXXXXXXXXXXXXXX"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment gateway created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "client_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_name": "Example Client",
    "gateway": "midtrans",
    "is_active": true,
    "is_production": false,
    "created_at": "2025-07-29 12:00:00",
    "updated_at": "2025-07-29 12:00:00"
  }
}
```

### Update Payment Gateway

Updates an existing payment gateway configuration.

**Endpoint:** `PUT /payment-gateways/{id}`

**Request Body:**
```json
{
  "is_active": true,
  "is_production": false,
  "credentials": {
    "server_key": "SB-Mid-server-XXXXXXXXXXXXXXXX",
    "client_key": "SB-Mid-client-XXXXXXXXXXXXXXXX"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment gateway updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "client_id": "550e8400-e29b-41d4-a716-446655440001",
    "client_name": "Example Client",
    "gateway": "midtrans",
    "is_active": true,
    "is_production": false,
    "created_at": "2025-07-29 12:00:00",
    "updated_at": "2025-07-29 12:00:00"
  }
}
```

### Delete Payment Gateway

Deletes a payment gateway configuration.

**Endpoint:** `DELETE /payment-gateways/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Payment gateway deleted successfully"
}
```

### Test Payment Gateway Connection

Tests the connection to a payment gateway.

**Endpoint:** `GET /payment-gateways/{id}/test`

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "payment_methods": [
      "credit_card",
      "bank_transfer",
      "gopay",
      "shopeepay",
      "qris"
    ]
  }
}
```

### Get Available Payment Gateways

Retrieves a list of available payment gateway types and their configuration fields.

**Endpoint:** `GET /payment-gateways-available`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "midtrans",
      "name": "Midtrans",
      "config_fields": {
        "server_key": {
          "type": "text",
          "label": "Server Key",
          "required": true,
          "description": "Midtrans Server Key"
        },
        "client_key": {
          "type": "text",
          "label": "Client Key",
          "required": true,
          "description": "Midtrans Client Key"
        }
      }
    },
    {
      "id": "doku",
      "name": "DOKU",
      "config_fields": {
        "client_id": {
          "type": "text",
          "label": "Client ID",
          "required": true,
          "description": "DOKU Client ID"
        },
        "secret_key": {
          "type": "text",
          "label": "Secret Key",
          "required": true,
          "description": "DOKU Secret Key"
        }
      }
    }
  ]
}
```

## Payment Processing

### Create Payment Transaction

Creates a new payment transaction.

**Endpoint:** `POST /payments`

**Request Body:**
```json
{
  "customer_id": "550e8400-e29b-41d4-a716-446655440002",
  "amount": 50000,
  "payment_gateway": "midtrans",
  "payment_method": "credit_card", // Optional
  "callback_url": "https://your-indowater-server.com/callback",
  "finish_url": "https://your-indowater-server.com/finish",
  "error_url": "https://your-indowater-server.com/error",
  "pending_url": "https://your-indowater-server.com/pending",
  "expiry_duration": 60,
  "expiry_unit": "minute"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment transaction created successfully",
  "data": {
    "payment_id": "550e8400-e29b-41d4-a716-446655440003",
    "transaction_id": "INDO-1627547852123",
    "payment_url": "https://app.midtrans.com/snap/v2/vtweb/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "qr_code_url": null,
    "actions": [],
    "expiry_time": "2025-07-29 13:00:00",
    "status": "pending"
  }
}
```

### Get All Payments

Retrieves all payments based on user role and permissions.

**Endpoint:** `GET /payments`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `payment_gateway` (optional): Filter by gateway type (midtrans, doku)
- `status` (optional): Filter by status (pending, success, failed, refunded, expired)
- `date_from` (optional): Filter by date from (YYYY-MM-DD)
- `date_to` (optional): Filter by date to (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "customer_id": "550e8400-e29b-41d4-a716-446655440002",
      "customer_name": "John Doe",
      "credit_id": "550e8400-e29b-41d4-a716-446655440004",
      "amount": 50000,
      "payment_method": "credit_card",
      "payment_gateway": "midtrans",
      "transaction_id": "INDO-1627547852123",
      "transaction_time": "2025-07-29 12:00:00",
      "status": "success",
      "created_at": "2025-07-29 12:00:00",
      "updated_at": "2025-07-29 12:10:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Payment by ID

Retrieves a specific payment by ID.

**Endpoint:** `GET /payments/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "customer_id": "550e8400-e29b-41d4-a716-446655440002",
    "customer_name": "John Doe",
    "credit_id": "550e8400-e29b-41d4-a716-446655440004",
    "amount": 50000,
    "payment_method": "credit_card",
    "payment_gateway": "midtrans",
    "transaction_id": "INDO-1627547852123",
    "transaction_time": "2025-07-29 12:00:00",
    "status": "success",
    "created_at": "2025-07-29 12:00:00",
    "updated_at": "2025-07-29 12:10:00",
    "payment_details": {
      "transaction_id": "INDO-1627547852123",
      "order_id": "INDO-1627547852123",
      "payment_type": "credit_card",
      "status": "success",
      "amount": 50000,
      "time": "2025-07-29 12:00:00",
      "raw_response": {}
    }
  }
}
```

### Get Payment Status

Checks the current status of a payment with the payment gateway.

**Endpoint:** `GET /payments/{id}/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "payment_id": "550e8400-e29b-41d4-a716-446655440003",
    "transaction_id": "INDO-1627547852123",
    "status": "success",
    "amount": 50000,
    "payment_method": "credit_card",
    "payment_gateway": "midtrans",
    "created_at": "2025-07-29 12:00:00",
    "updated_at": "2025-07-29 12:10:00"
  }
}
```

### Cancel Payment

Cancels a pending payment.

**Endpoint:** `POST /payments/{id}/cancel`

**Response:**
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "data": {
    "success": true,
    "payment_id": "550e8400-e29b-41d4-a716-446655440003",
    "transaction_id": "INDO-1627547852123",
    "status": "failed",
    "message": "Payment cancelled successfully"
  }
}
```

### Handle Payment Notification (Webhook)

Processes payment notifications from payment gateways.

**Endpoint:** `POST /payments/notification/{gateway}`

**Path Parameters:**
- `gateway`: Payment gateway type (midtrans, doku)

**Request Body:**
Varies depending on the payment gateway. The API will handle the specific format for each gateway.

**Response:**
```json
{
  "success": true,
  "message": "Notification processed successfully",
  "data": {
    "success": true,
    "payment_id": "550e8400-e29b-41d4-a716-446655440003",
    "transaction_id": "INDO-1627547852123",
    "status": "success",
    "message": "Notification processed successfully"
  }
}
```

## Error Responses

All endpoints return a standard error format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Multi-tenant Architecture

The payment gateway system is designed with a multi-tenant architecture:

1. **System-wide Configuration**: Superadmin can create system-wide payment gateway configurations (with `client_id` set to `null`).

2. **Client-specific Configuration**: Each client can have their own payment gateway configurations, which take precedence over system-wide configurations.

3. **Fallback Mechanism**: If a client doesn't have a specific gateway configured, the system will fall back to the system-wide configuration.

4. **Isolation**: Client configurations are isolated from each other, ensuring that one client's settings don't affect others.

## Security Considerations

1. **Credentials Protection**: Payment gateway credentials are never exposed in API responses except when explicitly requested by authorized users.

2. **Role-based Access Control**: Different user roles have different levels of access:
   - Superadmin: Can manage all payment gateways and view all payments
   - Client: Can manage their own payment gateways and view payments for their customers
   - Customer: Can only view their own payments and create payments for themselves

3. **Webhook Verification**: Payment notifications are verified using signatures or other security mechanisms provided by the payment gateways.

4. **Production Mode**: Payment gateways can be configured in sandbox or production mode, with clear indication of the current mode.