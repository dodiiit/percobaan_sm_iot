<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class ReportController extends BaseController
{
    public function __construct(CacheService , LoggerInterface )
    {
        parent::__construct($cache, $logger);
    }

    public function revenue(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Revenue report not implemented yet'
        ]);
    }

    public function consumption(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Consumption report not implemented yet'
        ]);
    }

    public function customers(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer report not implemented yet'
        ]);
    }

    public function payments(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Payment report not implemented yet'
        ]);
    }

    public function credits(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Credit report not implemented yet'
        ]);
    }

    public function serviceFees(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Service fee report not implemented yet'
        ]);
    }

    public function export(Request $request, Response $response, array $args): Response
    {
        $type = $args['type'];
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => "Export {$type} not implemented yet"
        ]);
    }
}
