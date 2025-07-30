<?php

namespace IndoWater\Api\Handlers;

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

/**
 * Error Handler
 * 
 * This class handles all errors and exceptions in the application.
 * It logs errors appropriately and returns standardized error responses.
 */
class ErrorHandler
{
    /**
     * @var LoggerInterface
     */
    protected $logger;

    /**
     * @var bool
     */
    protected $displayErrorDetails;

    /**
     * Constructor
     * 
     * @param LoggerInterface $logger
     * @param bool $displayErrorDetails
     */
    public function __construct(LoggerInterface $logger, bool $displayErrorDetails = false)
    {
        $this->logger = $logger;
        $this->displayErrorDetails = $displayErrorDetails;
    }

    /**
     * Invoke the error handler
     * 
     * @param ServerRequestInterface $request
     * @param Throwable $exception
     * @param bool $displayErrorDetails
     * @param bool $logErrors
     * @param bool $logErrorDetails
     * 
     * @return ResponseInterface
     */
    public function __invoke(
        ServerRequestInterface $request,
        Throwable $exception,
        bool $displayErrorDetails,
        bool $logErrors,
        bool $logErrorDetails
    ): ResponseInterface {
        // Log the error
        if ($logErrors) {
            $this->logError($request, $exception, $logErrorDetails);
        }

        // Create response
        $response = new \Slim\Psr7\Response();
        $response = $response->withHeader('Content-Type', 'application/json');

        // Handle specific HTTP exceptions
        if ($exception instanceof HttpException) {
            return $this->handleHttpException($exception, $response);
        }

        // Handle other exceptions
        return $this->handleGenericException($exception, $response);
    }

    /**
     * Log the error
     * 
     * @param ServerRequestInterface $request
     * @param Throwable $exception
     * @param bool $logErrorDetails
     * 
     * @return void
     */
    protected function logError(ServerRequestInterface $request, Throwable $exception, bool $logErrorDetails): void
    {
        // Get request details
        $method = $request->getMethod();
        $uri = (string) $request->getUri();
        $ip = $this->getClientIp($request);
        $userAgent = $request->getHeaderLine('User-Agent');

        // Create log context
        $context = [
            'method' => $method,
            'uri' => $uri,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'exception' => get_class($exception),
            'code' => $exception->getCode(),
        ];

        // Add error details if enabled
        if ($logErrorDetails) {
            $context['file'] = $exception->getFile();
            $context['line'] = $exception->getLine();
            $context['trace'] = $exception->getTraceAsString();
        }

        // Mask sensitive data in the URI
        $maskedUri = $this->maskSensitiveData($uri);
        $message = sprintf('%s: %s %s - %s', get_class($exception), $method, $maskedUri, $exception->getMessage());

        // Log the error
        $this->logger->error($message, $context);
    }

    /**
     * Handle HTTP exceptions
     * 
     * @param HttpException $exception
     * @param ResponseInterface $response
     * 
     * @return ResponseInterface
     */
    protected function handleHttpException(HttpException $exception, ResponseInterface $response): ResponseInterface
    {
        $statusCode = $exception->getCode();
        $reasonPhrase = $this->getReasonPhrase($statusCode);

        $error = [
            'status' => 'error',
            'message' => $exception->getMessage(),
        ];

        // Add error code for specific exceptions
        if ($exception instanceof HttpNotFoundException) {
            $error['code'] = 'RESOURCE_NOT_FOUND';
        } elseif ($exception instanceof HttpMethodNotAllowedException) {
            $error['code'] = 'METHOD_NOT_ALLOWED';
            $error['allowed_methods'] = $exception->getAllowedMethods();
        } elseif ($exception instanceof HttpUnauthorizedException) {
            $error['code'] = 'UNAUTHORIZED';
        } elseif ($exception instanceof HttpForbiddenException) {
            $error['code'] = 'FORBIDDEN';
        } elseif ($exception instanceof HttpBadRequestException) {
            $error['code'] = 'BAD_REQUEST';
        }

        // Add error details if enabled
        if ($this->displayErrorDetails) {
            $error['exception'] = [
                'type' => get_class($exception),
                'code' => $exception->getCode(),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }

        $response = $response->withStatus($statusCode, $reasonPhrase);
        $response->getBody()->write(json_encode($error, JSON_PRETTY_PRINT));

        return $response;
    }

    /**
     * Handle generic exceptions
     * 
     * @param Throwable $exception
     * @param ResponseInterface $response
     * 
     * @return ResponseInterface
     */
    protected function handleGenericException(Throwable $exception, ResponseInterface $response): ResponseInterface
    {
        $statusCode = 500;
        $reasonPhrase = 'Internal Server Error';

        $error = [
            'status' => 'error',
            'message' => 'An unexpected error occurred',
            'code' => 'INTERNAL_SERVER_ERROR',
        ];

        // Add error details if enabled
        if ($this->displayErrorDetails) {
            $error['exception'] = [
                'type' => get_class($exception),
                'code' => $exception->getCode(),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }

        $response = $response->withStatus($statusCode, $reasonPhrase);
        $response->getBody()->write(json_encode($error, JSON_PRETTY_PRINT));

        return $response;
    }

    /**
     * Get the client IP address
     * 
     * @param ServerRequestInterface $request
     * 
     * @return string
     */
    protected function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        
        $headers = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR',
        ];
        
        foreach ($headers as $header) {
            if (isset($serverParams[$header])) {
                $ips = explode(',', $serverParams[$header]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * Get the reason phrase for a status code
     * 
     * @param int $statusCode
     * 
     * @return string
     */
    protected function getReasonPhrase(int $statusCode): string
    {
        $phrases = [
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            406 => 'Not Acceptable',
            409 => 'Conflict',
            415 => 'Unsupported Media Type',
            422 => 'Unprocessable Entity',
            429 => 'Too Many Requests',
            500 => 'Internal Server Error',
            501 => 'Not Implemented',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
        ];

        return $phrases[$statusCode] ?? 'Unknown Error';
    }

    /**
     * Mask sensitive data in a string
     * 
     * @param string $data
     * 
     * @return string
     */
    protected function maskSensitiveData(string $data): string
    {
        // Define patterns for sensitive data
        $patterns = [
            // Password in query string
            '/(password=)([^&]+)/i' => '$1********',
            
            // Token in query string
            '/(token=)([^&]+)/i' => '$1********',
            
            // API key in query string
            '/(api[_-]?key=)([^&]+)/i' => '$1********',
            
            // Credit card number
            '/(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?)\d{4}/' => '$1****',
            
            // Email address
            '/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/' => '****@$2',
        ];

        // Apply masking
        return preg_replace(array_keys($patterns), array_values($patterns), $data);
    }
}