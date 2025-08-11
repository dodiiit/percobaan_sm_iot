<?php

declare(strict_types=1);

namespace IndoWater\Api\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Container\ContainerInterface;

class SecurityHeadersMiddleware implements MiddlewareInterface
{
    private array $cspDirectives;
    private bool $enableHsts;
    private bool $enableFeaturePolicy;
    private bool $enablePermissionsPolicy;
    private string $reportUri;

    public function __construct(ContainerInterface $container)
    {
        $settings = $container->get('settings');
        $security = $settings['security'] ?? [];
        
        // Default CSP directives
        $this->cspDirectives = $security['csp_directives'] ?? [
            'default-src' => ["'self'"],
            'script-src' => ["'self'", "'strict-dynamic'", "'nonce-{NONCE}'"],
            'style-src' => ["'self'", "'unsafe-inline'"],
            'img-src' => ["'self'", "data:", "https:"],
            'font-src' => ["'self'", "data:"],
            'connect-src' => ["'self'", "https://api.lingindustri.com"],
            'frame-src' => ["'self'"],
            'object-src' => ["'none'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
            'frame-ancestors' => ["'self'"],
            'upgrade-insecure-requests' => true
        ];
        
        $this->enableHsts = $security['enable_hsts'] ?? true;
        $this->enableFeaturePolicy = $security['enable_feature_policy'] ?? true;
        $this->enablePermissionsPolicy = $security['enable_permissions_policy'] ?? true;
        $this->reportUri = $security['csp_report_uri'] ?? '/api/security/reports/csp';
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Generate a nonce for inline scripts
        $nonce = $this->generateNonce();
        
        // Store nonce in request attribute for use in templates
        $request = $request->withAttribute('csp_nonce', $nonce);
        
        // Process the request
        $response = $handler->handle($request);
        
        // Build CSP header with nonce
        $cspHeader = $this->buildCspHeader($nonce);
        
        // Add security headers
        $response = $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-XSS-Protection', '1; mode=block')
            ->withHeader('X-Frame-Options', 'SAMEORIGIN')
            ->withHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->withHeader('Content-Security-Policy', $cspHeader)
            ->withHeader('X-Content-Security-Policy', $cspHeader) // For older browsers
            ->withHeader('X-Permitted-Cross-Domain-Policies', 'none');
        
        // Add HSTS header if enabled
        if ($this->enableHsts) {
            $response = $response->withHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        
        // Add Feature-Policy header if enabled
        if ($this->enableFeaturePolicy) {
            $response = $response->withHeader('Feature-Policy', 
                "camera 'none'; microphone 'none'; geolocation 'self'; " .
                "accelerometer 'none'; autoplay 'none'; encrypted-media 'self'; " .
                "gyroscope 'none'; magnetometer 'none'; midi 'none'; " .
                "payment 'self'; picture-in-picture 'none'; usb 'none'; " .
                "vr 'none'; xr-spatial-tracking 'none'"
            );
        }
        
        // Add Permissions-Policy header if enabled (newer replacement for Feature-Policy)
        if ($this->enablePermissionsPolicy) {
            $response = $response->withHeader('Permissions-Policy', 
                "camera=(), microphone=(), geolocation=(self), " .
                "accelerometer=(), autoplay=(), encrypted-media=(self), " .
                "gyroscope=(), magnetometer=(), midi=(), " .
                "payment=(self), picture-in-picture=(), usb=(), " .
                "interest-cohort=(), display-capture=(), " .
                "web-share=(self)"
            );
        }
        
        // Add cache control headers for API responses
        return $response
            ->withHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->withHeader('Pragma', 'no-cache')
            ->withHeader('Expires', '0');
    }
    
    private function generateNonce(): string
    {
        return bin2hex(random_bytes(16));
    }
    
    private function buildCspHeader(string $nonce): string
    {
        $parts = [];
        
        foreach ($this->cspDirectives as $directive => $values) {
            if ($directive === 'upgrade-insecure-requests' && $values === true) {
                $parts[] = 'upgrade-insecure-requests';
                continue;
            }
            
            if (!is_array($values)) {
                continue;
            }
            
            // Replace {NONCE} placeholder with actual nonce
            $processedValues = array_map(function ($value) use ($nonce) {
                return str_replace('{NONCE}', $nonce, $value);
            }, $values);
            
            $parts[] = $directive . ' ' . implode(' ', $processedValues);
        }
        
        // Add report-uri directive if configured
        if (!empty($this->reportUri)) {
            $parts[] = 'report-uri ' . $this->reportUri;
            $parts[] = 'report-to csp-endpoint';
        }
        
        return implode('; ', $parts);
    }
}