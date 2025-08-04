<?php

declare(strict_types=1);

namespace IndoWater\Api\Database;

use PDO;
use PDOException;

class Connection
{
    private static ?PDO $instance = null;
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public static function getInstance(array $config = null): PDO
    {
        if (self::$instance === null) {
            if ($config === null) {
                throw new \Exception('Database configuration is required for first connection');
            }
            
            $connection = new self($config);
            self::$instance = $connection->connect();
        }

        return self::$instance;
    }

    private function connect(): PDO
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $this->config['host'],
                $this->config['port'],
                $this->config['database']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $pdo = new PDO($dsn, $this->config['username'], $this->config['password'], $options);
            
            // Set timezone
            $pdo->exec("SET time_zone = '+07:00'");
            
            return $pdo;

        } catch (PDOException $e) {
            throw new \Exception('Database connection failed: ' . $e->getMessage());
        }
    }

    public static function closeConnection(): void
    {
        self::$instance = null;
    }
}