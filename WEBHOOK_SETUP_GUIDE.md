# Webhook Setup and Configuration Guide

## 🚀 Quick Setup Checklist

### 1. Gateway Dashboard Configuration

#### Midtrans Dashboard Setup
1. **Login to Midtrans Dashboard**
   - Sandbox: https://dashboard.sandbox.midtrans.com/
   - Production: https://dashboard.midtrans.com/

2. **Configure Webhook URL**
   - Go to Settings → Configuration
   - Set Payment Notification URL to:
     ```
     https://your-domain.com/api/webhooks/payment/midtrans
     ```
   - Set Finish Redirect URL (optional):
     ```
     https://your-domain.com/payment/success
     ```
   - Set Unfinish Redirect URL (optional):
     ```
     https://your-domain.com/payment/pending
     ```
   - Set Error Redirect URL (optional):
     ```
     https://your-domain.com/payment/failed
     ```

3. **Security Settings**
   - Enable HTTP notification
   - Copy your Server Key (needed for signature verification)

#### DOKU Dashboard Setup
1. **Login to DOKU Dashboard**
   - Sandbox: https://dashboard-sandbox.doku.com/
   - Production: https://dashboard.doku.com/

2. **Configure Webhook URL**
   - Go to Integration → Webhook Settings
   - Set Notification URL to:
     ```
     https://your-domain.com/api/webhooks/payment/doku
     ```

3. **Security Settings**
   - Copy your Shared Key (needed for signature verification)
   - Enable webhook notifications

### 2. Environment Configuration

Update your `.env` file with the webhook credentials:

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_IS_PRODUCTION=false

# DOKU Configuration  
DOKU_SHARED_KEY=your_doku_shared_key_here
DOKU_CLIENT_ID=your_doku_client_id_here
DOKU_IS_PRODUCTION=false

# Webhook Security
WEBHOOK_SECRET_KEY=your_webhook_secret_key_here
```

### 3. Cron Job Setup

Add this to your server's crontab to process webhook retries every 5 minutes:

```bash
# Edit crontab
crontab -e

# Add this line:
*/5 * * * * /path/to/your/project/api/scripts/webhook_cron.sh

# Or run the PHP script directly:
*/5 * * * * cd /path/to/your/project/api && php scripts/process_webhook_retries.php >> logs/webhook_retry.log 2>&1
```

### 4. Directory Permissions

Ensure proper permissions for log files:

```bash
# Create logs directory if it doesn't exist
mkdir -p /path/to/your/project/api/logs

# Set proper permissions
chmod 755 /path/to/your/project/api/logs
chmod 644 /path/to/your/project/api/logs/*.log
```

## 🔧 Testing Your Webhook Setup

### 1. Test Webhook Endpoints

```bash
# Test webhook status
curl -X GET https://your-domain.com/api/webhooks/status

# Test Midtrans webhook (replace with actual data)
curl -X POST https://your-domain.com/api/webhooks/payment/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "test-order-123",
    "gross_amount": "100000.00",
    "signature_key": "test_signature"
  }'

# Test DOKU webhook (replace with actual data)
curl -X POST https://your-domain.com/api/webhooks/payment/doku \
  -H "Content-Type: application/json" \
  -d '{
    "TRANSACTIONSTATUS": "SUCCESS",
    "TRANSIDMERCHANT": "test-order-123",
    "AMOUNT": "100000",
    "WORDS": "test_signature"
  }'
```

### 2. Use Testing Script

```bash
cd /path/to/your/project/api
php scripts/test_webhooks.php
```

### 3. Monitor Webhook Health

```bash
# Check webhook status
curl https://your-domain.com/api/webhooks/status

# Check retry statistics
cd /path/to/your/project/api
php scripts/process_webhook_retries.php --stats
```

## 📊 Monitoring and Maintenance

### Webhook Status Endpoint

Access webhook system status at:
```
GET https://your-domain.com/api/webhooks/status
```

Response example:
```json
{
  "webhook_system": "operational",
  "retry_stats": {
    "total_pending": 0,
    "by_method": {},
    "by_attempt": {}
  },
  "supported_gateways": ["midtrans", "doku"],
  "endpoints": {
    "midtrans": "/webhooks/payment/midtrans",
    "doku": "/webhooks/payment/doku"
  },
  "timestamp": "2025-08-02 10:30:00"
}
```

### Log Monitoring

Monitor webhook logs:
```bash
# Real-time webhook logs
tail -f /path/to/your/project/api/logs/app.log | grep webhook

# Retry processing logs
tail -f /path/to/your/project/api/logs/webhook_retry.log
```

### Retry Management

```bash
# Process retries manually
php scripts/process_webhook_retries.php

# View retry statistics
php scripts/process_webhook_retries.php --stats

# Clear all pending retries (use with caution)
php scripts/process_webhook_retries.php --clear
```

## 🔒 Security Considerations

### 1. IP Whitelisting (Optional)

Add IP restrictions in your web server configuration:

**Nginx Example:**
```nginx
location /api/webhooks/ {
    # Midtrans IP ranges (update as needed)
    allow 103.10.128.0/22;
    allow 103.127.16.0/22;
    
    # DOKU IP ranges (update as needed)  
    allow 103.20.51.0/24;
    allow 202.6.227.0/24;
    
    deny all;
    
    try_files $uri $uri/ /index.php?$query_string;
}
```

**Apache Example:**
```apache
<Location "/api/webhooks/">
    Require ip 103.10.128.0/22
    Require ip 103.127.16.0/22
    Require ip 103.20.51.0/24
    Require ip 202.6.227.0/24
</Location>
```

### 2. HTTPS Requirements

Ensure your webhook endpoints use HTTPS:
- Obtain SSL certificate for your domain
- Configure your web server to redirect HTTP to HTTPS
- Test webhook URLs with HTTPS

### 3. Rate Limiting

Consider implementing rate limiting for webhook endpoints:

```nginx
# Nginx rate limiting example
http {
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=10r/m;
    
    location /api/webhooks/ {
        limit_req zone=webhook burst=5 nodelay;
        # ... other configuration
    }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Notifications**
   - Check webhook URL is accessible from internet
   - Verify HTTPS certificate is valid
   - Check firewall settings
   - Verify webhook URL in gateway dashboard

2. **Signature Verification Failing**
   - Verify server key/shared key in environment variables
   - Check webhook payload format
   - Ensure proper encoding (UTF-8)

3. **High Retry Queue**
   - Check application logs for errors
   - Verify database connectivity
   - Check cron job is running
   - Monitor system resources

### Debug Commands

```bash
# Test webhook endpoint accessibility
curl -I https://your-domain.com/api/webhooks/status

# Check webhook logs
grep "webhook" /path/to/your/project/api/logs/app.log | tail -20

# Test signature verification
php scripts/test_webhooks.php

# Check retry queue
php scripts/process_webhook_retries.php --stats
```

## 📈 Performance Optimization

### 1. Database Indexing

Ensure proper indexes for webhook-related queries:

```sql
-- Add indexes for payment lookups
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### 2. Caching Strategy

The webhook system uses caching for:
- Retry queue management
- Duplicate webhook detection
- Rate limiting

Monitor cache performance and adjust TTL values as needed.

### 3. Log Rotation

Set up log rotation to prevent disk space issues:

```bash
# Add to /etc/logrotate.d/indowater-webhooks
/path/to/your/project/api/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

## 🎯 Next Steps

1. **Test in Sandbox Environment**
   - Configure sandbox credentials
   - Test with small amounts
   - Verify all payment flows

2. **Production Deployment**
   - Update environment variables
   - Configure production webhook URLs
   - Set up monitoring alerts

3. **Monitoring Setup**
   - Configure application monitoring
   - Set up webhook failure alerts
   - Monitor retry queue size

4. **Documentation**
   - Document your specific webhook URLs
   - Create runbooks for common issues
   - Train team on webhook monitoring

## 📞 Support

For webhook-related issues:
1. Check the troubleshooting section above
2. Review application logs
3. Test webhook endpoints manually
4. Contact payment gateway support if needed

---

**Important:** Always test webhook configurations in sandbox/staging environment before deploying to production.