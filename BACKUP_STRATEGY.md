# IndoWater Backup Strategy

## Overview

This document outlines the comprehensive backup strategy for the IndoWater Prepaid Water Meter Management System. The strategy ensures data protection, business continuity, and rapid recovery in case of system failures or disasters.

## Backup Components

### 1. Database Backups
- **Target**: MySQL database containing all application data
- **Method**: mysqldump with compression
- **Frequency**: Daily at 2:00 AM
- **Retention**: 7 days (daily), 4 weeks (weekly), 12 months (monthly)
- **Location**: Local storage + Cloud storage (optional)

### 2. Redis Backups
- **Target**: Redis cache and session data
- **Method**: RDB snapshot with compression
- **Frequency**: Daily at 2:30 AM
- **Retention**: 30 days
- **Location**: Local storage

### 3. Application Files Backup
- **Target**: Source code, configuration files, assets
- **Method**: Compressed tar archive
- **Frequency**: Weekly (part of full system backup)
- **Retention**: 4 weeks
- **Location**: Local storage + Cloud storage (optional)

### 4. Full System Backup
- **Target**: Complete system including database, Redis, and application files
- **Method**: Combined backup with manifest
- **Frequency**: Weekly on Sundays at 3:00 AM
- **Retention**: 4 weeks
- **Location**: Local storage + Cloud storage (optional)

## Backup Scripts

### Core Backup Scripts

1. **`scripts/backup/database-backup.sh`**
   - Creates MySQL database backups
   - Supports compression and encryption
   - Implements retention policies
   - Sends notifications on completion/failure

2. **`scripts/backup/database-restore.sh`**
   - Restores database from backup files
   - Supports both compressed and uncompressed backups
   - Creates pre-restore backups for safety
   - Validates restore integrity

3. **`scripts/backup/redis-backup.sh`**
   - Creates Redis RDB backups
   - Handles background saves
   - Compresses backup files
   - Manages retention policies

4. **`scripts/backup/full-system-backup.sh`**
   - Orchestrates complete system backup
   - Includes database, Redis, and application files
   - Creates backup manifests
   - Uploads to cloud storage (if configured)

### Disaster Recovery Scripts

1. **`scripts/disaster-recovery/assess-database.sh`**
   - Assesses database health and integrity
   - Checks for missing tables or data corruption
   - Generates assessment reports
   - Provides recovery recommendations

2. **`scripts/disaster-recovery/health-check.sh`**
   - Performs comprehensive system health checks
   - Monitors all system components
   - Generates health reports
   - Sends alerts for critical issues

3. **`scripts/disaster-recovery/restore-redis.sh`**
   - Restores Redis data from backups
   - Handles service stop/start procedures
   - Validates restore completion
   - Creates pre-restore backups

### Utility Scripts

1. **`scripts/backup/setup-backups.sh`**
   - Sets up the entire backup system
   - Creates necessary directories
   - Configures cron jobs
   - Validates dependencies

2. **`scripts/backup/backup-status.sh`**
   - Displays backup system status
   - Shows recent backup information
   - Reports storage usage
   - Lists scheduled jobs

## Backup Schedule

### Automated Schedule (via cron)

```bash
# Daily database backup at 2:00 AM
0 2 * * * /path/to/IndoWater/scripts/backup/database-backup.sh

# Daily Redis backup at 2:30 AM
30 2 * * * /path/to/IndoWater/scripts/backup/redis-backup.sh

# Weekly full system backup on Sundays at 3:00 AM
0 3 * * 0 /path/to/IndoWater/scripts/backup/full-system-backup.sh

# Daily health check at 6:00 AM
0 6 * * * /path/to/IndoWater/scripts/disaster-recovery/health-check.sh

# Weekly cleanup of old backups on Mondays at 4:00 AM
0 4 * * 1 find /path/to/IndoWater/backups -name "*.gz" -mtime +30 -delete
```

### Manual Backup Commands

```bash
# Manual database backup
./scripts/backup/database-backup.sh

# Manual Redis backup
./scripts/backup/redis-backup.sh

# Manual full system backup
./scripts/backup/full-system-backup.sh

# System health check
./scripts/disaster-recovery/health-check.sh
```

## Storage Locations

### Local Storage Structure
```
IndoWater/
├── backups/
│   ├── database/
│   │   ├── indowater_backup_YYYYMMDD_HHMMSS.sql.gz
│   │   ├── weekly/
│   │   │   └── indowater_weekly_YYYYMMDD_HHMMSS.sql.gz
│   │   └── monthly/
│   │       └── indowater_monthly_YYYYMMDD_HHMMSS.sql.gz
│   ├── redis/
│   │   └── redis_backup_YYYYMMDD_HHMMSS.rdb.gz
│   └── full-system-backup_YYYYMMDD_HHMMSS.tar.gz
└── logs/
    ├── backup.log
    ├── restore.log
    └── health-check.log
```

### Cloud Storage (Optional)
- **AWS S3**: Configured via environment variables
- **Google Cloud Storage**: Can be configured with gsutil
- **Azure Blob Storage**: Can be configured with Azure CLI

## Retention Policies

### Database Backups
- **Daily**: Keep for 7 days
- **Weekly**: Keep for 30 days (4 weeks)
- **Monthly**: Keep for 365 days (12 months)

### Redis Backups
- **Daily**: Keep for 30 days

### Full System Backups
- **Weekly**: Keep for 28 days (4 weeks)

### Log Files
- **Application logs**: Keep for 90 days
- **Backup logs**: Keep for 180 days

## Security Considerations

### Backup Encryption
- Database backups can be encrypted using GPG
- Configure encryption keys in environment variables
- Store encryption keys securely and separately

### Access Control
- Backup files should have restricted permissions (600 or 640)
- Backup directories should be owned by backup user
- Cloud storage should use IAM roles with minimal permissions

### Sensitive Data
- Environment files (.env) are excluded from backups
- Passwords and API keys are not included in application backups
- Use separate secure storage for configuration secrets

## Monitoring and Alerting

### Backup Monitoring
- Daily backup completion status
- Backup file size and integrity checks
- Storage space utilization
- Failed backup notifications

### Health Monitoring
- Database connectivity and performance
- Redis availability and memory usage
- Application server health
- Disk space and system resources

### Alert Channels
- Email notifications for backup failures
- System health alerts for critical issues
- Storage space warnings
- SSL certificate expiration alerts

## Recovery Procedures

### Database Recovery
1. **Assess the situation** using `assess-database.sh`
2. **Stop application services** to prevent data corruption
3. **Restore from backup** using `database-restore.sh`
4. **Verify data integrity** and application functionality
5. **Restart services** and monitor for issues

### Redis Recovery
1. **Stop Redis service**
2. **Restore from backup** using `restore-redis.sh`
3. **Start Redis service**
4. **Verify cache functionality**

### Full System Recovery
1. **Provision new infrastructure** if needed
2. **Deploy application stack** using Docker Compose
3. **Restore database** from latest backup
4. **Restore Redis data** if needed
5. **Restore application files** and configuration
6. **Perform comprehensive testing**

## Testing and Validation

### Regular Testing Schedule
- **Monthly**: Restore test on staging environment
- **Quarterly**: Full disaster recovery drill
- **Annually**: Complete system recovery exercise

### Backup Validation
- Automated integrity checks for all backups
- Regular restore tests to verify backup quality
- Performance benchmarks for restore procedures
- Documentation updates based on test results

## Setup Instructions

### Initial Setup
1. **Run the setup script**:
   ```bash
   ./scripts/backup/setup-backups.sh
   ```

2. **Configure environment variables**:
   ```bash
   # Edit backup-config.conf
   nano backup-config.conf
   ```

3. **Install cron jobs**:
   ```bash
   crontab scripts/backup/backup-cron.conf
   ```

4. **Test the backup system**:
   ```bash
   ./scripts/backup/database-backup.sh
   ./scripts/disaster-recovery/health-check.sh
   ```

### Configuration Files
- **`backup-config.conf`**: Main backup configuration
- **`scripts/backup/backup-cron.conf`**: Cron job definitions
- **`api/.env`**: Database and Redis connection settings

## Troubleshooting

### Common Issues

1. **Backup Script Fails**
   - Check database connectivity
   - Verify disk space availability
   - Review log files for error details
   - Ensure proper permissions on backup directories

2. **Restore Fails**
   - Verify backup file integrity
   - Check database server status
   - Ensure sufficient disk space
   - Validate database credentials

3. **Cron Jobs Not Running**
   - Check cron service status
   - Verify crontab installation
   - Review cron logs (/var/log/cron)
   - Ensure script permissions are correct

### Log Files
- **Backup logs**: `logs/backup.log`
- **Restore logs**: `logs/restore.log`
- **Health check logs**: `logs/health-check.log`
- **Cron logs**: `logs/cron-backup.log`

## Best Practices

### Backup Best Practices
1. **Test backups regularly** to ensure they can be restored
2. **Monitor backup completion** and file sizes
3. **Store backups in multiple locations** (local + cloud)
4. **Encrypt sensitive backups** before storage
5. **Document recovery procedures** and keep them updated

### Security Best Practices
1. **Use dedicated backup user** with minimal privileges
2. **Secure backup storage locations** with proper access controls
3. **Regularly rotate encryption keys** if using encryption
4. **Monitor backup access logs** for unauthorized access
5. **Keep backup software updated** to latest versions

### Operational Best Practices
1. **Automate backup processes** to reduce human error
2. **Set up monitoring and alerting** for backup failures
3. **Regularly review and update** retention policies
4. **Train team members** on recovery procedures
5. **Document all changes** to backup configurations

## Compliance and Auditing

### Audit Requirements
- Maintain backup logs for compliance reporting
- Regular backup and restore testing documentation
- Access logs for backup systems
- Retention policy compliance tracking

### Compliance Considerations
- Data protection regulations (GDPR, etc.)
- Industry-specific requirements
- Customer data handling policies
- Geographic data storage restrictions

---

**Document Version**: 1.0  
**Last Updated**: July 30, 2025  
**Next Review**: October 30, 2025  
**Maintained By**: IndoWater DevOps Team