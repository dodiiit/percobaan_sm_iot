-- Add Rate Management Features
-- This migration adds tables for dynamic pricing, seasonal rates, minimum charges, bulk discounts, and dynamic discounts

-- First, enhance the existing tariffs table with additional fields
ALTER TABLE `tariffs` 
ADD COLUMN `is_seasonal` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_active`,
ADD COLUMN `has_minimum_charge` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_seasonal`,
ADD COLUMN `minimum_charge_amount` DECIMAL(15, 2) NULL AFTER `has_minimum_charge`,
ADD COLUMN `has_bulk_discount` TINYINT(1) NOT NULL DEFAULT 0 AFTER `minimum_charge_amount`,
ADD COLUMN `has_dynamic_discount` TINYINT(1) NOT NULL DEFAULT 0 AFTER `has_bulk_discount`,
ADD COLUMN `effective_from` DATE NULL AFTER `has_dynamic_discount`,
ADD COLUMN `effective_to` DATE NULL AFTER `effective_from`;

-- Create Seasonal Rates Table
CREATE TABLE IF NOT EXISTS `seasonal_rates` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `tariff_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `rate_adjustment_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    `rate_adjustment_value` DECIMAL(15, 2) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Bulk Discount Tiers Table
CREATE TABLE IF NOT EXISTS `bulk_discount_tiers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `tariff_id` CHAR(36) NOT NULL,
    `min_volume` DECIMAL(15, 3) NOT NULL,
    `max_volume` DECIMAL(15, 3) NULL COMMENT 'NULL means unlimited',
    `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    `discount_value` DECIMAL(15, 2) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Dynamic Discount Rules Table
CREATE TABLE IF NOT EXISTS `dynamic_discount_rules` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `tariff_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `rule_type` ENUM('time_based', 'volume_based', 'customer_based', 'inventory_based', 'combined') NOT NULL,
    `conditions` JSON NOT NULL COMMENT 'JSON object with rule conditions',
    `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    `discount_value` DECIMAL(15, 2) NOT NULL,
    `priority` INT NOT NULL DEFAULT 0 COMMENT 'Higher number means higher priority',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `max_discount_amount` DECIMAL(15, 2) NULL COMMENT 'Maximum discount amount allowed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Property Tariff Assignment Table
CREATE TABLE IF NOT EXISTS `property_tariffs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `property_id` CHAR(36) NOT NULL,
    `tariff_id` CHAR(36) NOT NULL,
    `effective_from` DATE NOT NULL,
    `effective_to` DATE NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Applied Discounts Table (for tracking applied discounts)
CREATE TABLE IF NOT EXISTS `applied_discounts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `customer_id` CHAR(36) NOT NULL,
    `meter_id` CHAR(36) NOT NULL,
    `reading_id` CHAR(36) NULL,
    `payment_id` CHAR(36) NULL,
    `discount_source_type` ENUM('seasonal_rate', 'bulk_discount', 'dynamic_discount') NOT NULL,
    `discount_source_id` CHAR(36) NOT NULL COMMENT 'ID of the discount source (seasonal_rates, bulk_discount_tiers, or dynamic_discount_rules)',
    `original_amount` DECIMAL(15, 2) NOT NULL,
    `discount_amount` DECIMAL(15, 2) NOT NULL,
    `final_amount` DECIMAL(15, 2) NOT NULL,
    `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reading_id`) REFERENCES `meter_readings` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX `idx_seasonal_rates_tariff_id` ON `seasonal_rates` (`tariff_id`);
CREATE INDEX `idx_seasonal_rates_date_range` ON `seasonal_rates` (`start_date`, `end_date`);
CREATE INDEX `idx_seasonal_rates_is_active` ON `seasonal_rates` (`is_active`);

CREATE INDEX `idx_bulk_discount_tiers_tariff_id` ON `bulk_discount_tiers` (`tariff_id`);
CREATE INDEX `idx_bulk_discount_tiers_volume_range` ON `bulk_discount_tiers` (`min_volume`, `max_volume`);
CREATE INDEX `idx_bulk_discount_tiers_is_active` ON `bulk_discount_tiers` (`is_active`);

CREATE INDEX `idx_dynamic_discount_rules_tariff_id` ON `dynamic_discount_rules` (`tariff_id`);
CREATE INDEX `idx_dynamic_discount_rules_rule_type` ON `dynamic_discount_rules` (`rule_type`);
CREATE INDEX `idx_dynamic_discount_rules_priority` ON `dynamic_discount_rules` (`priority`);
CREATE INDEX `idx_dynamic_discount_rules_is_active` ON `dynamic_discount_rules` (`is_active`);
CREATE INDEX `idx_dynamic_discount_rules_date_range` ON `dynamic_discount_rules` (`start_date`, `end_date`);

CREATE INDEX `idx_property_tariffs_property_id` ON `property_tariffs` (`property_id`);
CREATE INDEX `idx_property_tariffs_tariff_id` ON `property_tariffs` (`tariff_id`);
CREATE INDEX `idx_property_tariffs_date_range` ON `property_tariffs` (`effective_from`, `effective_to`);
CREATE INDEX `idx_property_tariffs_is_active` ON `property_tariffs` (`is_active`);

CREATE INDEX `idx_applied_discounts_customer_id` ON `applied_discounts` (`customer_id`);
CREATE INDEX `idx_applied_discounts_meter_id` ON `applied_discounts` (`meter_id`);
CREATE INDEX `idx_applied_discounts_reading_id` ON `applied_discounts` (`reading_id`);
CREATE INDEX `idx_applied_discounts_payment_id` ON `applied_discounts` (`payment_id`);
CREATE INDEX `idx_applied_discounts_source_type` ON `applied_discounts` (`discount_source_type`);
CREATE INDEX `idx_applied_discounts_source_id` ON `applied_discounts` (`discount_source_id`);
CREATE INDEX `idx_applied_discounts_applied_at` ON `applied_discounts` (`applied_at`);