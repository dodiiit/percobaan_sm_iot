-- Service Fee Management Migration

-- Service Fee Plans Table
CREATE TABLE IF NOT EXISTS `service_fee_plans` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Fee Components Table
CREATE TABLE IF NOT EXISTS `service_fee_components` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `plan_id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `fee_type` ENUM('percentage', 'fixed', 'tiered_percentage', 'tiered_fixed') NOT NULL,
    `fee_value` DECIMAL(10, 2) NOT NULL,
    `min_transaction_amount` DECIMAL(15, 2) NULL,
    `max_transaction_amount` DECIMAL(15, 2) NULL,
    `min_fee_amount` DECIMAL(15, 2) NULL,
    `max_fee_amount` DECIMAL(15, 2) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`plan_id`) REFERENCES `service_fee_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Fee Tiers Table
CREATE TABLE IF NOT EXISTS `service_fee_tiers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `component_id` CHAR(36) NOT NULL,
    `min_amount` DECIMAL(15, 2) NOT NULL,
    `max_amount` DECIMAL(15, 2) NULL,
    `fee_value` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`component_id`) REFERENCES `service_fee_components` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Service Fee Plan Assignment Table
CREATE TABLE IF NOT EXISTS `client_service_fee_plans` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `plan_id` CHAR(36) NOT NULL,
    `effective_from` DATE NOT NULL,
    `effective_to` DATE NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id`) REFERENCES `service_fee_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Fee Transactions Table
CREATE TABLE IF NOT EXISTS `service_fee_transactions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `payment_id` CHAR(36) NOT NULL,
    `plan_id` CHAR(36) NOT NULL,
    `component_id` CHAR(36) NOT NULL,
    `transaction_amount` DECIMAL(15, 2) NOT NULL,
    `fee_amount` DECIMAL(15, 2) NOT NULL,
    `fee_type` ENUM('percentage', 'fixed', 'tiered_percentage', 'tiered_fixed') NOT NULL,
    `fee_value` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'invoiced', 'paid', 'waived') NOT NULL DEFAULT 'pending',
    `invoice_id` CHAR(36) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`plan_id`) REFERENCES `service_fee_plans` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`component_id`) REFERENCES `service_fee_components` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Fee Invoices Table
CREATE TABLE IF NOT EXISTS `service_fee_invoices` (
    `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    `client_id` CHAR(36) NOT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('draft', 'issued', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
    `issue_date` DATE NULL,
    `due_date` DATE NULL,
    `paid_date` DATE NULL,
    `billing_period_start` DATE NOT NULL,
    `billing_period_end` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add service_fee_plan_id to clients table
ALTER TABLE `clients` 
ADD COLUMN `service_fee_plan_id` CHAR(36) NULL AFTER `service_fee_value`,
ADD FOREIGN KEY (`service_fee_plan_id`) REFERENCES `service_fee_plans` (`id`) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_service_fee_transactions_client_id ON service_fee_transactions(client_id);
CREATE INDEX idx_service_fee_transactions_payment_id ON service_fee_transactions(payment_id);
CREATE INDEX idx_service_fee_transactions_status ON service_fee_transactions(status);
CREATE INDEX idx_service_fee_transactions_created_at ON service_fee_transactions(created_at);
CREATE INDEX idx_service_fee_invoices_client_id ON service_fee_invoices(client_id);
CREATE INDEX idx_service_fee_invoices_status ON service_fee_invoices(status);
CREATE INDEX idx_service_fee_invoices_billing_period ON service_fee_invoices(billing_period_start, billing_period_end);