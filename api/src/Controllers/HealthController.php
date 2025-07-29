<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use PDO;

class HealthController
{
    private ContainerInterface $container;
    private PDO $db;

    public function __construct(ContainerInterface $container, PDO $db)
    {
        $this->container = $container;
        $this->db = $db;
    }

    public function check(Request $request, Response $response): Response
    {
        $settings = $this->container->get('settings');
        $appName = $settings['app']['name'];
        $appEnv = $settings['app']['env'];
        
        $status = [
            'status' => 'ok',
            'timestamp' => time(),
            'app' => [
                'name' => $appName,
                'environment' => $appEnv,
                'version' => '1.0.0',
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'memory_usage' => $this->formatBytes(memory_get_usage(true)),
                'memory_limit' => ini_get('memory_limit'),
            ],
        ];
        
        // Check database connection
        try {
            $this->db->query('SELECT 1');
            $status['database'] = [
                'status' => 'connected',
                'driver' => $this->db->getAttribute(PDO::ATTR_DRIVER_NAME),
                'version' => $this->db->getAttribute(PDO::ATTR_SERVER_VERSION),
            ];
        } catch (\Exception $e) {
            $status['database'] = [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
            $status['status'] = 'error';
        }
        
        $response->getBody()->write(json_encode($status, JSON_PRETTY_PRINT));
        
        return $response
            ->withHeader('Content-Type', 'application/json');
    }
    
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}