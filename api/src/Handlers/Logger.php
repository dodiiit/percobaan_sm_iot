<?php

namespace IndoWater\Api\Handlers;

use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\LineFormatter;
use Monolog\Processor\IntrospectionProcessor;
use Monolog\Processor\WebProcessor;
use Monolog\Processor\MemoryUsageProcessor;

/**
 * Logger
 * 
 * This class provides logging functionality for the application.
 */
class Logger
{
    /**
     * Create a new logger instance
     * 
     * @param string $name
     * @param array $config
     * 
     * @return MonologLogger
     */
    public static function create(string $name, array $config = []): MonologLogger
    {
        // Create logger
        $logger = new MonologLogger($name);

        // Set default config
        $config = array_merge([
            'path' => 'php://stderr',
            'level' => MonologLogger::DEBUG,
            'max_files' => 30,
            'format' => "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
            'date_format' => 'Y-m-d H:i:s',
            'include_introspection' => true,
            'include_web' => true,
            'include_memory' => true,
        ], $config);

        // Create formatter
        $formatter = new LineFormatter(
            $config['format'],
            $config['date_format'],
            true,
            true
        );

        // Add handlers
        if (strpos($config['path'], 'php://') === 0) {
            // Stream handler
            $handler = new StreamHandler($config['path'], $config['level']);
            $handler->setFormatter($formatter);
            $logger->pushHandler($handler);
        } else {
            // Rotating file handler
            $handler = new RotatingFileHandler(
                $config['path'],
                $config['max_files'],
                $config['level']
            );
            $handler->setFormatter($formatter);
            $logger->pushHandler($handler);
        }

        // Add processors
        if ($config['include_introspection']) {
            $logger->pushProcessor(new IntrospectionProcessor());
        }

        if ($config['include_web']) {
            $logger->pushProcessor(new WebProcessor());
        }

        if ($config['include_memory']) {
            $logger->pushProcessor(new MemoryUsageProcessor());
        }

        // Add custom processor for masking sensitive data
        $logger->pushProcessor(function ($record) {
            // Mask sensitive data in the message
            $record['message'] = self::maskSensitiveData($record['message']);

            // Mask sensitive data in the context
            if (isset($record['context']) && is_array($record['context'])) {
                $record['context'] = self::maskSensitiveDataInArray($record['context']);
            }

            return $record;
        });

        return $logger;
    }

    /**
     * Mask sensitive data in a string
     * 
     * @param string $data
     * 
     * @return string
     */
    protected static function maskSensitiveData(string $data): string
    {
        // Define patterns for sensitive data
        $patterns = [
            // Password
            '/"password"\s*:\s*"[^"]*"/' => '"password":"********"',
            
            // Token
            '/"token"\s*:\s*"[^"]*"/' => '"token":"********"',
            
            // API key
            '/"api[_-]?key"\s*:\s*"[^"]*"/' => '"api_key":"********"',
            
            // Credit card number
            '/(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?)\d{4}/' => '$1****',
            
            // Email address
            '/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/' => '****@$2',
        ];

        // Apply masking
        return preg_replace(array_keys($patterns), array_values($patterns), $data);
    }

    /**
     * Mask sensitive data in an array
     * 
     * @param array $data
     * 
     * @return array
     */
    protected static function maskSensitiveDataInArray(array $data): array
    {
        // Define sensitive keys
        $sensitiveKeys = [
            'password',
            'token',
            'api_key',
            'apikey',
            'secret',
            'credit_card',
            'card_number',
            'cvv',
            'ssn',
            'social_security',
            'auth',
            'authorization',
        ];

        // Process array
        foreach ($data as $key => $value) {
            // Check if key is sensitive
            if (in_array(strtolower($key), $sensitiveKeys)) {
                $data[$key] = '********';
            } elseif (is_array($value)) {
                // Recursively process nested arrays
                $data[$key] = self::maskSensitiveDataInArray($value);
            } elseif (is_string($value)) {
                // Mask sensitive data in strings
                $data[$key] = self::maskSensitiveData($value);
            }
        }

        return $data;
    }
}