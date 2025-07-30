# IndoWater API Documentation

## Overview

The IndoWater API provides a comprehensive set of endpoints for managing water metering systems, including user authentication, client management, customer management, property management, meter management, payment processing, and reporting.

## Base URL

```
https://api.indowater.com/
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints, you need to include the JWT token in the Authorization header of your requests.

```
Authorization: Bearer {your_token}
```

### Getting a Token

To get a token, you need to authenticate using the login endpoint:

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "client",
      "status": "active"
    },
    "token": "your_jwt_token",
    "refresh_token": "your_refresh_token",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/login | Login and get token | Public |
| POST | /api/auth/register | Register a new user | Public |
| POST | /api/auth/logout | Logout and invalidate token | Authenticated |
| POST | /api/auth/refresh | Refresh token | Authenticated |
| POST | /api/auth/forgot-password | Request password reset | Public |
| POST | /api/auth/reset-password | Reset password with token | Public |
| GET | /api/auth/verify-email/{token} | Verify email with token | Public |
| POST | /api/auth/resend-verification | Resend verification email | Public |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/users | Get all users | Superadmin |
| GET | /api/users/{id} | Get user by ID | Superadmin |
| POST | /api/users | Create a new user | Superadmin |
| PUT | /api/users/{id} | Update user | Superadmin |
| DELETE | /api/users/{id} | Delete user | Superadmin |
| GET | /api/users/me | Get current user profile | Authenticated |
| PUT | /api/users/me | Update current user profile | Authenticated |
| PUT | /api/users/me/password | Update current user password | Authenticated |

### Clients

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/clients | Get all clients | Superadmin |
| GET | /api/clients/{id} | Get client by ID | Superadmin, Client (own) |
| POST | /api/clients | Create a new client | Superadmin |
| PUT | /api/clients/{id} | Update client | Superadmin, Client (own) |
| DELETE | /api/clients/{id} | Delete client | Superadmin |
| PUT | /api/clients/{id}/activate | Activate client | Superadmin |
| PUT | /api/clients/{id}/deactivate | Deactivate client | Superadmin |
| GET | /api/clients/{id}/properties | Get client properties | Superadmin, Client (own) |
| GET | /api/clients/{id}/customers | Get client customers | Superadmin, Client (own) |
| GET | /api/clients/{id}/meters | Get client meters | Superadmin, Client (own) |
| GET | /api/clients/{id}/payments | Get client payments | Superadmin, Client (own) |
| GET | /api/clients/{id}/reports | Get client reports | Superadmin, Client (own) |
| GET | /api/clients/{id}/invoices | Get client invoices | Superadmin, Client (own) |

### Customers

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/customers | Get all customers | Superadmin, Client |
| GET | /api/customers/{id} | Get customer by ID | Authenticated (with access control) |
| POST | /api/customers | Create a new customer | Superadmin, Client |
| PUT | /api/customers/{id} | Update customer | Authenticated (with access control) |
| DELETE | /api/customers/{id} | Delete customer | Superadmin, Client |
| PUT | /api/customers/{id}/activate | Activate customer | Superadmin, Client |
| PUT | /api/customers/{id}/deactivate | Deactivate customer | Superadmin, Client |
| GET | /api/customers/{id}/meters | Get customer meters | Authenticated (with access control) |
| GET | /api/customers/{id}/payments | Get customer payments | Authenticated (with access control) |
| GET | /api/customers/{id}/credits | Get customer credits | Authenticated (with access control) |
| GET | /api/customers/{id}/consumption | Get customer consumption | Authenticated (with access control) |
| GET | /api/customers/{id}/notifications | Get customer notifications | Authenticated (with access control) |

### Properties

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/properties | Get all properties | Superadmin, Client |
| GET | /api/properties/{id} | Get property by ID | Authenticated (with access control) |
| POST | /api/properties | Create a new property | Superadmin, Client |
| PUT | /api/properties/{id} | Update property | Superadmin, Client |
| DELETE | /api/properties/{id} | Delete property | Superadmin, Client |
| GET | /api/properties/{id}/meters | Get property meters | Authenticated (with access control) |
| GET | /api/properties/{id}/customers | Get property customers | Authenticated (with access control) |

### Meters

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/meters | Get all meters | Superadmin, Client |
| GET | /api/meters/{id} | Get meter by ID | Authenticated (with access control) |
| POST | /api/meters | Create a new meter | Superadmin, Client |
| PUT | /api/meters/{id} | Update meter | Superadmin, Client |
| DELETE | /api/meters/{id} | Delete meter | Superadmin, Client |
| GET | /api/meters/{id}/consumption | Get meter consumption | Authenticated (with access control) |
| GET | /api/meters/{id}/credits | Get meter credits | Authenticated (with access control) |
| POST | /api/meters/{id}/topup | Top up meter credit | Authenticated (with access control) |
| POST | /api/meters/{id}/ota | Update meter firmware | Superadmin, Client |
| POST | /api/meters/{id}/control | Control meter | Superadmin, Client |
| GET | /api/meters/{id}/status | Get meter status | Authenticated (with access control) |

### Payments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/payments | Get all payments | Superadmin, Client |
| GET | /api/payments/{id} | Get payment by ID | Authenticated (with access control) |
| POST | /api/payments | Create a new payment | Authenticated |
| PUT | /api/payments/{id} | Update payment | Superadmin, Client |
| DELETE | /api/payments/{id} | Delete payment | Superadmin, Client |
| POST | /api/payments/midtrans | Process Midtrans payment | Authenticated |
| POST | /api/payments/doku | Process DOKU payment | Authenticated |
| GET | /api/payments/{id}/receipt | Get payment receipt | Authenticated (with access control) |

### Credits

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/credits | Get all credits | Superadmin, Client |
| GET | /api/credits/{id} | Get credit by ID | Authenticated (with access control) |
| POST | /api/credits | Create a new credit | Authenticated |
| PUT | /api/credits/{id} | Update credit | Superadmin, Client |
| DELETE | /api/credits/{id} | Delete credit | Superadmin, Client |
| GET | /api/credits/denominations | Get credit denominations | Authenticated |

### Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/reports/revenue | Get revenue report | Superadmin, Client |
| GET | /api/reports/consumption | Get consumption report | Superadmin, Client |
| GET | /api/reports/customers | Get customers report | Superadmin, Client |
| GET | /api/reports/payments | Get payments report | Superadmin, Client |
| GET | /api/reports/credits | Get credits report | Superadmin, Client |
| GET | /api/reports/export/{type} | Export report | Superadmin, Client |
| GET | /api/reports/admin/service-fees | Get service fees report | Superadmin |
| GET | /api/reports/admin/all-clients | Get all clients report | Superadmin |

### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/notifications | Get user notifications | Authenticated |
| GET | /api/notifications/{id} | Get notification by ID | Authenticated (with access control) |
| POST | /api/notifications/admin | Create a new notification | Superadmin, Client |
| PUT | /api/notifications/admin/{id} | Update notification | Superadmin, Client |
| DELETE | /api/notifications/admin/{id} | Delete notification | Superadmin, Client |
| PUT | /api/notifications/{id}/read | Mark notification as read | Authenticated (with access control) |
| PUT | /api/notifications/read-all | Mark all notifications as read | Authenticated |

### Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/dashboard/superadmin | Get superadmin dashboard data | Superadmin |
| GET | /api/dashboard/client | Get client dashboard data | Client |
| GET | /api/dashboard/customer | Get customer dashboard data | Customer |
| GET | /api/dashboard/stats | Get general statistics | Authenticated |
| GET | /api/dashboard/charts | Get chart data | Authenticated |

### Settings

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/settings | Get settings | Superadmin, Client |
| PUT | /api/settings | Update settings | Superadmin, Client |
| GET | /api/settings/payment-gateways | Get payment gateway settings | Superadmin, Client |
| PUT | /api/settings/payment-gateways | Update payment gateway settings | Superadmin, Client |
| GET | /api/settings/notifications | Get notification settings | Superadmin, Client |
| PUT | /api/settings/notifications | Update notification settings | Superadmin, Client |
| GET | /api/settings/global | Get global settings | Superadmin |
| PUT | /api/settings/global | Update global settings | Superadmin |
| GET | /api/settings/global/service-fees | Get service fee settings | Superadmin |
| PUT | /api/settings/global/service-fees | Update service fee settings | Superadmin |

### Webhooks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /webhooks/midtrans | Midtrans payment webhook | Public |
| POST | /webhooks/doku | DOKU payment webhook | Public |
| POST | /webhooks/meter | Meter data webhook | Public |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /health | Check API health | Public |

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error message"
}
```

## Pagination

Endpoints that return multiple items support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)

Example:

```
GET /api/users?page=2&limit=20
```

Response:

```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      // User objects
    ],
    "pagination": {
      "total": 100,
      "per_page": 20,
      "current_page": 2,
      "total_pages": 5
    }
  }
}
```

## Filtering

Some endpoints support filtering with query parameters. The specific parameters depend on the endpoint.

Example:

```
GET /api/customers?status=active&property_id=123
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request was successful |
| 201 | Created - The resource was successfully created |
| 400 | Bad Request - The request could not be understood or was missing required parameters |
| 401 | Unauthorized - Authentication failed or user does not have permissions |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 60 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

When the rate limit is exceeded, the API will return a 429 Too Many Requests response.

## Versioning

The API version is included in the response headers:

```
X-API-Version: 1.0.0
```

## Support

For API support, please contact:

- Email: api-support@indowater.com
- Phone: +62 21 1234 5678