-- Create initial tables for IndoWater System

-- Users Table (for all types of users)
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('superadmin', 'client', 'customer') NOT NULL DEFAULT 'customer',
    `status` ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
    `email_verified_at` TIMESTAMP NULL,
    `last_login_at` TIMESTAMP NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients Table (Water Authorities)
CREATE TABLE IF NOT EXISTS `clients` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `user_id` CHAR(36) NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `contact_person` VARCHAR(255) NOT NULL,
    `contact_email` VARCHAR(255) NOT NULL,
    `contact_phone` VARCHAR(20) NOT NULL,
    `logo` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `tax_id` VARCHAR(50) NULL,
    `service_fee_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    `service_fee_value` DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    `status` ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Properties Table
CREATE TABLE IF NOT EXISTS `properties` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('residential', 'commercial', 'industrial', 'dormitory', 'rental', 'other') NOT NULL DEFAULT 'residential',
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `user_id` CHAR(36) NOT NULL,
    `client_id` CHAR(36) NOT NULL,
    `customer_number` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `id_card_number` VARCHAR(50) NULL,
    `id_card_image` VARCHAR(255) NULL,
    `status` ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_customer_number` (`client_id`, `customer_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meters Table
CREATE TABLE IF NOT EXISTS `meters` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` VARCHAR(50) NOT NULL,
    `customer_id` CHAR(36) NOT NULL,
    `property_id` CHAR(36) NOT NULL,
    `installation_date` DATE NOT NULL,
    `meter_type` VARCHAR(50) NOT NULL,
    `meter_model` VARCHAR(50) NOT NULL,
    `meter_serial` VARCHAR(50) NOT NULL,
    `firmware_version` VARCHAR(20) NOT NULL,
    `hardware_version` VARCHAR(20) NOT NULL,
    `location_description` TEXT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `status` ENUM('active', 'inactive', 'maintenance', 'disconnected') NOT NULL DEFAULT 'active',
    `last_reading` DECIMAL(15, 3) NOT NULL DEFAULT 0,
    `last_reading_at` TIMESTAMP NULL,
    `last_credit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `last_credit_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_meter_id` (`meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meter Readings Table
CREATE TABLE IF NOT EXISTS `meter_readings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` CHAR(36) NOT NULL,
    `reading` DECIMAL(15, 3) NOT NULL,
    `flow_rate` DECIMAL(10, 2) NULL COMMENT 'L/min',
    `battery_level` DECIMAL(5, 2) NULL COMMENT 'Percentage',
    `signal_strength` INT NULL,
    `temperature` DECIMAL(5, 2) NULL COMMENT 'Celsius',
    `pressure` DECIMAL(10, 2) NULL,
    `reading_type` ENUM('automatic', 'manual') NOT NULL DEFAULT 'automatic',
    `reading_status` ENUM('normal', 'suspicious', 'error') NOT NULL DEFAULT 'normal',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credits Table
CREATE TABLE IF NOT EXISTS `credits` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `previous_balance` DECIMAL(15, 2) NOT NULL,
    `new_balance` DECIMAL(15, 2) NOT NULL,
    `transaction_id` CHAR(36) NULL,
    `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `customer_id` CHAR(36) NOT NULL,
    `credit_id` CHAR(36) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `payment_gateway` ENUM('midtrans', 'doku', 'manual') NOT NULL,
    `transaction_id` VARCHAR(100) NULL,
    `transaction_time` TIMESTAMP NULL,
    `status` ENUM('pending', 'success', 'failed', 'refunded', 'expired') NOT NULL DEFAULT 'pending',
    `payment_details` JSON NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`credit_id`) REFERENCES `credits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Fees Table
CREATE TABLE IF NOT EXISTS `service_fees` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `payment_id` CHAR(36) NOT NULL,
    `credit_id` CHAR(36) NOT NULL,
    `fee_type` ENUM('percentage', 'fixed') NOT NULL,
    `fee_value` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('pending', 'invoiced', 'paid') NOT NULL DEFAULT 'pending',
    `invoice_id` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`credit_id`) REFERENCES `credits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `issue_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS `invoice_items` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `invoice_id` CHAR(36) NOT NULL,
    `service_fee_id` CHAR(36) NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_fee_id`) REFERENCES `service_fees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `data` JSON NULL,
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table
CREATE TABLE IF NOT EXISTS `settings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `group` VARCHAR(50) NOT NULL DEFAULT 'general',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Gateway Settings Table
CREATE TABLE IF NOT EXISTS `payment_gateway_settings` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NULL COMMENT 'NULL for system-wide settings',
    `gateway` ENUM('midtrans', 'doku') NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `is_production` TINYINT(1) NOT NULL DEFAULT 0,
    `credentials` JSON NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_client_gateway` (`client_id`, `gateway`),
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tariffs Table
CREATE TABLE IF NOT EXISTS `tariffs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `property_type` ENUM('residential', 'commercial', 'industrial', 'dormitory', 'rental', 'other') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(15, 2) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tariff Tiers Table (for volume-based pricing)
CREATE TABLE IF NOT EXISTS `tariff_tiers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `tariff_id` CHAR(36) NOT NULL,
    `min_volume` DECIMAL(15, 3) NOT NULL,
    `max_volume` DECIMAL(15, 3) NULL COMMENT 'NULL means unlimited',
    `price_per_unit` DECIMAL(15, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36) NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTA Updates Table
CREATE TABLE IF NOT EXISTS `ota_updates` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `version` VARCHAR(20) NOT NULL,
    `description` TEXT NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size` INT NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,
    `release_notes` TEXT NULL,
    `is_mandatory` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('draft', 'published', 'deprecated') NOT NULL DEFAULT 'draft',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meter OTA Updates Table
CREATE TABLE IF NOT EXISTS `meter_ota_updates` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `meter_id` CHAR(36) NOT NULL,
    `ota_update_id` CHAR(36) NOT NULL,
    `status` ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `started_at` TIMESTAMP NULL,
    `completed_at` TIMESTAMP NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ota_update_id`) REFERENCES `ota_updates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL PRIMARY KEY,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Verification Tokens Table
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;