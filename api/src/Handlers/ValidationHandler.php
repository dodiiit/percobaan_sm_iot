<?php

namespace IndoWater\Api\Handlers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Exceptions\NestedValidationException;
use Respect\Validation\Validator as v;

/**
 * Validation Handler
 * 
 * This class provides validation functionality for the application.
 */
class ValidationHandler
{
    /**
     * Validate request data
     * 
     * @param ServerRequestInterface $request
     * @param array $rules
     * 
     * @return array
     */
    public static function validate(ServerRequestInterface $request, array $rules): array
    {
        $data = $request->getParsedBody() ?? [];
        $errors = [];

        foreach ($rules as $field => $rule) {
            try {
                $rule->setName(ucfirst($field))->assert($data[$field] ?? null);
            } catch (NestedValidationException $e) {
                $errors[$field] = $e->getMessages();
            }
        }

        return $errors;
    }

    /**
     * Create validation error response
     * 
     * @param ResponseInterface $response
     * @param array $errors
     * 
     * @return ResponseInterface
     */
    public static function createErrorResponse(ResponseInterface $response, array $errors): ResponseInterface
    {
        $payload = [
            'status' => 'error',
            'message' => 'Validation failed',
            'errors' => $errors,
        ];

        $response = $response->withStatus(422);
        $response = $response->withHeader('Content-Type', 'application/json');
        $response->getBody()->write(json_encode($payload, JSON_PRETTY_PRINT));

        return $response;
    }

    /**
     * Get common validation rules
     * 
     * @return array
     */
    public static function getCommonRules(): array
    {
        return [
            'email' => v::email()->notEmpty(),
            'password' => v::stringType()->length(10, null)->notEmpty(),
            'name' => v::stringType()->length(2, 100)->notEmpty(),
            'phone' => v::phone()->notEmpty(),
            'address' => v::stringType()->length(5, 255)->notEmpty(),
            'city' => v::stringType()->length(2, 100)->notEmpty(),
            'state' => v::stringType()->length(2, 100)->notEmpty(),
            'zip' => v::stringType()->length(5, 10)->notEmpty(),
            'country' => v::stringType()->length(2, 100)->notEmpty(),
            'date' => v::date('Y-m-d')->notEmpty(),
            'datetime' => v::date('Y-m-d H:i:s')->notEmpty(),
            'boolean' => v::boolType(),
            'integer' => v::intType()->notEmpty(),
            'float' => v::floatType()->notEmpty(),
            'array' => v::arrayType()->notEmpty(),
            'url' => v::url()->notEmpty(),
            'ip' => v::ip()->notEmpty(),
            'uuid' => v::uuid()->notEmpty(),
            'creditCard' => v::creditCard()->notEmpty(),
        ];
    }

    /**
     * Get user validation rules
     * 
     * @return array
     */
    public static function getUserRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'name' => $commonRules['name'],
            'email' => $commonRules['email'],
            'password' => $commonRules['password'],
            'role' => v::in(['superadmin', 'client', 'customer', 'operator']),
            'status' => v::in(['active', 'inactive', 'pending']),
            'phone' => $commonRules['phone'],
        ];
    }

    /**
     * Get client validation rules
     * 
     * @return array
     */
    public static function getClientRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'name' => $commonRules['name'],
            'email' => $commonRules['email'],
            'phone' => $commonRules['phone'],
            'address' => $commonRules['address'],
            'city' => $commonRules['city'],
            'state' => $commonRules['state'],
            'zip' => $commonRules['zip'],
            'country' => $commonRules['country'],
            'status' => v::in(['active', 'inactive', 'pending']),
            'contact_person' => $commonRules['name'],
            'contact_email' => $commonRules['email'],
            'contact_phone' => $commonRules['phone'],
            'tax_id' => v::stringType()->length(5, 50)->notEmpty(),
            'payment_terms' => v::intType()->notEmpty(),
        ];
    }

    /**
     * Get customer validation rules
     * 
     * @return array
     */
    public static function getCustomerRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'name' => $commonRules['name'],
            'email' => $commonRules['email'],
            'phone' => $commonRules['phone'],
            'address' => $commonRules['address'],
            'city' => $commonRules['city'],
            'state' => $commonRules['state'],
            'zip' => $commonRules['zip'],
            'country' => $commonRules['country'],
            'status' => v::in(['active', 'inactive', 'pending']),
            'client_id' => v::intType()->notEmpty(),
            'property_id' => v::intType()->notEmpty(),
            'customer_type' => v::in(['residential', 'commercial', 'industrial']),
        ];
    }

    /**
     * Get property validation rules
     * 
     * @return array
     */
    public static function getPropertyRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'name' => $commonRules['name'],
            'address' => $commonRules['address'],
            'city' => $commonRules['city'],
            'state' => $commonRules['state'],
            'zip' => $commonRules['zip'],
            'country' => $commonRules['country'],
            'client_id' => v::intType()->notEmpty(),
            'property_type' => v::in(['residential', 'commercial', 'industrial']),
            'status' => v::in(['active', 'inactive', 'pending']),
        ];
    }

    /**
     * Get meter validation rules
     * 
     * @return array
     */
    public static function getMeterRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'serial_number' => v::stringType()->length(5, 50)->notEmpty(),
            'model' => v::stringType()->length(2, 50)->notEmpty(),
            'property_id' => v::intType()->notEmpty(),
            'customer_id' => v::intType()->notEmpty(),
            'installation_date' => $commonRules['date'],
            'status' => v::in(['active', 'inactive', 'maintenance']),
            'meter_type' => v::in(['prepaid', 'postpaid']),
            'location' => v::stringType()->length(2, 100)->notEmpty(),
        ];
    }

    /**
     * Get payment validation rules
     * 
     * @return array
     */
    public static function getPaymentRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'amount' => $commonRules['float'],
            'customer_id' => v::intType()->notEmpty(),
            'meter_id' => v::intType()->notEmpty(),
            'payment_method' => v::in(['credit_card', 'bank_transfer', 'cash', 'midtrans', 'doku']),
            'payment_date' => $commonRules['datetime'],
            'status' => v::in(['pending', 'completed', 'failed', 'refunded']),
            'transaction_id' => v::stringType()->length(5, 100),
            'description' => v::stringType()->length(0, 255),
        ];
    }

    /**
     * Get credit validation rules
     * 
     * @return array
     */
    public static function getCreditRules(): array
    {
        $commonRules = self::getCommonRules();

        return [
            'amount' => $commonRules['float'],
            'customer_id' => v::intType()->notEmpty(),
            'meter_id' => v::intType()->notEmpty(),
            'payment_id' => v::intType()->notEmpty(),
            'credit_date' => $commonRules['datetime'],
            'status' => v::in(['pending', 'active', 'used', 'expired']),
            'expiration_date' => $commonRules['date'],
            'description' => v::stringType()->length(0, 255),
        ];
    }
}