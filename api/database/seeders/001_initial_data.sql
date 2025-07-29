-- Initial data for IndoWater System

-- Insert Superadmin User
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `email_verified_at`)
VALUES (
    UUID(),
    'IndoWater Admin',
    'admin@indowater.example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    '+6281234567890',
    'superadmin',
    'active',
    CURRENT_TIMESTAMP
);

-- Insert Default Settings
INSERT INTO `settings` (`id`, `key`, `value`, `group`)
VALUES
    (UUID(), 'app_name', 'IndoWater System', 'general'),
    (UUID(), 'app_logo', 'logo.png', 'general'),
    (UUID(), 'app_favicon', 'favicon.ico', 'general'),
    (UUID(), 'app_theme', 'light', 'general'),
    (UUID(), 'app_language', 'id', 'general'),
    (UUID(), 'app_timezone', 'Asia/Jakarta', 'general'),
    (UUID(), 'app_currency', 'IDR', 'general'),
    (UUID(), 'app_currency_symbol', 'Rp', 'general'),
    (UUID(), 'app_decimal_separator', ',', 'general'),
    (UUID(), 'app_thousand_separator', '.', 'general'),
    (UUID(), 'app_decimal_places', '2', 'general'),
    (UUID(), 'app_date_format', 'd/m/Y', 'general'),
    (UUID(), 'app_time_format', 'H:i', 'general'),
    (UUID(), 'app_datetime_format', 'd/m/Y H:i', 'general'),
    (UUID(), 'app_footer_text', '© 2025 IndoWater System. All rights reserved.', 'general'),
    (UUID(), 'app_contact_email', 'info@indowater.example.com', 'general'),
    (UUID(), 'app_contact_phone', '+6281234567890', 'general'),
    (UUID(), 'app_contact_address', 'Jl. Sudirman No. 123, Jakarta, Indonesia', 'general'),
    (UUID(), 'app_social_facebook', 'https://facebook.com/indowater', 'general'),
    (UUID(), 'app_social_twitter', 'https://twitter.com/indowater', 'general'),
    (UUID(), 'app_social_instagram', 'https://instagram.com/indowater', 'general'),
    (UUID(), 'app_social_linkedin', 'https://linkedin.com/company/indowater', 'general'),
    (UUID(), 'app_social_youtube', 'https://youtube.com/indowater', 'general'),
    (UUID(), 'min_credit_amount', '10000', 'payment'),
    (UUID(), 'credit_denominations', '[10000, 20000, 30000, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000]', 'payment'),
    (UUID(), 'low_balance_threshold', '5000', 'notification'),
    (UUID(), 'enable_email_notifications', '1', 'notification'),
    (UUID(), 'enable_sms_notifications', '1', 'notification'),
    (UUID(), 'enable_push_notifications', '1', 'notification'),
    (UUID(), 'enable_whatsapp_notifications', '1', 'notification'),
    (UUID(), 'enable_registration', '1', 'feature'),
    (UUID(), 'enable_password_reset', '1', 'feature'),
    (UUID(), 'enable_email_verification', '1', 'feature'),
    (UUID(), 'enable_social_login', '0', 'feature'),
    (UUID(), 'enable_two_factor_auth', '0', 'feature'),
    (UUID(), 'default_service_fee_type', 'percentage', 'service_fee'),
    (UUID(), 'default_service_fee_value', '5', 'service_fee');

-- Insert Demo Client
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `email_verified_at`)
VALUES (
    UUID(),
    'Demo Client',
    'client@indowater.example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    '+6281234567891',
    'client',
    'active',
    CURRENT_TIMESTAMP
);

-- Get the client user ID
SET @client_user_id = (SELECT `id` FROM `users` WHERE `email` = 'client@indowater.example.com');

-- Insert Client details
INSERT INTO `clients` (
    `id`,
    `user_id`,
    `company_name`,
    `address`,
    `city`,
    `province`,
    `postal_code`,
    `contact_person`,
    `contact_email`,
    `contact_phone`,
    `logo`,
    `website`,
    `tax_id`,
    `service_fee_type`,
    `service_fee_value`,
    `status`
)
VALUES (
    UUID(),
    @client_user_id,
    'Jakarta Water Authority',
    'Jl. Gatot Subroto No. 456',
    'Jakarta',
    'DKI Jakarta',
    '12345',
    'John Doe',
    'contact@jakartawater.example.com',
    '+6281234567892',
    'jakarta_water_logo.png',
    'https://jakartawater.example.com',
    '123456789012345',
    'percentage',
    5.00,
    'active'
);

-- Get the client ID
SET @client_id = (SELECT `id` FROM `clients` WHERE `user_id` = @client_user_id);

-- Insert Demo Property
INSERT INTO `properties` (
    `id`,
    `client_id`,
    `name`,
    `type`,
    `address`,
    `city`,
    `province`,
    `postal_code`,
    `latitude`,
    `longitude`,
    `status`
)
VALUES (
    UUID(),
    @client_id,
    'Taman Anggrek Residence',
    'residential',
    'Jl. Taman Anggrek No. 789',
    'Jakarta',
    'DKI Jakarta',
    '12346',
    -6.1751,
    106.7894,
    'active'
);

-- Get the property ID
SET @property_id = (SELECT `id` FROM `properties` WHERE `name` = 'Taman Anggrek Residence');

-- Insert Demo Customer User
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `email_verified_at`)
VALUES (
    UUID(),
    'Demo Customer',
    'customer@indowater.example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    '+6281234567893',
    'customer',
    'active',
    CURRENT_TIMESTAMP
);

-- Get the customer user ID
SET @customer_user_id = (SELECT `id` FROM `users` WHERE `email` = 'customer@indowater.example.com');

-- Insert Demo Customer
INSERT INTO `customers` (
    `id`,
    `user_id`,
    `client_id`,
    `customer_number`,
    `first_name`,
    `last_name`,
    `address`,
    `city`,
    `province`,
    `postal_code`,
    `phone`,
    `email`,
    `id_card_number`,
    `status`
)
VALUES (
    UUID(),
    @customer_user_id,
    @client_id,
    'CUST-001',
    'Jane',
    'Smith',
    'Taman Anggrek Residence Block A5 No. 12',
    'Jakarta',
    'DKI Jakarta',
    '12346',
    '+6281234567893',
    'customer@indowater.example.com',
    '1234567890123456',
    'active'
);

-- Get the customer ID
SET @customer_id = (SELECT `id` FROM `customers` WHERE `user_id` = @customer_user_id);

-- Insert Demo Meter
INSERT INTO `meters` (
    `id`,
    `meter_id`,
    `customer_id`,
    `property_id`,
    `installation_date`,
    `meter_type`,
    `meter_model`,
    `meter_serial`,
    `firmware_version`,
    `hardware_version`,
    `location_description`,
    `latitude`,
    `longitude`,
    `status`,
    `last_reading`,
    `last_reading_at`,
    `last_credit`,
    `last_credit_at`
)
VALUES (
    UUID(),
    'METER-001',
    @customer_id,
    @property_id,
    '2025-01-15',
    'Smart Prepaid',
    'IndoWater SP-100',
    'SN12345678',
    '1.0.0',
    'HW-1.0',
    'Front yard, near the gate',
    -6.1752,
    106.7895,
    'active',
    0.000,
    CURRENT_TIMESTAMP,
    100000.00,
    CURRENT_TIMESTAMP
);

-- Get the meter ID
SET @meter_id = (SELECT `id` FROM `meters` WHERE `meter_id` = 'METER-001');

-- Insert Demo Credit
INSERT INTO `credits` (
    `id`,
    `meter_id`,
    `customer_id`,
    `amount`,
    `previous_balance`,
    `new_balance`,
    `status`
)
VALUES (
    UUID(),
    @meter_id,
    @customer_id,
    100000.00,
    0.00,
    100000.00,
    'success'
);

-- Insert Demo Tariff
INSERT INTO `tariffs` (
    `id`,
    `client_id`,
    `property_type`,
    `name`,
    `description`,
    `base_price`,
    `is_active`
)
VALUES (
    UUID(),
    @client_id,
    'residential',
    'Residential Standard',
    'Standard tariff for residential properties',
    5000.00,
    1
);

-- Get the tariff ID
SET @tariff_id = (SELECT `id` FROM `tariffs` WHERE `name` = 'Residential Standard');

-- Insert Demo Tariff Tiers
INSERT INTO `tariff_tiers` (
    `id`,
    `tariff_id`,
    `min_volume`,
    `max_volume`,
    `price_per_unit`
)
VALUES
    (UUID(), @tariff_id, 0.000, 10.000, 5000.00),
    (UUID(), @tariff_id, 10.001, 20.000, 6000.00),
    (UUID(), @tariff_id, 20.001, NULL, 7000.00);

-- Insert Demo Payment Gateway Settings
INSERT INTO `payment_gateway_settings` (
    `id`,
    `client_id`,
    `gateway`,
    `is_active`,
    `is_production`,
    `credentials`
)
VALUES
    (
        UUID(),
        @client_id,
        'midtrans',
        1,
        0,
        '{"client_key": "SB-Mid-client-XXXXXXXXXXXXXXXX", "server_key": "SB-Mid-server-XXXXXXXXXXXXXXXX", "merchant_id": "XXXXXXXX"}'
    ),
    (
        UUID(),
        @client_id,
        'doku',
        1,
        0,
        '{"client_id": "XXXXXXXX", "secret_key": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}'
    );