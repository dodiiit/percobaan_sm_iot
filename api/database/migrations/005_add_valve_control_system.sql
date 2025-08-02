-- Add Valve Control System
-- This migration adds tables for remote valve control functionality

-- Valves Table
CREATE TABLE IF NOT EXISTS `valves` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `valve_id` VARCHAR(50) NOT NULL COMMENT 'Unique valve identifier',
    `meter_id` CHAR(36) NOT NULL COMMENT 'Associated meter',
    `property_id` CHAR(36) NOT NULL COMMENT 'Associated property',
    `valve_type` ENUM('main', 'secondary', 'emergency', 'bypass') NOT NULL DEFAULT 'main',
    `valve_model` VARCHAR(50) NOT NULL,
    `valve_serial` VARCHAR(50) NOT NULL,
    `firmware_version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    `hardware_version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    `location_description` TEXT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `installation_date` DATE NOT NULL,
    `status` ENUM('active', 'inactive', 'maintenance', 'error', 'offline') NOT NULL DEFAULT 'active',
    `current_state` ENUM('open', 'closed', 'partial', 'unknown') NOT NULL DEFAULT 'unknown',
    `last_command` ENUM('open', 'close', 'partial_open', 'emergency_close') NULL,
    `last_command_at` TIMESTAMP NULL,
    `last_response_at` TIMESTAMP NULL,
    `battery_level` DECIMAL(5, 2) NULL COMMENT 'Battery percentage for wireless valves',
    `signal_strength` INT NULL COMMENT 'Signal strength in dBm',
    `operating_pressure` DECIMAL(10, 2) NULL COMMENT 'Current operating pressure in bar',
    `max_pressure` DECIMAL(10, 2) NOT NULL DEFAULT 10.00 COMMENT 'Maximum operating pressure in bar',
    `temperature` DECIMAL(5, 2) NULL COMMENT 'Valve temperature in Celsius',
    `is_manual_override` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Manual override active',
    `manual_override_reason` TEXT NULL,
    `manual_override_at` TIMESTAMP NULL,
    `auto_close_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Auto-close when credit runs out',
    `emergency_close_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Emergency close capability',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_valve_id` (`valve_id`),
    INDEX `idx_valve_meter` (`meter_id`),
    INDEX `idx_valve_property` (`property_id`),
    INDEX `idx_valve_status` (`status`),
    INDEX `idx_valve_state` (`current_state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valve Commands Table (Command History and Queue)
CREATE TABLE IF NOT EXISTS `valve_commands` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `valve_id` CHAR(36) NOT NULL,
    `command_type` ENUM('open', 'close', 'partial_open', 'emergency_close', 'status_check', 'reset') NOT NULL,
    `command_value` JSON NULL COMMENT 'Additional command parameters (e.g., partial open percentage)',
    `initiated_by` CHAR(36) NOT NULL COMMENT 'User who initiated the command',
    `reason` TEXT NULL COMMENT 'Reason for the command',
    `priority` ENUM('low', 'normal', 'high', 'emergency') NOT NULL DEFAULT 'normal',
    `status` ENUM('pending', 'sent', 'acknowledged', 'completed', 'failed', 'timeout', 'cancelled') NOT NULL DEFAULT 'pending',
    `sent_at` TIMESTAMP NULL,
    `acknowledged_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `response_data` JSON NULL COMMENT 'Response from valve device',
    `error_message` TEXT NULL,
    `retry_count` INT NOT NULL DEFAULT 0,
    `max_retries` INT NOT NULL DEFAULT 3,
    `timeout_seconds` INT NOT NULL DEFAULT 30,
    `expires_at` TIMESTAMP NULL COMMENT 'Command expiration time',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`valve_id`) REFERENCES `valves` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_command_valve` (`valve_id`),
    INDEX `idx_command_status` (`status`),
    INDEX `idx_command_priority` (`priority`),
    INDEX `idx_command_created` (`created_at`),
    INDEX `idx_command_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valve Status History Table
CREATE TABLE IF NOT EXISTS `valve_status_history` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `valve_id` CHAR(36) NOT NULL,
    `previous_state` ENUM('open', 'closed', 'partial', 'unknown') NOT NULL,
    `new_state` ENUM('open', 'closed', 'partial', 'unknown') NOT NULL,
    `change_reason` ENUM('manual_command', 'auto_close', 'emergency_close', 'system_command', 'device_report', 'maintenance') NOT NULL,
    `command_id` CHAR(36) NULL COMMENT 'Associated command if applicable',
    `triggered_by` CHAR(36) NULL COMMENT 'User who triggered the change',
    `device_data` JSON NULL COMMENT 'Additional device status data',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`valve_id`) REFERENCES `valves` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`command_id`) REFERENCES `valve_commands` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`triggered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_status_valve` (`valve_id`),
    INDEX `idx_status_created` (`created_at`),
    INDEX `idx_status_reason` (`change_reason`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valve Maintenance Table
CREATE TABLE IF NOT EXISTS `valve_maintenance` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `valve_id` CHAR(36) NOT NULL,
    `maintenance_type` ENUM('scheduled', 'emergency', 'preventive', 'repair') NOT NULL,
    `description` TEXT NOT NULL,
    `scheduled_date` DATE NULL,
    `completed_date` DATE NULL,
    `technician_name` VARCHAR(255) NULL,
    `technician_contact` VARCHAR(50) NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed') NOT NULL DEFAULT 'scheduled',
    `notes` TEXT NULL,
    `cost` DECIMAL(15, 2) NULL,
    `parts_replaced` JSON NULL COMMENT 'List of replaced parts',
    `next_maintenance_date` DATE NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`valve_id`) REFERENCES `valves` (`id`) ON DELETE CASCADE,
    INDEX `idx_maintenance_valve` (`valve_id`),
    INDEX `idx_maintenance_status` (`status`),
    INDEX `idx_maintenance_scheduled` (`scheduled_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valve Alerts Table
CREATE TABLE IF NOT EXISTS `valve_alerts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `valve_id` CHAR(36) NOT NULL,
    `alert_type` ENUM('low_battery', 'communication_lost', 'pressure_high', 'pressure_low', 'temperature_high', 'manual_override', 'command_failed', 'maintenance_due') NOT NULL,
    `severity` ENUM('info', 'warning', 'critical', 'emergency') NOT NULL DEFAULT 'warning',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `alert_data` JSON NULL COMMENT 'Additional alert data',
    `is_acknowledged` TINYINT(1) NOT NULL DEFAULT 0,
    `acknowledged_by` CHAR(36) NULL,
    `acknowledged_at` TIMESTAMP NULL,
    `is_resolved` TINYINT(1) NOT NULL DEFAULT 0,
    `resolved_by` CHAR(36) NULL,
    `resolved_at` TIMESTAMP NULL,
    `resolution_notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`valve_id`) REFERENCES `valves` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_alert_valve` (`valve_id`),
    INDEX `idx_alert_type` (`alert_type`),
    INDEX `idx_alert_severity` (`severity`),
    INDEX `idx_alert_status` (`is_acknowledged`, `is_resolved`),
    INDEX `idx_alert_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add valve_id to meters table for easy reference
ALTER TABLE `meters` 
ADD COLUMN `valve_id` CHAR(36) NULL COMMENT 'Primary valve for this meter' AFTER `property_id`,
ADD INDEX `idx_meter_valve` (`valve_id`);

-- Add valve control settings to meters
ALTER TABLE `meters`
ADD COLUMN `auto_valve_control` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Enable automatic valve control based on credit',
ADD COLUMN `low_credit_threshold` DECIMAL(15, 2) NOT NULL DEFAULT 10.00 COMMENT 'Credit threshold for valve warnings',
ADD COLUMN `zero_credit_action` ENUM('close_valve', 'warning_only', 'restrict_flow') NOT NULL DEFAULT 'close_valve';

-- Create indexes for performance
CREATE INDEX `idx_meters_credit_threshold` ON `meters` (`last_credit`, `auto_valve_control`);
CREATE INDEX `idx_valves_command_queue` ON `valve_commands` (`status`, `priority`, `created_at`);
CREATE INDEX `idx_valves_active_state` ON `valves` (`status`, `current_state`);

-- Insert default valve control settings
INSERT INTO `settings` (`id`, `key`, `value`, `group`) VALUES
(UUID(), 'valve_command_timeout', '30', 'valve_control'),
(UUID(), 'valve_max_retries', '3', 'valve_control'),
(UUID(), 'valve_auto_close_enabled', 'true', 'valve_control'),
(UUID(), 'valve_emergency_close_pressure', '15.0', 'valve_control'),
(UUID(), 'valve_maintenance_interval_days', '90', 'valve_control'),
(UUID(), 'valve_battery_low_threshold', '20.0', 'valve_control'),
(UUID(), 'valve_signal_weak_threshold', '-80', 'valve_control'),
(UUID(), 'valve_command_queue_max_size', '1000', 'valve_control')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Create view for valve status overview
CREATE OR REPLACE VIEW `valve_status_overview` AS
SELECT 
    v.id,
    v.valve_id,
    v.valve_type,
    v.current_state,
    v.status,
    v.battery_level,
    v.signal_strength,
    v.operating_pressure,
    v.last_command,
    v.last_command_at,
    v.last_response_at,
    m.meter_id,
    m.last_credit,
    m.auto_valve_control,
    m.low_credit_threshold,
    p.name as property_name,
    c.company_name as client_name,
    CASE 
        WHEN v.status = 'offline' THEN 'offline'
        WHEN v.status = 'error' THEN 'error'
        WHEN v.status = 'maintenance' THEN 'maintenance'
        WHEN v.battery_level IS NOT NULL AND v.battery_level < 20 THEN 'low_battery'
        WHEN v.signal_strength IS NOT NULL AND v.signal_strength < -80 THEN 'weak_signal'
        WHEN v.operating_pressure IS NOT NULL AND v.operating_pressure > v.max_pressure * 0.9 THEN 'high_pressure'
        WHEN m.last_credit <= m.low_credit_threshold THEN 'low_credit'
        ELSE 'normal'
    END as health_status,
    (SELECT COUNT(*) FROM valve_commands vc WHERE vc.valve_id = v.id AND vc.status IN ('pending', 'sent')) as pending_commands,
    (SELECT COUNT(*) FROM valve_alerts va WHERE va.valve_id = v.id AND va.is_resolved = 0) as active_alerts
FROM valves v
JOIN meters m ON v.meter_id = m.id
JOIN properties p ON v.property_id = p.id
JOIN clients c ON p.client_id = c.id
WHERE v.deleted_at IS NULL;

-- Create view for command queue monitoring
CREATE OR REPLACE VIEW `valve_command_queue` AS
SELECT 
    vc.id,
    vc.valve_id,
    v.valve_id as valve_identifier,
    vc.command_type,
    vc.priority,
    vc.status,
    vc.retry_count,
    vc.max_retries,
    vc.created_at,
    vc.expires_at,
    u.name as initiated_by_name,
    TIMESTAMPDIFF(SECOND, vc.created_at, NOW()) as age_seconds,
    CASE 
        WHEN vc.expires_at IS NOT NULL AND vc.expires_at < NOW() THEN 'expired'
        WHEN vc.status = 'pending' AND TIMESTAMPDIFF(SECOND, vc.created_at, NOW()) > 300 THEN 'stale'
        ELSE 'normal'
    END as queue_status
FROM valve_commands vc
JOIN valves v ON vc.valve_id = v.id
JOIN users u ON vc.initiated_by = u.id
WHERE vc.status IN ('pending', 'sent', 'acknowledged')
ORDER BY 
    FIELD(vc.priority, 'emergency', 'high', 'normal', 'low'),
    vc.created_at ASC;