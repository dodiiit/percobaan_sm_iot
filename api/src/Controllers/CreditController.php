<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class CreditController extends BaseController
{
    public function __construct(CacheService $cache, LoggerInterface $logger)
    {
        parent::__construct($cache, $logger);
    }

    public function index(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Credit listing not implemented yet'
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Credit details not implemented yet'
        ]);
    }

    public function store(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Credit creation not implemented yet'
        ], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Credit update not implemented yet'
        ]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Credit deletion not implemented yet'
        ]);
    }

    public function denominations(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [
                ['value' => 10000, 'label' => 'Rp 10.000'],
                ['value' => 25000, 'label' => 'Rp 25.000'],
                ['value' => 50000, 'label' => 'Rp 50.000'],
                ['value' => 100000, 'label' => 'Rp 100.000'],
                ['value' => 250000, 'label' => 'Rp 250.000'],
                ['value' => 500000, 'label' => 'Rp 500.000']
            ],
            'message' => 'Credit denominations retrieved successfully'
        ]);
    }
}
