<?php

namespace IndoWater\Api\Services\PaymentGateway;

use IndoWater\Api\Models\PaymentGateway;
use IndoWater\Api\Repositories\PaymentGatewayRepository;
use Exception;
use Psr\Log\LoggerInterface;

/**
 * PaymentGatewayFactory
 * 
 * Factory for creating payment gateway instances
 */
class PaymentGatewayFactory
{
    /**
     * @var PaymentGatewayRepository
     */
    private $gatewayRepository;
    
    /**
     * @var LoggerInterface
     */
    private $logger;
    
    /**
     * Constructor
     * 
     * @param PaymentGatewayRepository $gatewayRepository
     * @param LoggerInterface $logger
     */
    public function __construct(PaymentGatewayRepository $gatewayRepository, LoggerInterface $logger)
    {
        $this->gatewayRepository = $gatewayRepository;
        $this->logger = $logger;
    }
    
    /**
     * Create a payment gateway instance
     * 
     * @param string $gateway
     * @param string $clientId
     * @return PaymentGatewayInterface
     * @throws Exception
     */
    public function create(string $gateway, string $clientId): PaymentGatewayInterface
    {
        // Get active gateway configuration for this client
        $config = $this->gatewayRepository->getActiveGateway($clientId, $gateway);
        
        if (!$config) {
            // Try to get system-wide configuration
            $config = $this->gatewayRepository->findByClientAndGateway(null, $gateway);
            
            if (!$config || !$config->isActive()) {
                throw new Exception("No active configuration found for gateway: $gateway");
            }
        }
        
        return $this->createFromConfig($config);
    }
    
    /**
     * Create a payment gateway instance from configuration
     * 
     * @param PaymentGateway $config
     * @return PaymentGatewayInterface
     * @throws Exception
     */
    public function createFromConfig(PaymentGateway $config): PaymentGatewayInterface
    {
        switch ($config->getGateway()) {
            case 'midtrans':
                return new MidtransGateway($config, $this->logger);
                
            case 'doku':
                return new DokuGateway($config, $this->logger);
                
            default:
                throw new Exception("Unsupported payment gateway: " . $config->getGateway());
        }
    }
    
    /**
     * Get available payment gateways
     * 
     * @return array
     */
    public function getAvailableGateways(): array
    {
        return [
            'midtrans' => 'Midtrans',
            'doku' => 'DOKU'
        ];
    }
    
    /**
     * Get required configuration fields for a gateway
     * 
     * @param string $gateway
     * @return array
     * @throws Exception
     */
    public function getRequiredConfigFields(string $gateway): array
    {
        switch ($gateway) {
            case 'midtrans':
                return [
                    'server_key' => [
                        'type' => 'text',
                        'label' => 'Server Key',
                        'required' => true,
                        'description' => 'Midtrans Server Key'
                    ],
                    'client_key' => [
                        'type' => 'text',
                        'label' => 'Client Key',
                        'required' => true,
                        'description' => 'Midtrans Client Key'
                    ]
                ];
                
            case 'doku':
                return [
                    'client_id' => [
                        'type' => 'text',
                        'label' => 'Client ID',
                        'required' => true,
                        'description' => 'DOKU Client ID'
                    ],
                    'secret_key' => [
                        'type' => 'text',
                        'label' => 'Secret Key',
                        'required' => true,
                        'description' => 'DOKU Secret Key'
                    ]
                ];
                
            default:
                throw new Exception("Unsupported payment gateway: $gateway");
        }
    }
}