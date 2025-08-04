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

-- Insert Demo Properties with Enhanced Data
INSERT INTO `properties` (
    `id`,
    `client_id`,
    `property_code`,
    `name`,
    `description`,
    `type`,
    `address`,
    `city`,
    `province`,
    `postal_code`,
    `latitude`,
    `longitude`,
    `total_area`,
    `building_area`,
    `floors`,
    `units`,
    `year_built`,
    `owner_name`,
    `owner_phone`,
    `owner_email`,
    `manager_name`,
    `manager_phone`,
    `manager_email`,
    `verification_status`,
    `verification_notes`,
    `verified_by`,
    `verified_at`,
    `documents`,
    `amenities`,
    `water_source`,
    `water_pressure`,
    `backup_water`,
    `emergency_contact_name`,
    `emergency_contact_phone`,
    `status`
)
VALUES 
    (
        UUID(),
        @client_id,
        'PAM-RES-0001',
        'Taman Anggrek Residence',
        'Modern residential complex with 50 units, complete facilities including swimming pool, gym, and 24/7 security',
        'residential',
        'Jl. Taman Anggrek No. 789, Kebon Jeruk',
        'Jakarta Barat',
        'DKI Jakarta',
        '12346',
        -6.1751,
        106.7894,
        5000.00,
        3500.00,
        5,
        50,
        2020,
        'PT. Anggrek Property',
        '+62-21-12345678',
        'owner@anggrek-property.com',
        'Budi Santoso',
        '+62-812-3456-7890',
        'manager@anggrek-property.com',
        'approved',
        'All documents verified and property meets all requirements',
        @superadmin_id,
        CURRENT_TIMESTAMP,
        '{"ownership_certificate": "cert_001.pdf", "building_permit": "permit_001.pdf", "tax_certificate": "tax_001.pdf"}',
        '["Swimming Pool", "Gym", "24/7 Security", "Parking", "Playground", "Garden"]',
        'municipal',
        'high',
        1,
        'Security Office',
        '+62-21-12345679',
        'active'
    ),
    (
        UUID(),
        @client_id,
        'PAM-COM-0001',
        'Grand Shopping Mall',
        'Large shopping mall with 200+ stores, food court, cinema, and entertainment facilities',
        'shopping_center',
        'Jl. Sudirman No. 456, SCBD',
        'Jakarta Selatan',
        'DKI Jakarta',
        '12190',
        -6.2088,
        106.8456,
        15000.00,
        12000.00,
        4,
        250,
        2018,
        'PT. Grand Mall Indonesia',
        '+62-21-87654321',
        'owner@grandmall.co.id',
        'Siti Rahayu',
        '+62-813-9876-5432',
        'manager@grandmall.co.id',
        'approved',
        'Commercial property approved with all required permits',
        @superadmin_id,
        CURRENT_TIMESTAMP,
        '{"ownership_certificate": "cert_002.pdf", "business_license": "license_002.pdf", "fire_safety_certificate": "fire_002.pdf", "environmental_permit": "env_002.pdf"}',
        '["Food Court", "Cinema", "Parking", "ATM Center", "Prayer Room", "Kids Play Area"]',
        'municipal',
        'high',
        1,
        'Mall Security',
        '+62-21-87654322',
        'active'
    ),
    (
        UUID(),
        @client_id,
        'PAM-IND-0001',
        'Industrial Park Zone A',
        'Industrial manufacturing facility for automotive parts production',
        'factory',
        'Jl. Industri Raya No. 789, Kawasan Industri',
        'Bekasi',
        'Jawa Barat',
        '17530',
        -6.2441,
        107.0056,
        25000.00,
        18000.00,
        2,
        10,
        2019,
        'PT. Auto Parts Manufacturing',
        '+62-21-11223344',
        'owner@autoparts.co.id',
        'Ahmad Wijaya',
        '+62-814-5678-9012',
        'plant.manager@autoparts.co.id',
        'approved',
        'Industrial facility meets all environmental and safety standards',
        @superadmin_id,
        CURRENT_TIMESTAMP,
        '{"ownership_certificate": "cert_003.pdf", "business_license": "license_003.pdf", "environmental_permit": "env_003.pdf", "fire_safety_certificate": "fire_003.pdf"}',
        '["Waste Treatment Plant", "Emergency Response Team", "Medical Facility", "Cafeteria"]',
        'mixed',
        'high',
        1,
        'Plant Security',
        '+62-21-11223345',
        'active'
    ),
    (
        UUID(),
        @client_id,
        'PAM-BOR-0001',
        'Student Boarding House',
        'Modern boarding house for university students with 30 rooms, shared facilities',
        'boarding_house',
        'Jl. Universitas No. 321, Depok',
        'Depok',
        'Jawa Barat',
        '16424',
        -6.3728,
        106.8324,
        1200.00,
        800.00,
        3,
        30,
        2021,
        'Ibu Sari Dewi',
        '+62-21-55667788',
        'sari.dewi@email.com',
        'Pak Joko',
        '+62-815-1234-5678',
        'joko.manager@email.com',
        'under_review',
        'Property submitted for verification, awaiting document review',
        NULL,
        NULL,
        '{"ownership_certificate": "cert_004.pdf", "business_license": "license_004.pdf"}',
        '["WiFi", "Laundry", "Common Kitchen", "Study Room", "Parking"]',
        'municipal',
        'medium',
        0,
        'Pak Joko',
        '+62-815-1234-5678',
        'active'
    ),
    (
        UUID(),
        @client_id,
        'PAM-HOT-0001',
        'Grand Hotel Jakarta',
        'Luxury 5-star hotel with 200 rooms, conference facilities, spa, and restaurants',
        'hotel',
        'Jl. Thamrin No. 999, Menteng',
        'Jakarta Pusat',
        'DKI Jakarta',
        '10310',
        -6.1944,
        106.8229,
        8000.00,
        6500.00,
        15,
        200,
        2017,
        'PT. Grand Hotel Indonesia',
        '+62-21-99887766',
        'owner@grandhotel.co.id',
        'Maria Gonzales',
        '+62-816-9876-5432',
        'gm@grandhotel.co.id',
        'requires_update',
        'Fire safety certificate needs renewal, other documents are valid',
        @superadmin_id,
        CURRENT_TIMESTAMP,
        '{"ownership_certificate": "cert_005.pdf", "business_license": "license_005.pdf", "fire_safety_certificate": "fire_005_expired.pdf"}',
        '["Spa", "Conference Rooms", "Restaurants", "Pool", "Gym", "Concierge", "Valet Parking"]',
        'municipal',
        'high',
        1,
        'Hotel Security',
        '+62-21-99887767',
        'active'
    );

-- Get property IDs for reference
SET @property_residential = (SELECT `id` FROM `properties` WHERE `property_code` = 'PAM-RES-0001');
SET @property_commercial = (SELECT `id` FROM `properties` WHERE `property_code` = 'PAM-COM-0001');
SET @property_industrial = (SELECT `id` FROM `properties` WHERE `property_code` = 'PAM-IND-0001');
SET @property_boarding = (SELECT `id` FROM `properties` WHERE `property_code` = 'PAM-BOR-0001');
SET @property_hotel = (SELECT `id` FROM `properties` WHERE `property_code` = 'PAM-HOT-0001');

-- Set the main property for the demo meter
SET @property_id = @property_residential;

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