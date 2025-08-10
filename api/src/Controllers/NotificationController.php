<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class NotificationController extends BaseController
{
    public function __construct(CacheService , LoggerInterface )
    {
        parent::__construct($cache, $logger);
    }

    public function index(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Notification listing not implemented yet'
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Notification details not implemented yet'
        ]);
    }

    public function store(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Notification creation not implemented yet'
        ], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => null,
            'message' => 'Notification update not implemented yet'
        ]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Notification deletion not implemented yet'
        ]);
    }

    public function markAsRead(Request $request, Response $response, array $args): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Mark as read not implemented yet'
        ]);
    }

    public function markAllAsRead(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Mark all as read not implemented yet'
        ]);
    }
}
