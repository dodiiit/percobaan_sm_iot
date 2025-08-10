<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class CustomerController extends BaseController
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
            'message' => 'Customer listing not implemented yet'
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Customer details not implemented yet'
        ]);
    }

    public function store(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Customer creation not implemented yet'
        ], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Customer update not implemented yet'
        ]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Customer deletion not implemented yet'
        ]);
    }

    public function activate(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Customer activation not implemented yet'
        ]);
    }

    public function deactivate(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Customer deactivation not implemented yet'
        ]);
    }

    public function meters(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer meters listing not implemented yet'
        ]);
    }

    public function payments(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer payments listing not implemented yet'
        ]);
    }

    public function credits(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer credits listing not implemented yet'
        ]);
    }

    public function consumption(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer consumption data not implemented yet'
        ]);
    }

    public function notifications(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Customer notifications not implemented yet'
        ]);
    }
}