# IndoWater IoT API Documentation

## Overview

The IndoWater IoT API provides comprehensive endpoints for managing smart water meters, customers, payments, and real-time data streaming. The API is built with PHP using Slim Framework and supports JWT authentication.

## Base URL

```
https://lingindustri.com
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

#### GET /api/meters/{id}/balance
Get meter current balance.

**Response:**
```json
{
  "status": "success",
  "data": {
    "meter_id": "MTR000001",
    "current_balance": 50000.00,
    "last_updated": "2024-01-15 10:30:00",
    "status": "active"
  }
}
```

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
Top up meter credit manually.

**Request Body:**
```json
{
  "amount": 100000,
  "description": "Manual credit top-up"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Credit topped up successfully",
  "data": {
    "credit_id": "credit-uuid",
    "meter_id": "MTR000001",
    "amount": 100000,
    "previous_balance": 25000,
    "new_balance": 125000,
    "description": "Manual credit top-up"
  }
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

#### POST /webhooks/midtrans
Midtrans payment webhook (automatic credit addition).

**Note:** When a payment is successfully processed through Midtrans or DOKU, the system automatically:
1. Updates the payment status to 'success'
2. Adds the payment amount as credit to the customer's meter
3. Sends a payment confirmation email
4. Broadcasts real-time notification to the customer

#### POST /webhooks/doku
DOKU payment webhook (automatic credit addition).

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

## Property Management API

### Get Properties

**GET** `/api/properties`

Get all properties with filtering and pagination.

**Query Parameters:**
- `type` (optional): Filter by property type
- `verification_status` (optional): Filter by verification status
- `status` (optional): Filter by property status
- `city` (optional): Filter by city
- `province` (optional): Filter by province
- `search` (optional): Search in name, code, or address
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "properties": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "property_code": "PAM-RES-0001",
      "name": "Taman Anggrek Residence",
      "description": "Modern residential complex...",
      "type": "residential",
      "address": "Jl. Taman Anggrek No. 789",
      "city": "Jakarta Barat",
      "province": "DKI Jakarta",
      "postal_code": "12346",
      "latitude": -6.1751,
      "longitude": 106.7894,
      "total_area": 5000.00,
      "building_area": 3500.00,
      "floors": 5,
      "units": 50,
      "year_built": 2020,
      "owner_name": "PT. Anggrek Property",
      "owner_phone": "+62-21-12345678",
      "owner_email": "owner@anggrek-property.com",
      "manager_name": "Budi Santoso",
      "manager_phone": "+62-812-3456-7890",
      "manager_email": "manager@anggrek-property.com",
      "verification_status": "approved",
      "verification_notes": "All documents verified...",
      "verified_by": "uuid",
      "verified_at": "2025-01-31T10:00:00Z",
      "documents": {
        "ownership_certificate": "cert_001.pdf",
        "building_permit": "permit_001.pdf",
        "tax_certificate": "tax_001.pdf"
      },
      "amenities": ["Swimming Pool", "Gym", "24/7 Security"],
      "water_source": "municipal",
      "water_pressure": "high",
      "backup_water": true,
      "emergency_contact_name": "Security Office",
      "emergency_contact_phone": "+62-21-12345679",
      "status": "active",
      "client_name": "PAM Jakarta",
      "verified_by_name": "Super Admin",
      "meter_count": 3,
      "created_at": "2025-01-31T10:00:00Z",
      "updated_at": "2025-01-31T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Get Property Details

**GET** `/api/properties/{id}`

Get detailed information about a specific property.

**Response:**
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "property_code": "PAM-RES-0001",
  "name": "Taman Anggrek Residence",
  "description": "Modern residential complex...",
  "type": "residential",
  "verification_status": "approved",
  "status": "active",
  "meters": [
    {
      "id": "uuid",
      "meter_id": "METER-001",
      "meter_type": "Smart Prepaid",
      "meter_model": "IndoWater SP-100",
      "status": "active",
      "is_main_meter": true,
      "meter_purpose": "main_supply",
      "installation_location": "Front yard",
      "customer_name": "Jane Smith",
      "customer_number": "CUST-001"
    }
  ],
  "verification_history": [
    {
      "id": "uuid",
      "action": "approved",
      "previous_status": "under_review",
      "new_status": "approved",
      "notes": "All documents verified",
      "user_name": "Super Admin",
      "created_at": "2025-01-31T10:00:00Z"
    }
  ],
  "document_files": [
    {
      "id": "uuid",
      "document_type": "ownership_certificate",
      "document_name": "Ownership Certificate.pdf",
      "file_path": "properties/uuid/documents/ownership_certificate/file.pdf",
      "file_size": 1024000,
      "file_size_formatted": "1.02 MB",
      "mime_type": "application/pdf",
      "is_required": true,
      "is_verified": true,
      "verified_by_name": "Super Admin",
      "verified_at": "2025-01-31T10:00:00Z",
      "expiry_date": "2030-01-31",
      "uploaded_by_name": "Client User",
      "created_at": "2025-01-31T10:00:00Z"
    }
  ]
}
```

### Create Property

**POST** `/api/properties`

Register a new property for verification.

**Request Body:**
```json
{
  "name": "New Property",
  "description": "Property description",
  "type": "residential",
  "address": "Property address",
  "city": "City",
  "province": "Province",
  "postal_code": "12345",
  "latitude": -6.1751,
  "longitude": 106.7894,
  "total_area": 1000.00,
  "building_area": 800.00,
  "floors": 2,
  "units": 10,
  "year_built": 2020,
  "owner_name": "Property Owner",
  "owner_phone": "+62-21-12345678",
  "owner_email": "owner@example.com",
  "manager_name": "Property Manager",
  "manager_phone": "+62-812-3456-7890",
  "manager_email": "manager@example.com",
  "amenities": ["Parking", "Security"],
  "water_source": "municipal",
  "water_pressure": "medium",
  "backup_water": false,
  "emergency_contact_name": "Emergency Contact",
  "emergency_contact_phone": "+62-21-87654321"
}
```

**Response:**
```json
{
  "message": "Property created successfully",
  "property": {
    "id": "uuid",
    "property_code": "PAM-RES-0002",
    "verification_status": "pending",
    "status": "active"
  }
}
```

### Update Property

**PUT** `/api/properties/{id}`

Update property information.

**Request Body:** Same as create property (all fields optional)

**Response:**
```json
{
  "message": "Property updated successfully",
  "property": {
    "id": "uuid",
    "verification_status": "requires_update"
  }
}
```

### Update Verification Status

**PUT** `/api/properties/{id}/verification-status`

Update property verification status (superadmin only).

**Request Body:**
```json
{
  "status": "approved",
  "notes": "All documents verified and property meets requirements",
  "rejection_reason": null
}
```

**Response:**
```json
{
  "message": "Verification status updated successfully",
  "property": {
    "id": "uuid",
    "verification_status": "approved",
    "verified_at": "2025-01-31T10:00:00Z"
  }
}
```

### Associate Meter with Property

**POST** `/api/properties/{id}/meters`

Associate a meter with a property.

**Request Body:**
```json
{
  "meter_id": "uuid",
  "installation_location": "Front yard, near gate",
  "is_main_meter": true,
  "meter_purpose": "main_supply",
  "notes": "Main water supply meter"
}
```

**Response:**
```json
{
  "message": "Meter associated successfully",
  "association_id": "uuid",
  "property": {
    "id": "uuid",
    "meters": [...]
  }
}
```

### Remove Meter Association

**DELETE** `/api/properties/{id}/meters/{meter_id}`

Remove meter association from property.

**Response:**
```json
{
  "message": "Meter association removed successfully",
  "property": {
    "id": "uuid",
    "meters": [...]
  }
}
```

### Get Property Types

**GET** `/api/properties/types`

Get available property types.

**Response:**
```json
{
  "residential": "Residential",
  "commercial": "Commercial",
  "industrial": "Industrial",
  "dormitory": "Dormitory",
  "rental_home": "Rental Home",
  "boarding_house": "Boarding House",
  "apartment": "Apartment",
  "office_building": "Office Building",
  "shopping_center": "Shopping Center",
  "warehouse": "Warehouse",
  "factory": "Factory",
  "hotel": "Hotel",
  "restaurant": "Restaurant",
  "hospital": "Hospital",
  "school": "School",
  "government": "Government",
  "other": "Other"
}
```

### Get Verification Statuses

**GET** `/api/properties/verification-statuses`

Get available verification statuses.

**Response:**
```json
{
  "pending": "Pending Review",
  "under_review": "Under Review",
  "approved": "Approved",
  "rejected": "Rejected",
  "requires_update": "Requires Update"
}
```

### Get Properties Pending Verification

**GET** `/api/properties/pending-verification`

Get properties pending verification (superadmin only).

**Query Parameters:**
- `limit` (optional): Number of properties to return (default: 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "property_code": "PAM-BOR-0001",
    "name": "Student Boarding House",
    "type": "boarding_house",
    "verification_status": "pending",
    "client_name": "PAM Jakarta",
    "created_at": "2025-01-31T10:00:00Z"
  }
]
```

### Get Property Statistics

**GET** `/api/properties/statistics`

Get property statistics for the current user/client.

**Response:**
```json
{
  "total_properties": 25,
  "pending_verification": 3,
  "approved": 20,
  "rejected": 1,
  "active": 22,
  "inactive": 3
}
```

### Delete Property

**DELETE** `/api/properties/{id}`

Soft delete a property (only if no active meters).

**Response:**
```json
{
  "message": "Property deleted successfully"
}
```

## Property Management Features

### Property Registration Process

1. **Client Registration**: Client registers a new property with basic information
2. **Document Upload**: Client uploads required documents based on property type
3. **Verification Queue**: Property enters superadmin verification queue
4. **Review Process**: Superadmin reviews property and documents
5. **Approval/Rejection**: Property is approved, rejected, or requires updates
6. **Meter Association**: Once approved, meters can be associated with the property

### Property Types and Required Documents

Each property type has specific document requirements:

- **Residential**: Ownership Certificate, Tax Certificate
- **Commercial**: Ownership Certificate, Business License, Tax Certificate, Fire Safety Certificate
- **Industrial**: Ownership Certificate, Business License, Environmental Permit, Fire Safety Certificate
- **Hotel/Restaurant**: Ownership Certificate, Business License, Fire Safety Certificate
- **And more...**

### Verification Workflow

1. **Pending**: Initial status when property is registered
2. **Under Review**: Superadmin is reviewing the property
3. **Approved**: Property meets all requirements and is approved
4. **Rejected**: Property doesn't meet requirements (with rejection reason)
5. **Requires Update**: Property needs updates before approval

### Real-time Notifications

- Property registration notifications to superadmin
- Verification status updates to clients
- Document expiry alerts
- Meter association notifications

## Support

For API support and questions, please contact the development team or check the project documentation.