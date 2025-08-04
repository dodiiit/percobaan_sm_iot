<?php

declare(strict_types=1);

require_once __DIR__ . '/../../vendor/autoload.php';

use IndoWater\Api\Database\Connection;
use Ramsey\Uuid\Uuid;

class DatabaseSeeder
{
    private PDO $db;

    public function __construct()
    {
        // Load environment variables
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
        $dotenv->load();

        // Connect to database
        $this->db = Connection::getInstance([
            'host' => $_ENV['DB_HOST'],
            'port' => $_ENV['DB_PORT'],
            'database' => $_ENV['DB_DATABASE'],
            'username' => $_ENV['DB_USERNAME'],
            'password' => $_ENV['DB_PASSWORD']
        ]);
    }

    public function run(): void
    {
        echo "Starting database seeding...\n";

        $this->db->beginTransaction();

        try {
            $this->seedUsers();
            $this->seedClients();
            $this->seedCustomers();
            $this->seedProperties();
            $this->seedMeters();
            $this->seedMeterReadings();
            $this->seedCredits();
            $this->seedPayments();
            $this->seedNotifications();

            $this->db->commit();
            echo "Database seeding completed successfully!\n";

        } catch (Exception $e) {
            $this->db->rollBack();
            echo "Error seeding database: " . $e->getMessage() . "\n";
            exit(1);
        }
    }

    private function seedUsers(): void
    {
        echo "Seeding users...\n";

        $users = [
            [
                'id' => Uuid::uuid4()->toString(),
                'name' => 'Super Admin',
                'email' => 'admin@indowater.com',
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'role' => 'superadmin',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => Uuid::uuid4()->toString(),
                'name' => 'PT Aqua Mandiri',
                'email' => 'client@aquamandiri.com',
                'password' => password_hash('client123', PASSWORD_DEFAULT),
                'role' => 'client',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => Uuid::uuid4()->toString(),
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'password' => password_hash('customer123', PASSWORD_DEFAULT),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => Uuid::uuid4()->toString(),
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'password' => password_hash('customer123', PASSWORD_DEFAULT),
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]
        ];

        foreach ($users as $user) {
            $this->insertRecord('users', $user);
        }
    }

    private function seedClients(): void
    {
        echo "Seeding clients...\n";

        // Get client user
        $clientUser = $this->db->query("SELECT id FROM users WHERE role = 'client' LIMIT 1")->fetch();

        $client = [
            'id' => Uuid::uuid4()->toString(),
            'user_id' => $clientUser['id'],
            'company_name' => 'PT Aqua Mandiri',
            'address' => 'Jl. Sudirman No. 123',
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'postal_code' => '12345',
            'contact_person' => 'Budi Santoso',
            'contact_email' => 'budi@aquamandiri.com',
            'contact_phone' => '+6281234567890',
            'tax_id' => '01.234.567.8-901.000',
            'service_fee_type' => 'percentage',
            'service_fee_value' => 5.0,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $this->insertRecord('clients', $client);
    }

    private function seedCustomers(): void
    {
        echo "Seeding customers...\n";

        // Get customer users and client
        $customerUsers = $this->db->query("SELECT id FROM users WHERE role = 'customer'")->fetchAll();
        $client = $this->db->query("SELECT id FROM clients LIMIT 1")->fetch();

        $customers = [];
        foreach ($customerUsers as $index => $user) {
            $customers[] = [
                'id' => Uuid::uuid4()->toString(),
                'user_id' => $user['id'],
                'client_id' => $client['id'],
                'customer_number' => 'CUST' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'first_name' => $index === 0 ? 'John' : 'Jane',
                'last_name' => $index === 0 ? 'Doe' : 'Smith',
                'address' => $index === 0 ? 'Jl. Merdeka No. 45' : 'Jl. Kemerdekaan No. 67',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'phone' => $index === 0 ? '+6281234567890' : '+6281234567891',
                'email' => $index === 0 ? 'john.doe@example.com' : 'jane.smith@example.com',
                'id_card_number' => $index === 0 ? '3171234567890001' : '3171234567890002',
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
        }

        foreach ($customers as $customer) {
            $this->insertRecord('customers', $customer);
        }
    }

    private function seedProperties(): void
    {
        echo "Seeding properties...\n";

        $client = $this->db->query("SELECT id FROM clients LIMIT 1")->fetch();

        $properties = [
            [
                'id' => Uuid::uuid4()->toString(),
                'client_id' => $client['id'],
                'name' => 'Perumahan Merdeka Residence',
                'address' => 'Jl. Merdeka Raya No. 1',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'property_type' => 'residential',
                'total_units' => 100,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => Uuid::uuid4()->toString(),
                'client_id' => $client['id'],
                'name' => 'Kemerdekaan Business Center',
                'address' => 'Jl. Kemerdekaan No. 100',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'property_type' => 'commercial',
                'total_units' => 50,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]
        ];

        foreach ($properties as $property) {
            $this->insertRecord('properties', $property);
        }
    }

    private function seedMeters(): void
    {
        echo "Seeding meters...\n";

        $customers = $this->db->query("SELECT id FROM customers")->fetchAll();
        $properties = $this->db->query("SELECT id FROM properties")->fetchAll();

        $meters = [];
        foreach ($customers as $index => $customer) {
            $meters[] = [
                'id' => Uuid::uuid4()->toString(),
                'meter_id' => 'MTR' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'customer_id' => $customer['id'],
                'property_id' => $properties[$index % count($properties)]['id'],
                'installation_date' => date('Y-m-d', strtotime('-30 days')),
                'meter_type' => 'smart',
                'meter_model' => 'IndoWater SM-100',
                'meter_serial' => 'SN' . str_pad($index + 1, 8, '0', STR_PAD_LEFT),
                'firmware_version' => '1.2.3',
                'hardware_version' => '2.1.0',
                'location_description' => 'Main water inlet',
                'latitude' => -6.2088 + (rand(-1000, 1000) / 100000),
                'longitude' => 106.8456 + (rand(-1000, 1000) / 100000),
                'status' => 'connected',
                'last_reading' => rand(1000, 5000),
                'last_reading_at' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 60) . ' minutes')),
                'last_credit' => rand(50000, 200000),
                'last_credit_at' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 24) . ' hours')),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
        }

        foreach ($meters as $meter) {
            $this->insertRecord('meters', $meter);
        }
    }

    private function seedMeterReadings(): void
    {
        echo "Seeding meter readings...\n";

        $meters = $this->db->query("SELECT id, meter_id FROM meters")->fetchAll();

        foreach ($meters as $meter) {
            // Generate readings for the last 30 days
            for ($i = 30; $i >= 0; $i--) {
                $reading = [
                    'id' => Uuid::uuid4()->toString(),
                    'meter_id' => $meter['id'],
                    'reading' => rand(1000, 5000) + ($i * rand(10, 50)),
                    'flow_rate' => rand(5, 25) / 10,
                    'battery_level' => rand(70, 100),
                    'signal_strength' => rand(-80, -40),
                    'temperature' => rand(20, 35),
                    'pressure' => rand(15, 30) / 10,
                    'created_at' => date('Y-m-d H:i:s', strtotime("-{$i} days"))
                ];

                $this->insertRecord('meter_readings', $reading);
            }
        }
    }

    private function seedCredits(): void
    {
        echo "Seeding credits...\n";

        $meters = $this->db->query("SELECT id, customer_id FROM meters")->fetchAll();

        foreach ($meters as $meter) {
            // Generate some credit history
            for ($i = 0; $i < 3; $i++) {
                $amount = [50000, 100000, 150000][rand(0, 2)];
                $previousBalance = rand(10000, 50000);
                
                $credit = [
                    'id' => Uuid::uuid4()->toString(),
                    'meter_id' => $meter['id'],
                    'customer_id' => $meter['customer_id'],
                    'amount' => $amount,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $previousBalance + $amount,
                    'status' => 'success',
                    'created_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 1) * 7 . ' days')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 1) * 7 . ' days'))
                ];

                $this->insertRecord('credits', $credit);
            }
        }
    }

    private function seedPayments(): void
    {
        echo "Seeding payments...\n";

        $customers = $this->db->query("SELECT id FROM customers")->fetchAll();

        foreach ($customers as $customer) {
            // Generate some payment history
            for ($i = 0; $i < 2; $i++) {
                $amount = [50000, 100000, 150000][rand(0, 2)];
                
                $payment = [
                    'id' => Uuid::uuid4()->toString(),
                    'customer_id' => $customer['id'],
                    'amount' => $amount,
                    'method' => ['midtrans', 'doku'][rand(0, 1)],
                    'status' => 'success',
                    'description' => 'Water credit top-up',
                    'external_id' => 'PAY' . str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT),
                    'paid_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 1) * 10 . ' days')),
                    'created_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 1) * 10 . ' days')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-' . ($i + 1) * 10 . ' days'))
                ];

                $this->insertRecord('payments', $payment);
            }
        }
    }

    private function seedNotifications(): void
    {
        echo "Seeding notifications...\n";

        $users = $this->db->query("SELECT id FROM users WHERE role IN ('client', 'customer')")->fetchAll();

        $notificationTypes = [
            ['type' => 'low_credit', 'title' => 'Low Credit Alert', 'message' => 'Your water meter credit is running low'],
            ['type' => 'payment_success', 'title' => 'Payment Successful', 'message' => 'Your payment has been processed successfully'],
            ['type' => 'meter_offline', 'title' => 'Meter Offline', 'message' => 'Your water meter is currently offline']
        ];

        foreach ($users as $user) {
            foreach ($notificationTypes as $index => $notif) {
                $notification = [
                    'id' => Uuid::uuid4()->toString(),
                    'user_id' => $user['id'],
                    'type' => $notif['type'],
                    'title' => $notif['title'],
                    'message' => $notif['message'],
                    'is_read' => rand(0, 1),
                    'created_at' => date('Y-m-d H:i:s', strtotime('-' . ($index + 1) * 2 . ' days')),
                    'updated_at' => date('Y-m-d H:i:s', strtotime('-' . ($index + 1) * 2 . ' days'))
                ];

                $this->insertRecord('notifications', $notification);
            }
        }
    }

    private function insertRecord(string $table, array $data): void
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
    }
}

// Run the seeder
if (php_sapi_name() === 'cli') {
    $seeder = new DatabaseSeeder();
    $seeder->run();
}