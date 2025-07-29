# IndoWater Device API Documentation

## Overview

This document provides comprehensive documentation for the IndoWater Prepaid Water Meter Management System's device API endpoints and firmware analysis.

## Firmware Analysis

### Issues Found in Arduino.cpp

1. **Library Conflict (Line 26)**
   ```cpp
   #include <LiquidCrystal_I2C.h>    // Library untuk LCD I2C - *PERHATIAN: Diganti PC08544 di sini, periksa penggunaan yang benar*
   #include <PC08544.h>              // Library untuk LCD Nokia 5110
   ```
   **Issue**: Both LiquidCrystal_I2C and PC08544 libraries are included, but only PC08544 (Nokia 5110) is used.
   **Fix**: Remove the LiquidCrystal_I2C include and related comments.

2. **Invalid Pin Configuration (Line 38)**
   ```cpp
   SoftwareSerial myArd(19, 18); // D19 (RX), D18 (TX) for communication with NodeMCU
   ```
   **Issue**: Pins 19 and 18 don't exist on standard Arduino boards.
   **Fix**: Use valid pins like (2, 3) or (8, 9) depending on your Arduino model.

3. **EEPROM.commit() Usage (Line 98)**
   ```cpp
   EEPROM.commit();
   ```
   **Issue**: `EEPROM.commit()` is for ESP8266/ESP32, not Arduino. Arduino uses `EEPROM.write()` directly.
   **Fix**: Remove `EEPROM.commit()` calls or use `#ifdef ESP8266` preprocessor directives.

### Issues Found in NodeMCU.cpp

1. **API Base URL (Line 45)**
   ```cpp
   const char* API_BASE_URL = "https://lingindustri.com/api";
   ```
   **Issue**: Points to external domain instead of IndoWater system.
   **Fix**: Update to your IndoWater API server URL.

2. **Good Practices Found**
   - Proper JSON communication between Arduino and NodeMCU
   - JWT authentication implementation
   - Error handling and retry mechanisms
   - OTA update support
   - Provisioning mode with AP setup

## API Endpoints

### Device Registration & Authentication

#### 1. Register Device
**Endpoint**: `POST /device/register_device.php`

**Purpose**: Register a new water meter device using a provisioning token.

**Request Body**:
```json
{
  "provisioning_token": "ABC123DEF456...",
  "device_id": "ESP8266_CHIP_ID"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Device registered successfully",
  "id_meter": "001250729001",
  "jwt_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "client_name": "Water Authority Jakarta"
}
```

**Authentication**: None (uses provisioning token)

---

#### 2. Get Credit Balance
**Endpoint**: `GET /device/credit.php?id_meter=METER_ID`

**Purpose**: Get current credit balance and tariff information.

**Response**:
```json
{
  "status": "success",
  "data_pulsa": 50000.0,
  "tarif_per_m3": 1500.0,
  "is_unlocked": false,
  "meter_status": "active",
  "client_name": "Water Authority Jakarta",
  "customer_name": "John Doe"
}
```

**Authentication**: Bearer JWT token

---

### Meter Data Submission

#### 3. Submit Meter Reading
**Endpoint**: `POST /device/MeterReading.php`

**Purpose**: Submit real-time meter reading data from the device.

**Request Body**:
```json
{
  "id_meter": "001250729001",
  "flow_rate_lpm": 2.5,
  "meter_reading_m3": 123.456,
  "current_voltage": 12.5,
  "door_status": 0,
  "status_message": "normal",
  "valve_status": "open"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Meter reading submitted successfully",
  "data_pulsa": 48500.0,
  "tarif_per_m3": 1500.0,
  "is_unlocked": false,
  "consumption_m3": 1.0,
  "cost_amount": 1500.0
}
```

**Authentication**: Bearer JWT token

---

### Remote Commands

#### 4. Get Pending Commands
**Endpoint**: `GET /device/get_commands.php?id_meter=METER_ID`

**Purpose**: Poll for pending remote commands from the server.

**Response**:
```json
{
  "status": "success",
  "commands": [
    {
      "command_id": 123,
      "command_type": "valve_open",
      "current_valve_status": "closed",
      "parameters": {
        "reason": "Manual control by admin"
      },
      "created_at": "2025-07-29 10:30:00"
    }
  ]
}
```

**Authentication**: Bearer JWT token

---

#### 5. Acknowledge Command
**Endpoint**: `POST /device/ack_command.php`

**Purpose**: Acknowledge execution of a remote command.

**Request Body**:
```json
{
  "command_id": 123,
  "status": "acknowledged",
  "notes": "Valve opened successfully",
  "valve_status_ack": "open"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Command acknowledgment received"
}
```

**Authentication**: Bearer JWT token

---

### OTA Updates

#### 6. Download Firmware
**Endpoint**: `GET /ota/firmware.bin?device_id=DEVICE_ID&version=1.0.0`

**Purpose**: Download latest firmware binary for OTA updates.

**Response**: Binary firmware file with headers:
- `Content-Type: application/octet-stream`
- `X-Firmware-Version: 1.2.0`
- `X-Firmware-Size: 524288`
- `X-Firmware-Checksum: SHA256_HASH`

**Authentication**: Bearer JWT token

---

#### 7. Check for Updates
**Endpoint**: `GET /ota/check?version=1.0.0`

**Purpose**: Check if firmware updates are available.

**Response**:
```json
{
  "status": "success",
  "update_available": true,
  "current_version": "1.0.0",
  "latest_version": "1.2.0",
  "firmware_info": {
    "version": "1.2.0",
    "size": 524288,
    "checksum": "sha256_hash",
    "release_notes": "Bug fixes and performance improvements",
    "release_date": "2025-07-29 08:00:00"
  }
}
```

**Authentication**: Bearer JWT token

---

#### 8. Report Update Status
**Endpoint**: `POST /ota/status`

**Purpose**: Report the result of an OTA update attempt.

**Request Body**:
```json
{
  "status": "success",
  "version": "1.2.0",
  "error_message": null
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Status reported successfully"
}
```

**Authentication**: Bearer JWT token

---

## Administrative Endpoints

### Provisioning Token Management

#### 9. Generate Provisioning Token
**Endpoint**: `POST /provisioning/generate`

**Purpose**: Generate a new provisioning token for device registration.

**Request Body**:
```json
{
  "client_id": 1,
  "property_id": 123,
  "expires_hours": 24,
  "description": "Token for new meter installation"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Provisioning token generated successfully",
  "data": {
    "token": "ABC123DEF456789...",
    "client_name": "Water Authority Jakarta",
    "expires_at": "2025-07-30 10:30:00",
    "expires_hours": 24,
    "description": "Token for new meter installation"
  }
}
```

**Authentication**: Admin/Client authentication required

---

#### 10. List Provisioning Tokens
**Endpoint**: `GET /provisioning/tokens?client_id=1&status=active&page=1&limit=20`

**Purpose**: List provisioning tokens with filtering and pagination.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "token": "ABC123DEF456789...",
      "client_id": 1,
      "client_name": "Water Authority Jakarta",
      "property_id": 123,
      "property_name": "Residential Complex A",
      "description": "Token for new meter installation",
      "status": "active",
      "expires_at": "2025-07-30 10:30:00",
      "used_at": null,
      "used_by_device": null,
      "created_at": "2025-07-29 10:30:00",
      "is_expired": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

**Authentication**: Admin/Client authentication required

---

### Device Remote Control

#### 11. Control Valve
**Endpoint**: `POST /device/command/valve`

**Purpose**: Send remote valve control command to a device.

**Request Body**:
```json
{
  "meter_id": "001250729001",
  "action": "open",
  "reason": "Manual control by admin"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Valve control command sent successfully",
  "command_id": 124,
  "action": "open",
  "meter_id": "001250729001"
}
```

**Authentication**: Admin/Client authentication required

---

#### 12. Update Device Configuration
**Endpoint**: `POST /device/command/config`

**Purpose**: Send configuration update command to a device.

**Request Body**:
```json
{
  "meter_id": "001250729001",
  "config": {
    "k_factor": 7.5,
    "distance_tolerance": 15.0
  }
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Configuration update command sent successfully",
  "command_id": 125,
  "config": {
    "k_factor": 7.5,
    "distance_tolerance": 15.0
  },
  "meter_id": "001250729001"
}
```

**Authentication**: Admin/Client authentication required

---

#### 13. Set Unlock Status
**Endpoint**: `POST /device/command/unlock`

**Purpose**: Set device unlock status for maintenance mode.

**Request Body**:
```json
{
  "meter_id": "001250729001",
  "unlock": true,
  "reason": "Maintenance work"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Meter unlock status updated successfully",
  "meter_id": "001250729001",
  "unlock": true,
  "reason": "Maintenance work"
}
```

**Authentication**: Admin/Client authentication required

---

## Communication Protocol

### Arduino ↔ NodeMCU Communication

The Arduino and NodeMCU communicate via SoftwareSerial using JSON messages:

#### Arduino → NodeMCU (Meter Data)
```json
{
  "flow_rate_lpm": "2.50",
  "meter_reading_m3": "123.456",
  "current_voltage": "12.50",
  "door_status": 0,
  "status_message": "normal"
}
```

#### NodeMCU → Arduino (Credit Update)
```json
{
  "id_meter": "001250729001",
  "data_pulsa": 48500.0,
  "tarif_per_m3": 1500.0,
  "is_unlocked": false
}
```

#### NodeMCU → Arduino (Commands)
```json
{
  "command_type": "valve_open",
  "command_id": 123,
  "current_valve_status": "closed"
}
```

#### Arduino → NodeMCU (Command ACK)
```json
{
  "command_id_ack": 123,
  "ack_status": "acknowledged",
  "ack_notes": "Valve opened successfully",
  "valve_status_ack": "open"
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid/missing JWT token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## Security Features

1. **JWT Authentication**: All device endpoints require valid JWT tokens
2. **Provisioning Tokens**: Secure device registration process
3. **Input Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: API endpoints are protected against abuse
5. **HTTPS**: All communication should use HTTPS in production
6. **Token Expiry**: JWT tokens and provisioning tokens have expiration times

---

## Database Schema Integration

The API endpoints integrate with the following database tables:
- `meters`: Device and meter information
- `meter_readings`: Sensor data from devices
- `credits`: Credit balance and transactions
- `device_commands`: Remote commands for devices
- `provisioning_tokens`: Device registration tokens
- `ota_updates`: OTA update logs
- `alerts`: System alerts and notifications
- `firmware_versions`: Available firmware versions

---

## Deployment Notes

1. **Environment Variables**: Configure JWT secret, database credentials, and API URLs
2. **File Permissions**: Ensure firmware storage directory is writable
3. **SSL Certificates**: Use valid SSL certificates for HTTPS
4. **Database Indexes**: Add indexes on frequently queried fields
5. **Logging**: Configure appropriate log levels for production
6. **Monitoring**: Set up monitoring for API endpoints and device connectivity

---

## Testing

Use the following tools to test the API endpoints:
- **Postman**: For manual API testing
- **curl**: For command-line testing
- **Arduino Serial Monitor**: For device communication debugging
- **ESP8266 Serial Monitor**: For NodeMCU debugging

Example curl command:
```bash
curl -X POST "https://your-api-domain.com/device/register_device.php" \
  -H "Content-Type: application/json" \
  -d '{"provisioning_token":"ABC123","device_id":"ESP123456"}'
```

---

This documentation provides a complete reference for integrating water meter devices with the IndoWater system. For additional support or questions, please refer to the system administrator.