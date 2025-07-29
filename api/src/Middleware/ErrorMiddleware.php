<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpException;
use Slim\Exception\HttpNotFoundException;
use Slim\Exception\HttpMethodNotAllowedException;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Exception\HttpForbiddenException;
use Slim\Exception\HttpBadRequestException;
use Throwable;

class ErrorMiddleware
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function handle(
        ServerRequestInterface $request,
        Throwable $exception,
        bool $displayErrorDetails,
        bool $logErrors,
        bool $logErrorDetails
    ): ResponseInterface {
        if ($logErrors) {
            $this->logger->error($exception->getMessage(), [
                'exception' => $exception,
                'url' => (string) $request->getUri(),
                'method' => $request->getMethod(),
                'headers' => $request->getHeaders(),
                'body' => (string) $request->getBody(),
            ]);
        }

        $statusCode = 500;
        $type = 'Server Error';
        $description = 'An internal error has occurred while processing your request.';

        if ($exception instanceof HttpException) {
            $statusCode = $exception->getCode();
            $description = $exception->getMessage();

            if ($exception instanceof HttpNotFoundException) {
                $statusCode = 404;
                $type = 'Not Found';
                $description = 'The requested resource could not be found.';
            } elseif ($exception instanceof HttpMethodNotAllowedException) {
                $statusCode = 405;
                $type = 'Method Not Allowed';
                $description = 'The request method is not allowed for this endpoint.';
            } elseif ($exception instanceof HttpUnauthorizedException) {
                $statusCode = 401;
                $type = 'Unauthorized';
                $description = 'Authentication is required and has failed or has not been provided.';
            } elseif ($exception instanceof HttpForbiddenException) {
                $statusCode = 403;
                $type = 'Forbidden';
                $description = 'You do not have permission to access this resource.';
            } elseif ($exception instanceof HttpBadRequestException) {
                $statusCode = 400;
                $type = 'Bad Request';
                $description = 'The server could not understand the request due to invalid syntax.';
            }
        }

        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'statusCode' => $statusCode,
            'type' => $type,
            'message' => $description,
            'details' => $displayErrorDetails ? [
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTrace(),
            ] : null,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $response
            ->withStatus($statusCode)
            ->withHeader('Content-Type', 'application/json');
    }
}