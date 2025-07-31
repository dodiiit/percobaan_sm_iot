-- Enhance Properties Table for Comprehensive Property Management
-- This migration adds property verification, additional property types, and comprehensive details

-- First, update the properties table with enhanced fields
ALTER TABLE `properties` 
MODIFY COLUMN `type` ENUM(
    'residential', 
    'commercial', 
    'industrial', 
    'dormitory', 
    'rental_home', 
    'boarding_house', 
    'apartment', 
    'office_building', 
    'shopping_center', 
    'warehouse', 
    'factory', 
    'hotel', 
    'restaurant', 
    'hospital', 
    'school', 
    'government', 
    'other'
) NOT NULL DEFAULT 'residential';

-- Add verification and additional property details
ALTER TABLE `properties` 
ADD COLUMN `property_code` VARCHAR(50) NULL UNIQUE AFTER `client_id`,
ADD COLUMN `description` TEXT NULL AFTER `name`,
ADD COLUMN `total_area` DECIMAL(10, 2) NULL COMMENT 'Total area in square meters' AFTER `longitude`,
ADD COLUMN `building_area` DECIMAL(10, 2) NULL COMMENT 'Building area in square meters' AFTER `total_area`,
ADD COLUMN `floors` INT NULL COMMENT 'Number of floors' AFTER `building_area`,
ADD COLUMN `units` INT NULL COMMENT 'Number of units (for apartments, boarding houses, etc.)' AFTER `floors`,
ADD COLUMN `year_built` YEAR NULL AFTER `units`,
ADD COLUMN `owner_name` VARCHAR(255) NULL AFTER `year_built`,
ADD COLUMN `owner_phone` VARCHAR(20) NULL AFTER `owner_name`,
ADD COLUMN `owner_email` VARCHAR(255) NULL AFTER `owner_phone`,
ADD COLUMN `manager_name` VARCHAR(255) NULL AFTER `owner_email`,
ADD COLUMN `manager_phone` VARCHAR(20) NULL AFTER `manager_name`,
ADD COLUMN `manager_email` VARCHAR(255) NULL AFTER `manager_phone`,
ADD COLUMN `verification_status` ENUM('pending', 'under_review', 'approved', 'rejected', 'requires_update') NOT NULL DEFAULT 'pending' AFTER `manager_email`,
ADD COLUMN `verification_notes` TEXT NULL AFTER `verification_status`,
ADD COLUMN `verified_by` CHAR(36) NULL AFTER `verification_notes`,
ADD COLUMN `verified_at` TIMESTAMP NULL AFTER `verified_by`,
ADD COLUMN `rejection_reason` TEXT NULL AFTER `verified_at`,
ADD COLUMN `documents` JSON NULL COMMENT 'Property documents (certificates, permits, etc.)' AFTER `rejection_reason`,
ADD COLUMN `amenities` JSON NULL COMMENT 'Property amenities and features' AFTER `documents`,
ADD COLUMN `water_source` ENUM('municipal', 'well', 'mixed', 'other') NOT NULL DEFAULT 'municipal' AFTER `amenities`,
ADD COLUMN `water_pressure` ENUM('low', 'medium', 'high') NULL AFTER `water_source`,
ADD COLUMN `backup_water` BOOLEAN NOT NULL DEFAULT FALSE AFTER `water_pressure`,
ADD COLUMN `emergency_contact_name` VARCHAR(255) NULL AFTER `backup_water`,
ADD COLUMN `emergency_contact_phone` VARCHAR(20) NULL AFTER `emergency_contact_name`,
MODIFY COLUMN `status` ENUM('active', 'inactive', 'maintenance', 'suspended') NOT NULL DEFAULT 'active';

-- Add foreign key for verified_by
ALTER TABLE `properties` 
ADD CONSTRAINT `fk_properties_verified_by` 
FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX `idx_properties_client_id` ON `properties` (`client_id`);
CREATE INDEX `idx_properties_type` ON `properties` (`type`);
CREATE INDEX `idx_properties_verification_status` ON `properties` (`verification_status`);
CREATE INDEX `idx_properties_status` ON `properties` (`status`);
CREATE INDEX `idx_properties_city` ON `properties` (`city`);
CREATE INDEX `idx_properties_province` ON `properties` (`province`);

-- Create Property Verification History Table
CREATE TABLE IF NOT EXISTS `property_verification_history` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `property_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL COMMENT 'User who performed the action',
    `action` ENUM('submitted', 'under_review', 'approved', 'rejected', 'update_requested', 'resubmitted') NOT NULL,
    `previous_status` ENUM('pending', 'under_review', 'approved', 'rejected', 'requires_update') NULL,
    `new_status` ENUM('pending', 'under_review', 'approved', 'rejected', 'requires_update') NOT NULL,
    `notes` TEXT NULL,
    `documents_changed` JSON NULL COMMENT 'List of documents that were changed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for verification history
CREATE INDEX `idx_property_verification_history_property_id` ON `property_verification_history` (`property_id`);
CREATE INDEX `idx_property_verification_history_user_id` ON `property_verification_history` (`user_id`);
CREATE INDEX `idx_property_verification_history_action` ON `property_verification_history` (`action`);

-- Create Property Documents Table for better document management
CREATE TABLE IF NOT EXISTS `property_documents` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `property_id` CHAR(36) NOT NULL,
    `document_type` ENUM(
        'ownership_certificate', 
        'building_permit', 
        'occupancy_permit', 
        'tax_certificate', 
        'environmental_permit', 
        'fire_safety_certificate', 
        'water_connection_permit', 
        'business_license', 
        'insurance_policy', 
        'floor_plan', 
        'site_plan', 
        'photos', 
        'other'
    ) NOT NULL,
    `document_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NOT NULL COMMENT 'File size in bytes',
    `mime_type` VARCHAR(100) NOT NULL,
    `uploaded_by` CHAR(36) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `verified_by` CHAR(36) NULL,
    `verified_at` TIMESTAMP NULL,
    `expiry_date` DATE NULL COMMENT 'For documents with expiration dates',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for property documents
CREATE INDEX `idx_property_documents_property_id` ON `property_documents` (`property_id`);
CREATE INDEX `idx_property_documents_type` ON `property_documents` (`document_type`);
CREATE INDEX `idx_property_documents_uploaded_by` ON `property_documents` (`uploaded_by`);
CREATE INDEX `idx_property_documents_is_verified` ON `property_documents` (`is_verified`);

-- Create Property Meter Association Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS `property_meters` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `property_id` CHAR(36) NOT NULL,
    `meter_id` CHAR(36) NOT NULL,
    `installation_location` VARCHAR(255) NULL COMMENT 'Specific location within property',
    `is_main_meter` BOOLEAN NOT NULL DEFAULT FALSE,
    `meter_purpose` ENUM('main_supply', 'backup', 'irrigation', 'pool', 'commercial_unit', 'residential_unit', 'other') NOT NULL DEFAULT 'main_supply',
    `status` ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
    `installed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `removed_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`meter_id`) REFERENCES `meters` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_property_meter` (`property_id`, `meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for property meters
CREATE INDEX `idx_property_meters_property_id` ON `property_meters` (`property_id`);
CREATE INDEX `idx_property_meters_meter_id` ON `property_meters` (`meter_id`);
CREATE INDEX `idx_property_meters_is_main` ON `property_meters` (`is_main_meter`);
CREATE INDEX `idx_property_meters_purpose` ON `property_meters` (`meter_purpose`);

-- Update meters table to remove direct property_id reference (now handled through property_meters)
-- Note: This is commented out to maintain backward compatibility
-- ALTER TABLE `meters` DROP FOREIGN KEY `fk_meters_property_id`;
-- ALTER TABLE `meters` DROP COLUMN `property_id`;