<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class DashboardController extends BaseController
{
    public function __construct(CacheService , LoggerInterface )
    {
        parent::__construct($cache, $logger);
    }

    public function superadmin(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'total_clients' => 0,
                'total_customers' => 0,
                'total_meters' => 0,
                'total_revenue' => 0
            ],
            'message' => 'Superadmin dashboard data not implemented yet'
        ]);
    }

    public function client(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'total_customers' => 0,
                'total_meters' => 0,
                'total_revenue' => 0,
                'active_meters' => 0
            ],
            'message' => 'Client dashboard data not implemented yet'
        ]);
    }

    public function customer(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                'current_balance' => 0,
                'monthly_consumption' => 0,
                'last_payment' => null,
                'meter_status' => 'active'
            ],
            'message' => 'Customer dashboard data not implemented yet'
        ]);
    }

    public function stats(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Dashboard stats not implemented yet'
        ]);
    }

    public function charts(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Dashboard charts not implemented yet'
        ]);
    }
}
