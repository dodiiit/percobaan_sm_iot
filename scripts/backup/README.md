# IndoWater Backup and Disaster Recovery Scripts

This directory contains scripts for backing up and restoring the IndoWater system.

## Overview

The backup system provides:

- Automated database backups (daily, weekly, monthly)
- Automated file backups (daily, weekly, monthly)
- Backup verification
- Backup restoration
- Multiple storage locations (local, remote, cloud)

## Scripts

### database_backup.sh

This script creates a backup of the IndoWater database.

Usage:
```bash
./database_backup.sh
```

The script automatically determines the backup type (daily, weekly, monthly) based on the current date.

### file_backup.sh

This script creates a backup of the IndoWater application files.

Usage:
```bash
./file_backup.sh
```

The script automatically determines the backup type (daily, weekly, monthly) based on the current date.

### verify_backup.sh

This script verifies the integrity of database and file backups.

Usage:
```bash
./verify_backup.sh
```

### restore.sh

This script restores database and file backups.

Usage:
```bash
./restore.sh [OPTIONS]
```

Options:
- `-d, --database BACKUP_FILE`: Restore database from specific backup file
- `-f, --files BACKUP_FILE`: Restore files from specific backup file
- `--latest-db`: Restore database from latest backup
- `--latest-files`: Restore files from latest backup
- `-h, --help`: Display help message

Examples:
```bash
# Restore latest database and file backups
./restore.sh --latest-db --latest-files

# Restore specific backups
./restore.sh -d /path/to/database_backup.sql.gz -f /path/to/files_backup.tar.gz
```

## Configuration

The backup system is configured using the `backup.conf` file. This file contains settings for:

- Application paths
- Backup storage paths
- Remote backup storage
- Cloud storage
- Retention policies
- Database credentials
- Notification settings

## Cron Jobs

The backup scripts are scheduled to run automatically using cron jobs. The cron job configuration is in the `backup-cron` file.

To install the cron jobs:
```bash
sudo cp backup-cron /etc/cron.d/indowater-backup
sudo chmod 644 /etc/cron.d/indowater-backup
```

## Logs

Backup logs are stored in the following locations:

- Database backup logs: `/var/backups/indowater/logs/db_backup_*.log`
- File backup logs: `/var/backups/indowater/logs/file_backup_*.log`
- Verification logs: `/var/backups/indowater/logs/verify_backup.log`
- Restoration logs: `/var/backups/indowater/logs/restore.log`

## Installation

1. Copy the scripts to the appropriate location:
   ```bash
   sudo mkdir -p /opt/indowater/scripts/backup
   sudo cp *.sh backup.conf backup-cron /opt/indowater/scripts/backup/
   ```

2. Make the scripts executable:
   ```bash
   sudo chmod +x /opt/indowater/scripts/backup/*.sh
   ```

3. Create the backup directories:
   ```bash
   sudo mkdir -p /var/backups/indowater/{database,files,configs,logs}/{daily,weekly,monthly}
   ```

4. Install the cron jobs:
   ```bash
   sudo cp backup-cron /etc/cron.d/indowater-backup
   sudo chmod 644 /etc/cron.d/indowater-backup
   ```

5. Update the configuration file:
   ```bash
   sudo nano /opt/indowater/scripts/backup/backup.conf
   ```

## Testing

It's recommended to test the backup and restore procedures regularly to ensure they work correctly.

To test the backup scripts:
```bash
sudo /opt/indowater/scripts/backup/database_backup.sh
sudo /opt/indowater/scripts/backup/file_backup.sh
sudo /opt/indowater/scripts/backup/verify_backup.sh
```

To test the restore script (in a test environment):
```bash
sudo /opt/indowater/scripts/backup/restore.sh --latest-db --latest-files
```

## Disaster Recovery

For detailed disaster recovery procedures, see the [Disaster Recovery Plan](/docs/DISASTER_RECOVERY_PLAN.md).