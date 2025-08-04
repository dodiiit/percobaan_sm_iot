# Webhook Configuration Guide

This guide explains how to configure and test webhook endpoints for payment notifications from Midtrans and DOKU payment gateways.

## Webhook Endpoints

### Primary Webhook Endpoints (Recommended)
- **Midtrans**: `POST /webhooks/payment/midtrans`
- **DOKU**: `POST /webhooks/payment/doku`

### Legacy Webhook Endpoints (Backward Compatibility)
- **Midtrans**: `POST /webhooks/midtrans`
- **DOKU**: `POST /webhooks/doku`

## Webhook URLs for Gateway Configuration

When configuring webhooks in your payment gateway dashboards, use these URLs:

### Production
```
Midtrans: https://yourdomain.com/webhooks/payment/midtrans
DOKU: https://yourdomain.com/webhooks/payment/doku
```

### Development/Testing
```
Midtrans: http://localhost:8080/webhooks/payment/midtrans
DOKU: http://localhost:8080/webhooks/payment/doku
```

## Webhook Security

### Midtrans Signature Verification
Midtrans webhooks are verified using SHA512 hash:
```
signature = SHA512(order_id + status_code + gross_amount + server_key)
```

### DOKU Signature Verification
DOKU webhooks support two verification methods:

1. **Header-based (Recommended)**:
   - `X-DOKU-Signature`: HMAC-SHA256 signature
   - `X-DOKU-Timestamp`: Request timestamp

2. **Data-based (Fallback)**:
   ```
   signature = SHA256(amount + currency + invoice_number + secret_key)
   ```

## Webhook Data Formats

### Midtrans Webhook Data
```json
{
  "transaction_time": "2024-01-01 12:00:00",
  "transaction_status": "settlement",
  "transaction_id": "TXN-123456789",
  "status_message": "midtrans payment success",
  "status_code": "200",
  "signature_key": "abc123...",
  "payment_type": "bank_transfer",
  "order_id": "ORDER-123",
  "merchant_id": "G123456789",
  "gross_amount": "100000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

### DOKU Webhook Data
```json
{
  "order": {
    "invoice_number": "INV-123",
    "amount": "100000",
    "currency": "IDR"
  },
  "transaction": {
    "id": "TXN-123456789",
    "status": "SUCCESS",
    "date": "2024-01-01 12:00:00"
  },
  "virtual_account_info": {
    "virtual_account_number": "1234567890123456",
    "bank_code": "BCA",
    "bank_name": "Bank Central Asia"
  },
  "security": {
    "checksum": "abc123..."
  }
}
```

## Status Mapping

### Midtrans Status Mapping
| Midtrans Status | Internal Status | Description |
|----------------|----------------|-------------|
| `settlement` | `success` | Payment completed |
| `capture` | `success`/`pending` | Credit card captured (check fraud_status) |
| `pending` | `pending` | Payment pending |
| `cancel` | `failed` | Payment cancelled |
| `deny` | `failed` | Payment denied |
| `expire` | `failed` | Payment expired |
| `failure` | `failed` | Payment failed |

### DOKU Status Mapping
| DOKU Status | Internal Status | Description |
|------------|----------------|-------------|
| `SUCCESS` | `success` | Payment completed |
| `SETTLEMENT` | `success` | Payment settled |
| `FAILED` | `failed` | Payment failed |
| `EXPIRED` | `failed` | Payment expired |
| `CANCELLED` | `failed` | Payment cancelled |
| `PENDING` | `pending` | Payment pending |
| `PROCESSING` | `pending` | Payment processing |

## Webhook Responses

### Midtrans Expected Response
Midtrans expects a simple "OK" response:
```
HTTP/1.1 200 OK
Content-Type: text/plain

OK
```

### DOKU Expected Response
DOKU expects a JSON response:
```json
{
  "response_code": "00",
  "response_message": "SUCCESS"
}
```

## Testing Webhooks

### Using the Test Script
```bash
# Test Midtrans webhook
php scripts/test_webhooks.php midtrans http://localhost:8080/webhooks/payment/midtrans

# Test DOKU webhook
php scripts/test_webhooks.php doku http://localhost:8080/webhooks/payment/doku
```

### Manual Testing with cURL

#### Midtrans Webhook Test
```bash
curl -X POST http://localhost:8080/webhooks/payment/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_time": "2024-01-01 12:00:00",
    "transaction_status": "settlement",
    "transaction_id": "TXN-123456789",
    "status_message": "midtrans payment success",
    "status_code": "200",
    "signature_key": "your_calculated_signature",
    "payment_type": "bank_transfer",
    "order_id": "ORDER-123",
    "merchant_id": "G123456789",
    "gross_amount": "100000.00",
    "fraud_status": "accept",
    "currency": "IDR"
  }'
```

#### DOKU Webhook Test
```bash
curl -X POST http://localhost:8080/webhooks/payment/doku \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "invoice_number": "INV-123",
      "amount": "100000",
      "currency": "IDR"
    },
    "transaction": {
      "id": "TXN-123456789",
      "status": "SUCCESS",
      "date": "2024-01-01 12:00:00"
    },
    "virtual_account_info": {
      "virtual_account_number": "1234567890123456",
      "bank_code": "BCA",
      "bank_name": "Bank Central Asia"
    },
    "security": {
      "checksum": "your_calculated_signature"
    }
  }'
```

## Gateway Dashboard Configuration

### Midtrans Dashboard
1. Login to Midtrans Dashboard
2. Go to Settings → Configuration
3. Set Notification URL to: `https://yourdomain.com/webhooks/payment/midtrans`
4. Enable HTTP notification
5. Save configuration

### DOKU Dashboard
1. Login to DOKU Dashboard
2. Go to Integration → Webhook Settings
3. Set Notification URL to: `https://yourdomain.com/webhooks/payment/doku`
4. Configure signature method (Header-based recommended)
5. Save configuration

## Webhook Processing Flow

1. **Receive Webhook**: Gateway sends POST request to webhook endpoint
2. **Validate Structure**: Check required fields are present
3. **Verify Signature**: Validate webhook authenticity
4. **Find Payment**: Locate payment record in database
5. **Verify Amount**: Ensure amounts match
6. **Update Status**: Update payment status if changed
7. **Process Success**: Handle successful payment (credit account, send notifications)
8. **Return Response**: Send appropriate response to gateway

## Logging and Monitoring

Webhook events are logged with the following information:
- Request headers and body
- Client IP address
- Processing results
- Error details (if any)

Log files location: `api/logs/app.log`

## Troubleshooting

### Common Issues

1. **Invalid Signature**
   - Check server key/secret key configuration
   - Verify signature calculation method
   - Ensure all required fields are included

2. **Payment Not Found**
   - Verify order_id/invoice_number matches database
   - Check external_id field for DOKU payments

3. **Amount Mismatch**
   - Ensure webhook amount matches payment amount
   - Check currency conversion if applicable

4. **Webhook Not Received**
   - Verify webhook URL is accessible from internet
   - Check firewall and server configuration
   - Ensure SSL certificate is valid (for HTTPS)

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

## Security Best Practices

1. **Always verify signatures** - Never process webhooks without signature verification
2. **Use HTTPS** - Always use HTTPS for webhook endpoints in production
3. **Validate amounts** - Always verify payment amounts match
4. **Idempotency** - Handle duplicate webhooks gracefully
5. **Rate limiting** - Implement rate limiting for webhook endpoints
6. **IP whitelisting** - Consider whitelisting gateway IP addresses

## Environment Variables

Ensure these environment variables are configured:

```env
# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false

# DOKU
DOKU_CLIENT_ID=your_client_id
DOKU_SECRET_KEY=your_secret_key
DOKU_PRIVATE_KEY=your_private_key
DOKU_PUBLIC_KEY=your_public_key
DOKU_DOKU_PUBLIC_KEY=doku_public_key
DOKU_ISSUER=your_issuer
DOKU_IS_PRODUCTION=false
DOKU_PARTNER_SERVICE_ID=your_partner_service_id
```