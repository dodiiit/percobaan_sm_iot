# Payment Gateway Integration Documentation

## Overview

The IndoWater system now supports two major Indonesian payment gateways:
- **Midtrans** - Credit card, bank transfer, e-wallet, and other payment methods
- **DOKU** - Virtual account and direct debit payments

## Dependencies Added

### Composer Dependencies
```json
{
  "midtrans/midtrans-php": "^2.5",
  "doku/doku-php-library": "^1.0"
}
```

### Updated Dependencies
- `firebase/php-jwt`: Updated from `^5.5` to `^6.10` (required for DOKU SDK compatibility)

## Configuration

### Environment Variables

#### Midtrans Configuration
```env
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_ENVIRONMENT=sandbox # or production
```

#### DOKU Configuration
```env
DOKU_CLIENT_ID=your_client_id
DOKU_SECRET_KEY=your_secret_key
DOKU_PRIVATE_KEY=your_private_key_content
DOKU_PUBLIC_KEY=your_public_key_content
DOKU_PUBLIC_KEY_DOKU=doku_public_key_content
DOKU_ISSUER=IndoWater
DOKU_PARTNER_SERVICE_ID=your_partner_service_id
DOKU_ENVIRONMENT=sandbox # or production
```

### DOKU Key Generation

For DOKU integration, you need to generate RSA key pairs:

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Set passphrase for private key
openssl pkcs8 -topk8 -inform PEM -outform PEM -in private.key -out pkcs8.key -v1 PBE-SHA1-3DES

# Generate public key
openssl rsa -in private.key -outform PEM -pubout -out public.pem
```

## API Usage

### Creating Payments

#### Midtrans Payment
```http
POST /api/payments
Content-Type: application/json

{
  "amount": 50000,
  "method": "midtrans",
  "description": "Water credit top-up",
  "return_url": "https://yourapp.com/payment/success"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "payment-123",
    "amount": 50000,
    "method": "midtrans",
    "status": "pending",
    "payment_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/TOKEN",
    "snap_token": "TOKEN"
  }
}
```

#### DOKU Payment (Virtual Account)
```http
POST /api/payments
Content-Type: application/json

{
  "amount": 75000,
  "method": "doku",
  "description": "Water credit top-up",
  "callback_url": "https://yourapp.com/api/webhooks/doku"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "payment-124",
    "amount": 75000,
    "method": "doku",
    "status": "pending",
    "payment_url": "https://staging.doku.com/payment/8129014XXXXXXXX",
    "virtual_account_no": "8129014XXXXXXXX"
  }
}
```

### Checking Payment Status

```http
GET /api/payments/{payment_id}/status
```

### Webhook Endpoints

- **Midtrans**: `POST /webhooks/midtrans`
- **DOKU**: `POST /webhooks/doku`

## Implementation Details

### PaymentService Class

The `PaymentService` class handles both payment gateways:

#### Key Methods:
- `createPayment(array $paymentData)` - Creates payment with either gateway
- `handleWebhook(string $method, array $data)` - Processes webhook notifications
- `checkPaymentStatus(string $paymentId)` - Checks payment status
- `processSuccessfulPayment(array $payment)` - Handles successful payment processing

#### Features:
- **Automatic credit addition** to customer meters
- **Service fee calculation** and recording
- **Email notifications** for successful payments
- **Real-time notifications** via WebSocket
- **Signature verification** for webhook security

### Payment Flow

1. **Payment Creation**:
   - Customer initiates payment through API
   - PaymentService creates payment record in database
   - Gateway-specific payment URL/token is generated
   - Customer is redirected to payment gateway

2. **Payment Processing**:
   - Customer completes payment on gateway
   - Gateway sends webhook notification
   - PaymentService verifies webhook signature
   - Payment status is updated in database

3. **Success Handling**:
   - Credit is added to customer's meter
   - Service fees are calculated and recorded
   - Email confirmation is sent
   - Real-time notification is broadcast

## Security Features

### Midtrans
- Server key authentication
- Signature verification using SHA512
- 3D Secure support
- Sanitized input validation

### DOKU
- RSA signature verification
- HMAC-SHA256 webhook validation
- Client ID and secret key authentication
- Request timestamp validation

## Testing

### Sandbox Environment
Both gateways support sandbox environments for testing:
- **Midtrans**: Set `MIDTRANS_ENVIRONMENT=sandbox`
- **DOKU**: Set `DOKU_ENVIRONMENT=sandbox`

### Test Cards (Midtrans)
- Success: 4811 1111 1111 1114
- Failure: 4911 1111 1111 1113
- Challenge: 4411 1111 1111 1118

### Virtual Account Testing (DOKU)
Use the generated virtual account numbers in sandbox environment for testing.

## Production Deployment

1. **Update Environment Variables**:
   - Set production credentials
   - Change environment to `production`
   - Update webhook URLs to production endpoints

2. **SSL Certificate**:
   - Ensure HTTPS is enabled for webhook endpoints
   - Both gateways require secure webhook URLs in production

3. **Monitoring**:
   - Monitor webhook delivery
   - Set up alerts for failed payments
   - Track payment success rates

## Error Handling

The system includes comprehensive error handling:
- Invalid payment method validation
- Gateway API error handling
- Webhook signature verification
- Database transaction rollback on failures
- Detailed error logging

## Support

For gateway-specific issues:
- **Midtrans**: https://docs.midtrans.com/
- **DOKU**: Contact DOKU support team

For implementation issues, check the application logs and ensure all environment variables are properly configured.