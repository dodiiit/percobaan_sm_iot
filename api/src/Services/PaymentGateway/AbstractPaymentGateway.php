<?php

namespace IndoWater\Api\Services\PaymentGateway;

use IndoWater\Api\Models\PaymentGateway;
use Exception;
use Psr\Log\LoggerInterface;

/**
 * AbstractPaymentGateway
 * 
 * Base class for payment gateway implementations
 */
abstract class AbstractPaymentGateway implements PaymentGatewayInterface
{
    /**
     * @var PaymentGateway
     */
    protected $config;
    
    /**
     * @var LoggerInterface
     */
    protected $logger;
    
    /**
     * @var bool
     */
    protected $isProduction;
    
    /**
     * Constructor
     * 
     * @param PaymentGateway $config
     * @param LoggerInterface $logger
     */
    public function __construct(PaymentGateway $config, LoggerInterface $logger)
    {
        $this->config = $config;
        $this->logger = $logger;
        $this->isProduction = $config->isProduction();
        
        $this->initialize();
    }
    
    /**
     * Initialize the payment gateway
     * 
     * @return void
     */
    abstract protected function initialize(): void;
    
    /**
     * Get gateway name
     * 
     * @return string
     */
    abstract public function getName(): string;
    
    /**
     * Get gateway type
     * 
     * @return string
     */
    public function getType(): string
    {
        return $this->config->getGateway();
    }
    
    /**
     * Check if gateway is in production mode
     * 
     * @return bool
     */
    public function isProduction(): bool
    {
        return $this->isProduction;
    }
    
    /**
     * Get gateway configuration
     * 
     * @return PaymentGateway
     */
    public function getConfig(): PaymentGateway
    {
        return $this->config;
    }
    
    /**
     * Get a configuration value
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    protected function getConfigValue(string $key, $default = null)
    {
        return $this->config->getCredential($key, $default);
    }
    
    /**
     * Make an HTTP request
     * 
     * @param string $method
     * @param string $url
     * @param array $headers
     * @param string|array|null $body
     * @return array
     * @throws Exception
     */
    protected function makeHttpRequest(string $method, string $url, array $headers = [], $body = null): array
    {
        $curl = curl_init();
        
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $this->formatHeaders($headers),
        ];
        
        if ($body !== null) {
            if (is_array($body)) {
                $options[CURLOPT_POSTFIELDS] = json_encode($body);
                if (!isset($headers['Content-Type'])) {
                    $options[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
                }
            } else {
                $options[CURLOPT_POSTFIELDS] = $body;
            }
        }
        
        curl_setopt_array($curl, $options);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);
        
        if ($error) {
            $this->logger->error('HTTP request failed', [
                'method' => $method,
                'url' => $url,
                'error' => $error
            ]);
            throw new Exception("HTTP request failed: $error");
        }
        
        $responseData = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $responseData = $response;
        }
        
        return [
            'status_code' => $httpCode,
            'data' => $responseData
        ];
    }
    
    /**
     * Format headers for cURL
     * 
     * @param array $headers
     * @return array
     */
    private function formatHeaders(array $headers): array
    {
        $result = [];
        foreach ($headers as $key => $value) {
            if (is_string($key)) {
                $result[] = "$key: $value";
            } else {
                $result[] = $value;
            }
        }
        return $result;
    }
    
    /**
     * Generate a unique order ID
     * 
     * @param string $prefix
     * @return string
     */
    protected function generateOrderId(string $prefix = ''): string
    {
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        return $prefix . $timestamp . $random;
    }
    
    /**
     * Log payment gateway activity
     * 
     * @param string $action
     * @param array $data
     * @return void
     */
    protected function logActivity(string $action, array $data): void
    {
        $this->logger->info("Payment Gateway [{$this->getName()}] $action", [
            'gateway' => $this->getType(),
            'production' => $this->isProduction(),
            'data' => $data
        ]);
    }
}