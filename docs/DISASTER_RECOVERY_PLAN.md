# IndoWater Disaster Recovery Plan

## Overview

This document outlines the disaster recovery plan for the IndoWater system. It provides procedures for backup, recovery, and business continuity in the event of a system failure, data loss, or other disaster.

## Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| System Administrator | [Name] | admin@indowater.com | +62-XXX-XXXX-XXXX |
| Database Administrator | [Name] | dba@indowater.com | +62-XXX-XXXX-XXXX |
| IT Manager | [Name] | it@indowater.com | +62-XXX-XXXX-XXXX |
| Emergency Contact | [Name] | emergency@indowater.com | +62-XXX-XXXX-XXXX |

## Critical Systems

The following systems are critical to the operation of IndoWater:

1. **Web Application Server**
   - Primary: [Server details]
   - Secondary: [Server details]

2. **Database Server**
   - Primary: [Server details]
   - Secondary: [Server details]

3. **File Storage**
   - Primary: [Server details]
   - Secondary: [Server details]

4. **Payment Gateway Integration**
   - Midtrans
   - DOKU

5. **IoT Device Management System**
   - [System details]

## Backup Strategy

### Database Backups

- **Frequency**:
  - Daily: Incremental backups at 1:00 AM WIB
  - Weekly: Full backups on Sundays at 2:00 AM WIB
  - Monthly: Full backups on the 1st of each month at 3:00 AM WIB

- **Retention Policy**:
  - Daily backups: 30 days
  - Weekly backups: 12 weeks
  - Monthly backups: 24 months

- **Storage Locations**:
  - Primary: Local server at `/var/backups/indowater/database`
  - Secondary: Network-attached storage at `/mnt/backup-storage/indowater/database`
  - Tertiary: Cloud storage (AWS S3 bucket: `indowater-backups`)

### File Backups

- **Frequency**:
  - Daily: Incremental backups at 2:00 AM WIB
  - Weekly: Full backups on Sundays at 3:00 AM WIB
  - Monthly: Full backups on the 1st of each month at 4:00 AM WIB

- **Retention Policy**:
  - Daily backups: 30 days
  - Weekly backups: 12 weeks
  - Monthly backups: 24 months

- **Storage Locations**:
  - Primary: Local server at `/var/backups/indowater/files`
  - Secondary: Network-attached storage at `/mnt/backup-storage/indowater/files`
  - Tertiary: Cloud storage (AWS S3 bucket: `indowater-backups`)

### Configuration Backups

- **Frequency**: Weekly and after any configuration changes
- **Items Backed Up**:
  - Web server configuration
  - Database server configuration
  - Application configuration files
  - SSL certificates
  - Firewall rules
  - Cron jobs

### Backup Verification

- Automated verification after each backup
- Manual verification weekly
- Restoration testing monthly

## Disaster Recovery Procedures

### Level 1: Minor Incidents (Single Component Failure)

#### Database Failure

1. **Identification**:
   - Database connectivity issues
   - Application error logs showing database connection failures
   - Monitoring alerts for database server

2. **Response**:
   - Attempt to restart the database service:
     ```bash
     systemctl restart mysql
     ```
   - Check database logs for errors:
     ```bash
     tail -n 100 /var/log/mysql/error.log
     ```

3. **Recovery**:
   - If restart fails, restore from the latest backup:
     ```bash
     /path/to/indowater/scripts/backup/restore.sh --latest-db
     ```

#### Web Server Failure

1. **Identification**:
   - HTTP 5xx errors
   - Server not responding
   - Monitoring alerts for web server

2. **Response**:
   - Attempt to restart the web server:
     ```bash
     systemctl restart nginx
     systemctl restart php-fpm
     ```
   - Check web server logs for errors:
     ```bash
     tail -n 100 /var/log/nginx/error.log
     ```

3. **Recovery**:
   - If restart fails, restore web server configuration:
     ```bash
     cp /var/backups/indowater/configs/nginx/nginx.conf /etc/nginx/nginx.conf
     cp /var/backups/indowater/configs/nginx/sites-available/* /etc/nginx/sites-available/
     systemctl restart nginx
     ```

### Level 2: Major Incidents (Multiple Component Failures)

1. **Identification**:
   - Multiple services down
   - Significant performance degradation
   - Multiple monitoring alerts

2. **Response**:
   - Notify the IT team and stakeholders
   - Assess the extent of the failure
   - Determine if failover to secondary systems is necessary

3. **Recovery**:
   - Activate secondary systems if primary systems cannot be restored quickly
   - Restore from backups as needed:
     ```bash
     /path/to/indowater/scripts/backup/restore.sh --latest-db --latest-files
     ```
   - Verify system integrity after restoration

### Level 3: Catastrophic Incidents (Complete System Failure)

1. **Identification**:
   - Complete system unavailability
   - Data center outage
   - Natural disaster affecting primary infrastructure

2. **Response**:
   - Activate the emergency response team
   - Notify all stakeholders
   - Declare a disaster situation

3. **Recovery**:
   - Activate disaster recovery site
   - Restore from off-site backups:
     ```bash
     aws s3 cp s3://indowater-backups/database/monthly/[latest_backup] /tmp/
     aws s3 cp s3://indowater-backups/files/monthly/[latest_backup] /tmp/
     /path/to/indowater/scripts/backup/restore.sh -d /tmp/[db_backup] -f /tmp/[file_backup]
     ```
   - Redirect DNS to the disaster recovery site
   - Verify system integrity after restoration

## Business Continuity

### Critical Business Functions

1. **Water Metering and Monitoring**
   - Recovery Time Objective (RTO): 4 hours
   - Recovery Point Objective (RPO): 1 hour

2. **Payment Processing**
   - Recovery Time Objective (RTO): 8 hours
   - Recovery Point Objective (RPO): 1 hour

3. **Customer Management**
   - Recovery Time Objective (RTO): 12 hours
   - Recovery Point Objective (RPO): 24 hours

### Manual Procedures During System Outage

1. **Water Metering**
   - Implement manual meter reading procedures
   - Use backup communication channels to collect meter data

2. **Payment Processing**
   - Accept payments through alternative channels (bank transfer, cash)
   - Maintain manual records of payments

3. **Customer Service**
   - Use phone and in-person channels for customer service
   - Maintain manual records of customer interactions

## Recovery Testing

### Testing Schedule

- **Database Recovery**: Monthly
- **Application Recovery**: Quarterly
- **Full Disaster Recovery**: Bi-annually

### Testing Procedure

1. Create a test environment that mimics the production environment
2. Execute the recovery procedures using test backups
3. Verify system functionality after recovery
4. Document any issues encountered and update the recovery procedures

## Plan Maintenance

- Review and update this plan quarterly
- Update after any significant system changes
- Conduct training for IT staff on recovery procedures bi-annually
- Document all recovery tests and their results

## Appendices

### Appendix A: Server Information

| Server | IP Address | Role | Location |
|--------|------------|------|----------|
| server1.indowater.com | 10.0.0.1 | Primary Web Server | Jakarta Data Center |
| server2.indowater.com | 10.0.0.2 | Primary Database Server | Jakarta Data Center |
| server3.indowater.com | 10.0.0.3 | Secondary Web Server | Surabaya Data Center |
| server4.indowater.com | 10.0.0.4 | Secondary Database Server | Surabaya Data Center |

### Appendix B: Backup Scripts

- Database Backup: `/path/to/indowater/scripts/backup/database_backup.sh`
- File Backup: `/path/to/indowater/scripts/backup/file_backup.sh`
- Backup Verification: `/path/to/indowater/scripts/backup/verify_backup.sh`
- Backup Restoration: `/path/to/indowater/scripts/backup/restore.sh`

### Appendix C: Recovery Checklists

#### Database Recovery Checklist

1. [ ] Identify the cause of database failure
2. [ ] Attempt to restart the database service
3. [ ] If restart fails, select appropriate backup for restoration
4. [ ] Execute database restoration script
5. [ ] Verify database integrity after restoration
6. [ ] Test application connectivity to the database
7. [ ] Monitor database performance after recovery

#### Web Application Recovery Checklist

1. [ ] Identify the cause of application failure
2. [ ] Attempt to restart the application services
3. [ ] If restart fails, select appropriate backup for restoration
4. [ ] Execute application restoration script
5. [ ] Verify application functionality after restoration
6. [ ] Test critical application features
7. [ ] Monitor application performance after recovery

#### Complete System Recovery Checklist

1. [ ] Assess the extent of the system failure
2. [ ] Activate the disaster recovery team
3. [ ] Notify stakeholders of the situation
4. [ ] Determine if failover to secondary systems is necessary
5. [ ] Execute database and application restoration scripts
6. [ ] Verify system integrity after restoration
7. [ ] Test all critical system functions
8. [ ] Monitor system performance after recovery
9. [ ] Document the incident and recovery process
10. [ ] Conduct a post-incident review