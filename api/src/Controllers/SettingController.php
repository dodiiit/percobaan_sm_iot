<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\CacheService;
use Psr\Log\LoggerInterface;

class SettingController extends BaseController
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
            'message' => 'Settings listing not implemented yet'
        ]);
    }

    public function update(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Settings update not implemented yet'
        ]);
    }

    public function paymentGateways(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Payment gateways settings not implemented yet'
        ]);
    }

    public function updatePaymentGateways(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Payment gateways update not implemented yet'
        ]);
    }

    public function serviceFees(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Service fees settings not implemented yet'
        ]);
    }

    public function updateServiceFees(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Service fees update not implemented yet'
        ]);
    }

    public function notifications(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'data' => [],
            'message' => 'Notification settings not implemented yet'
        ]);
    }

    public function updateNotifications(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, [
            'success' => true,
            'message' => 'Notification settings update not implemented yet'
        ]);
    }
}
