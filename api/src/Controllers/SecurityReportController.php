<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class SecurityReportController
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Handle Content Security Policy violation reports
     */
    public function handleCspReport(Request $request, Response $response): Response
    {
        // Get the raw report data
        $reportData = $request->getBody()->getContents();
        
        // Try to decode the JSON report
        $report = json_decode($reportData, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->logger->warning('Invalid CSP report format', [
                'error' => json_last_error_msg(),
                'raw_data' => $reportData,
            ]);
            
            return $response->withStatus(400);
        }
        
        // Extract the CSP report from the wrapper
        $cspReport = $report['csp-report'] ?? $report;
        
        // Log the CSP violation
        $this->logger->warning('CSP violation reported', [
            'document_uri' => $cspReport['document-uri'] ?? 'unknown',
            'violated_directive' => $cspReport['violated-directive'] ?? 'unknown',
            'blocked_uri' => $cspReport['blocked-uri'] ?? 'unknown',
            'source_file' => $cspReport['source-file'] ?? 'unknown',
            'line_number' => $cspReport['line-number'] ?? 'unknown',
            'column_number' => $cspReport['column-number'] ?? 'unknown',
            'referrer' => $cspReport['referrer'] ?? 'unknown',
            'effective_directive' => $cspReport['effective-directive'] ?? 'unknown',
            'original_policy' => $cspReport['original-policy'] ?? 'unknown',
            'disposition' => $cspReport['disposition'] ?? 'unknown',
            'status_code' => $cspReport['status-code'] ?? 'unknown',
        ]);
        
        // Return a 204 No Content response
        return $response->withStatus(204);
    }
}