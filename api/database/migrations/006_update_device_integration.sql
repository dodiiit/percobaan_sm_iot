-- Update Device Integration
-- This migration updates tables to support Arduino/NodeMCU firmware integration

-- Add device-specific fields to meters table
ALTER TABLE `meters` 
ADD COLUMN `device_id` VARCHAR(50) NULL COMMENT 'Device chip ID from ESP8266' AFTER `meter_serial`,
ADD COLUMN `current_voltage` DECIMAL(5, 2) NULL COMMENT 'Current device voltage',
ADD COLUMN `valve_status` ENUM('open', 'closed', 'unknown') NOT NULL DEFAULT 'unknown' COMMENT 'Current valve status from device',
ADD COLUMN `is_unlocked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Device unlock status for technician access',
ADD COLUMN `last_command_ack_at` TIMESTAMP NULL COMMENT 'Last command acknowledgment time',
ADD INDEX `idx_meter_device_id` (`device_id`),
ADD INDEX `idx_meter_unlocked` (`is_unlocked`);

-- Update valve_commands table to support firmware command types
ALTER TABLE `valve_commands` 
MODIFY COLUMN `command_type` ENUM('valve_open', 'valve_close', 'partial_open', 'emergency_close', 'status_check', 'reset', 'arduino_config_update') NOT NULL,
ADD COLUMN `config_data` JSON NULL COMMENT 'Configuration data for arduino_config_update commands';

-- Create meter_readings table for device data
CREATE TABLE IF NOT EXISTS `meter_readings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` CHAR(36) NOT NULL COMMENT 'Internal meter ID',
    `flow_rate` DECIMAL(10, 3) NOT NULL COMMENT 'Flow rate in LPM',
    `reading_value` DECIMAL(15, 6) NOT NULL COMMENT 'Meter reading in m3',
    `voltage` DECIMAL(5, 2) NOT NULL COMMENT 'Device voltage',
    `door_status` TINYINT(1) NOT NULL COMMENT '0=closed, 1=open',
    `valve_status` ENUM('open', 'closed', 'unknown') NOT NULL,
    `status_message` VARCHAR(50) NOT NULL DEFAULT 'normal' COMMENT 'Status from device',
    `reading_time` TIMESTAMP NOT NULL COMMENT 'Time when reading was taken',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    INDEX `idx_reading_meter` (`meter_id`),
    INDEX `idx_reading_time` (`reading_time`),
    INDEX `idx_reading_status` (`status_message`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create meter_tariffs table for dynamic tariff management
CREATE TABLE IF NOT EXISTS `meter_tariffs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` CHAR(36) NOT NULL COMMENT 'Internal meter ID',
    `tariff_rate` DECIMAL(15, 2) NOT NULL COMMENT 'Tariff rate per m3 in Rupiah',
    `effective_from` TIMESTAMP NOT NULL COMMENT 'When this tariff becomes effective',
    `effective_until` TIMESTAMP NULL COMMENT 'When this tariff expires',
    `status` ENUM('active', 'inactive', 'scheduled') NOT NULL DEFAULT 'active',
    `created_by` CHAR(36) NOT NULL COMMENT 'User who created this tariff',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_tariff_meter` (`meter_id`),
    INDEX `idx_tariff_effective` (`effective_from`, `effective_until`),
    INDEX `idx_tariff_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update valve status history to support new command types
ALTER TABLE `valve_status_history`
MODIFY COLUMN `change_reason` ENUM('manual_command', 'auto_close', 'emergency_close', 'system_command', 'device_report', 'maintenance', 'valve_open', 'valve_close') NOT NULL;

-- Insert default tariff for existing meters
INSERT INTO `meter_tariffs` (`id`, `meter_id`, `tariff_rate`, `effective_from`, `status`, `created_by`)
SELECT 
    UUID(),
    m.id,
    5000.00,
    NOW(),
    'active',
    (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)
FROM `meters` m
WHERE NOT EXISTS (
    SELECT 1 FROM `meter_tariffs` mt 
    WHERE mt.meter_id = m.id AND mt.status = 'active'
);

-- Add device integration settings
INSERT INTO `settings` (`id`, `key`, `value`, `group`) VALUES
(UUID(), 'device_jwt_secret', 'your-device-jwt-secret-key', 'device_integration'),
(UUID(), 'device_jwt_expiry_days', '365', 'device_integration'),
(UUID(), 'device_provisioning_enabled', 'true', 'device_integration'),
(UUID(), 'device_auto_registration', 'true', 'device_integration'),
(UUID(), 'device_command_timeout', '30', 'device_integration'),
(UUID(), 'device_reading_interval', '5', 'device_integration'),
(UUID(), 'device_default_k_factor', '7.5', 'device_integration'),
(UUID(), 'device_default_distance_tolerance', '15.0', 'device_integration')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Create view for device status monitoring
CREATE OR REPLACE VIEW `device_status_overview` AS
SELECT 
    m.id,
    m.meter_id,
    m.device_id,
    m.status,
    m.current_voltage,
    m.valve_status,
    m.is_unlocked,
    m.last_reading,
    m.last_reading_at,
    m.last_credit,
    m.last_command_ack_at,
    p.name as property_name,
    c.company_name as client_name,
    CASE 
        WHEN m.current_voltage IS NOT NULL AND m.current_voltage < 3.0 THEN 'low_voltage'
        WHEN m.last_reading_at IS NULL OR m.last_reading_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 'offline'
        WHEN m.last_credit <= m.low_credit_threshold THEN 'low_credit'
        WHEN m.is_unlocked = 1 THEN 'unlocked'
        ELSE 'normal'
    END as device_status,
    (SELECT COUNT(*) FROM valve_commands vc 
     JOIN valves v ON vc.valve_id = v.id 
     WHERE v.meter_id = m.id AND vc.status IN ('pending', 'sent')) as pending_commands,
    (SELECT reading_value FROM meter_readings mr 
     WHERE mr.meter_id = m.id 
     ORDER BY mr.reading_time DESC LIMIT 1) as latest_reading,
    (SELECT reading_time FROM meter_readings mr 
     WHERE mr.meter_id = m.id 
     ORDER BY mr.reading_time DESC LIMIT 1) as latest_reading_time
FROM meters m
JOIN properties p ON m.property_id = p.id
JOIN clients c ON p.client_id = c.id
WHERE m.deleted_at IS NULL;