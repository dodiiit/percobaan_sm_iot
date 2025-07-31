<?php

namespace IndoWater\Api\Controllers;

use IndoWater\Api\Models\Tariff;
use IndoWater\Api\Models\SeasonalRate;
use IndoWater\Api\Models\BulkDiscountTier;
use IndoWater\Api\Models\DynamicDiscountRule;
use IndoWater\Api\Models\PropertyTariff;
use IndoWater\Api\Models\AppliedDiscount;
use IndoWater\Api\Models\Property;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;

class TariffController
{
    private Tariff $tariffModel;
    private SeasonalRate $seasonalRateModel;
    private BulkDiscountTier $bulkDiscountTierModel;
    private DynamicDiscountRule $dynamicDiscountRuleModel;
    private PropertyTariff $propertyTariffModel;
    private AppliedDiscount $appliedDiscountModel;
    private Property $propertyModel;

    public function __construct()
    {
        $this->tariffModel = new Tariff();
        $this->seasonalRateModel = new SeasonalRate();
        $this->bulkDiscountTierModel = new BulkDiscountTier();
        $this->dynamicDiscountRuleModel = new DynamicDiscountRule();
        $this->propertyTariffModel = new PropertyTariff();
        $this->appliedDiscountModel = new AppliedDiscount();
        $this->propertyModel = new Property();
    }

    /**
     * Get all tariffs for a client
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getAllTariffs(Request $request, Response $response, array $args): Response
    {
        $clientId = $args['clientId'] ?? null;
        $activeOnly = $request->getQueryParams()['active_only'] ?? true;
        
        if (!$clientId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Client ID is required'
            ], 400);
        }
        
        $tariffs = $this->tariffModel->getAllForClient($clientId, $activeOnly);
        
        return $response->withJson([
            'success' => true,
            'data' => $tariffs
        ]);
    }

    /**
     * Get a single tariff by ID
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getTariff(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['id'] ?? null;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        $tariff = $this->tariffModel->find($tariffId);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff not found'
            ], 404);
        }
        
        return $response->withJson([
            'success' => true,
            'data' => $tariff
        ]);
    }

    /**
     * Get a complete tariff with all related data
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getCompleteTariff(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['id'] ?? null;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        $tariff = $this->tariffModel->getComplete($tariffId);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff not found'
            ], 404);
        }
        
        return $response->withJson([
            'success' => true,
            'data' => $tariff
        ]);
    }

    /**
     * Create a new tariff
     *
     * @param Request $request
     * @param Response $response
     * @return Response
     */
    public function createTariff(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        $requiredFields = ['client_id', 'property_type', 'name', 'base_price'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $response->withJson([
                    'success' => false,
                    'message' => "Field '{$field}' is required"
                ], 400);
            }
        }
        
        // Generate UUID
        $data['id'] = Uuid::uuid4()->toString();
        
        // Create tariff
        $tariff = $this->tariffModel->create($data);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => $this->tariffModel->getError() ?: 'Failed to create tariff'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Tariff created successfully',
            'data' => $tariff
        ], 201);
    }

    /**
     * Update a tariff
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateTariff(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        // Check if tariff exists
        $tariff = $this->tariffModel->find($tariffId);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff not found'
            ], 404);
        }
        
        // Update tariff
        $updatedTariff = $this->tariffModel->update($tariffId, $data);
        
        if (!$updatedTariff) {
            return $response->withJson([
                'success' => false,
                'message' => $this->tariffModel->getError() ?: 'Failed to update tariff'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Tariff updated successfully',
            'data' => $updatedTariff
        ]);
    }

    /**
     * Delete a tariff
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteTariff(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['id'] ?? null;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        // Check if tariff exists
        $tariff = $this->tariffModel->find($tariffId);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff not found'
            ], 404);
        }
        
        // Check if tariff is in use
        $properties = $this->propertyTariffModel->getPropertiesUsingTariff($tariffId, true);
        
        if (!empty($properties)) {
            return $response->withJson([
                'success' => false,
                'message' => 'Cannot delete tariff because it is currently in use by one or more properties',
                'properties' => $properties
            ], 400);
        }
        
        // Delete tariff
        $result = $this->tariffModel->delete($tariffId);
        
        if (!$result) {
            return $response->withJson([
                'success' => false,
                'message' => 'Failed to delete tariff'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Tariff deleted successfully'
        ]);
    }

    /**
     * Calculate price for a given volume
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function calculatePrice(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        if (!isset($data['volume']) || !is_numeric($data['volume'])) {
            return $response->withJson([
                'success' => false,
                'message' => 'Valid volume is required'
            ], 400);
        }
        
        $volume = (float)$data['volume'];
        $customerId = $data['customer_id'] ?? null;
        $meterId = $data['meter_id'] ?? null;
        
        $result = $this->tariffModel->calculatePrice($tariffId, $volume, $customerId, $meterId);
        
        return $response->withJson($result);
    }

    /**
     * Get all seasonal rates for a tariff
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getSeasonalRates(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $activeOnly = $request->getQueryParams()['active_only'] ?? false;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        $seasonalRates = $this->seasonalRateModel->getAllForTariff($tariffId, $activeOnly);
        
        return $response->withJson([
            'success' => true,
            'data' => $seasonalRates
        ]);
    }

    /**
     * Create a new seasonal rate
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createSeasonalRate(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        // Validate required fields
        $requiredFields = ['name', 'start_date', 'end_date', 'rate_adjustment_type', 'rate_adjustment_value'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $response->withJson([
                    'success' => false,
                    'message' => "Field '{$field}' is required"
                ], 400);
            }
        }
        
        // Set tariff ID
        $data['tariff_id'] = $tariffId;
        
        // Create seasonal rate
        $seasonalRate = $this->seasonalRateModel->create($data);
        
        if (!$seasonalRate) {
            return $response->withJson([
                'success' => false,
                'message' => $this->seasonalRateModel->getError() ?: 'Failed to create seasonal rate'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Seasonal rate created successfully',
            'data' => $seasonalRate
        ], 201);
    }

    /**
     * Update a seasonal rate
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateSeasonalRate(Request $request, Response $response, array $args): Response
    {
        $rateId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$rateId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Seasonal rate ID is required'
            ], 400);
        }
        
        // Check if seasonal rate exists
        $seasonalRate = $this->seasonalRateModel->find($rateId);
        
        if (!$seasonalRate) {
            return $response->withJson([
                'success' => false,
                'message' => 'Seasonal rate not found'
            ], 404);
        }
        
        // Update seasonal rate
        $updatedRate = $this->seasonalRateModel->update($rateId, $data);
        
        if (!$updatedRate) {
            return $response->withJson([
                'success' => false,
                'message' => $this->seasonalRateModel->getError() ?: 'Failed to update seasonal rate'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Seasonal rate updated successfully',
            'data' => $updatedRate
        ]);
    }

    /**
     * Delete a seasonal rate
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteSeasonalRate(Request $request, Response $response, array $args): Response
    {
        $rateId = $args['id'] ?? null;
        
        if (!$rateId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Seasonal rate ID is required'
            ], 400);
        }
        
        // Check if seasonal rate exists
        $seasonalRate = $this->seasonalRateModel->find($rateId);
        
        if (!$seasonalRate) {
            return $response->withJson([
                'success' => false,
                'message' => 'Seasonal rate not found'
            ], 404);
        }
        
        // Delete seasonal rate
        $result = $this->seasonalRateModel->delete($rateId);
        
        if (!$result) {
            return $response->withJson([
                'success' => false,
                'message' => 'Failed to delete seasonal rate'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Seasonal rate deleted successfully'
        ]);
    }

    /**
     * Get all bulk discount tiers for a tariff
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getBulkDiscountTiers(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $activeOnly = $request->getQueryParams()['active_only'] ?? false;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        $bulkDiscountTiers = $this->bulkDiscountTierModel->getAllForTariff($tariffId, $activeOnly);
        
        return $response->withJson([
            'success' => true,
            'data' => $bulkDiscountTiers
        ]);
    }

    /**
     * Create a new bulk discount tier
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createBulkDiscountTier(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        // Validate required fields
        $requiredFields = ['min_volume', 'discount_type', 'discount_value'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $response->withJson([
                    'success' => false,
                    'message' => "Field '{$field}' is required"
                ], 400);
            }
        }
        
        // Set tariff ID
        $data['tariff_id'] = $tariffId;
        
        // Create bulk discount tier
        $bulkDiscountTier = $this->bulkDiscountTierModel->create($data);
        
        if (!$bulkDiscountTier) {
            return $response->withJson([
                'success' => false,
                'message' => $this->bulkDiscountTierModel->getError() ?: 'Failed to create bulk discount tier'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Bulk discount tier created successfully',
            'data' => $bulkDiscountTier
        ], 201);
    }

    /**
     * Update a bulk discount tier
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateBulkDiscountTier(Request $request, Response $response, array $args): Response
    {
        $tierId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tierId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Bulk discount tier ID is required'
            ], 400);
        }
        
        // Check if bulk discount tier exists
        $bulkDiscountTier = $this->bulkDiscountTierModel->find($tierId);
        
        if (!$bulkDiscountTier) {
            return $response->withJson([
                'success' => false,
                'message' => 'Bulk discount tier not found'
            ], 404);
        }
        
        // Update bulk discount tier
        $updatedTier = $this->bulkDiscountTierModel->update($tierId, $data);
        
        if (!$updatedTier) {
            return $response->withJson([
                'success' => false,
                'message' => $this->bulkDiscountTierModel->getError() ?: 'Failed to update bulk discount tier'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Bulk discount tier updated successfully',
            'data' => $updatedTier
        ]);
    }

    /**
     * Delete a bulk discount tier
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteBulkDiscountTier(Request $request, Response $response, array $args): Response
    {
        $tierId = $args['id'] ?? null;
        
        if (!$tierId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Bulk discount tier ID is required'
            ], 400);
        }
        
        // Check if bulk discount tier exists
        $bulkDiscountTier = $this->bulkDiscountTierModel->find($tierId);
        
        if (!$bulkDiscountTier) {
            return $response->withJson([
                'success' => false,
                'message' => 'Bulk discount tier not found'
            ], 404);
        }
        
        // Delete bulk discount tier
        $result = $this->bulkDiscountTierModel->delete($tierId);
        
        if (!$result) {
            return $response->withJson([
                'success' => false,
                'message' => 'Failed to delete bulk discount tier'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Bulk discount tier deleted successfully'
        ]);
    }

    /**
     * Get all dynamic discount rules for a tariff
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getDynamicDiscountRules(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $activeOnly = $request->getQueryParams()['active_only'] ?? false;
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        $dynamicDiscountRules = $this->dynamicDiscountRuleModel->getAllForTariff($tariffId, $activeOnly);
        
        return $response->withJson([
            'success' => true,
            'data' => $dynamicDiscountRules
        ]);
    }

    /**
     * Create a new dynamic discount rule
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createDynamicDiscountRule(Request $request, Response $response, array $args): Response
    {
        $tariffId = $args['tariffId'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$tariffId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff ID is required'
            ], 400);
        }
        
        // Validate required fields
        $requiredFields = ['name', 'rule_type', 'conditions', 'discount_type', 'discount_value'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $response->withJson([
                    'success' => false,
                    'message' => "Field '{$field}' is required"
                ], 400);
            }
        }
        
        // Set tariff ID
        $data['tariff_id'] = $tariffId;
        
        // Create dynamic discount rule
        $dynamicDiscountRule = $this->dynamicDiscountRuleModel->create($data);
        
        if (!$dynamicDiscountRule) {
            return $response->withJson([
                'success' => false,
                'message' => $this->dynamicDiscountRuleModel->getError() ?: 'Failed to create dynamic discount rule'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Dynamic discount rule created successfully',
            'data' => $dynamicDiscountRule
        ], 201);
    }

    /**
     * Update a dynamic discount rule
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updateDynamicDiscountRule(Request $request, Response $response, array $args): Response
    {
        $ruleId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$ruleId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Dynamic discount rule ID is required'
            ], 400);
        }
        
        // Check if dynamic discount rule exists
        $dynamicDiscountRule = $this->dynamicDiscountRuleModel->find($ruleId);
        
        if (!$dynamicDiscountRule) {
            return $response->withJson([
                'success' => false,
                'message' => 'Dynamic discount rule not found'
            ], 404);
        }
        
        // Update dynamic discount rule
        $updatedRule = $this->dynamicDiscountRuleModel->update($ruleId, $data);
        
        if (!$updatedRule) {
            return $response->withJson([
                'success' => false,
                'message' => $this->dynamicDiscountRuleModel->getError() ?: 'Failed to update dynamic discount rule'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Dynamic discount rule updated successfully',
            'data' => $updatedRule
        ]);
    }

    /**
     * Delete a dynamic discount rule
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteDynamicDiscountRule(Request $request, Response $response, array $args): Response
    {
        $ruleId = $args['id'] ?? null;
        
        if (!$ruleId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Dynamic discount rule ID is required'
            ], 400);
        }
        
        // Check if dynamic discount rule exists
        $dynamicDiscountRule = $this->dynamicDiscountRuleModel->find($ruleId);
        
        if (!$dynamicDiscountRule) {
            return $response->withJson([
                'success' => false,
                'message' => 'Dynamic discount rule not found'
            ], 404);
        }
        
        // Delete dynamic discount rule
        $result = $this->dynamicDiscountRuleModel->delete($ruleId);
        
        if (!$result) {
            return $response->withJson([
                'success' => false,
                'message' => 'Failed to delete dynamic discount rule'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Dynamic discount rule deleted successfully'
        ]);
    }

    /**
     * Get all tariff assignments for a property
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getPropertyTariffs(Request $request, Response $response, array $args): Response
    {
        $propertyId = $args['propertyId'] ?? null;
        $activeOnly = $request->getQueryParams()['active_only'] ?? false;
        
        if (!$propertyId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property ID is required'
            ], 400);
        }
        
        $propertyTariffs = $this->propertyTariffModel->getAllForProperty($propertyId, $activeOnly);
        
        return $response->withJson([
            'success' => true,
            'data' => $propertyTariffs
        ]);
    }

    /**
     * Get current tariff for a property
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getCurrentPropertyTariff(Request $request, Response $response, array $args): Response
    {
        $propertyId = $args['propertyId'] ?? null;
        
        if (!$propertyId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property ID is required'
            ], 400);
        }
        
        $currentTariff = $this->propertyTariffModel->getCurrentForProperty($propertyId);
        
        if (!$currentTariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'No active tariff found for this property'
            ], 404);
        }
        
        return $response->withJson([
            'success' => true,
            'data' => $currentTariff
        ]);
    }

    /**
     * Assign a tariff to a property
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function assignTariffToProperty(Request $request, Response $response, array $args): Response
    {
        $propertyId = $args['propertyId'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$propertyId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property ID is required'
            ], 400);
        }
        
        // Validate required fields
        $requiredFields = ['tariff_id', 'effective_from'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return $response->withJson([
                    'success' => false,
                    'message' => "Field '{$field}' is required"
                ], 400);
            }
        }
        
        // Check if property exists
        $property = $this->propertyModel->find($propertyId);
        
        if (!$property) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property not found'
            ], 404);
        }
        
        // Check if tariff exists
        $tariff = $this->tariffModel->find($data['tariff_id']);
        
        if (!$tariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Tariff not found'
            ], 404);
        }
        
        // Set property ID
        $data['property_id'] = $propertyId;
        
        // Create property tariff assignment
        $propertyTariff = $this->propertyTariffModel->create($data);
        
        if (!$propertyTariff) {
            return $response->withJson([
                'success' => false,
                'message' => $this->propertyTariffModel->getError() ?: 'Failed to assign tariff to property'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Tariff assigned to property successfully',
            'data' => $propertyTariff
        ], 201);
    }

    /**
     * Update a property tariff assignment
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function updatePropertyTariff(Request $request, Response $response, array $args): Response
    {
        $assignmentId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$assignmentId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property tariff assignment ID is required'
            ], 400);
        }
        
        // Check if property tariff assignment exists
        $propertyTariff = $this->propertyTariffModel->find($assignmentId);
        
        if (!$propertyTariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property tariff assignment not found'
            ], 404);
        }
        
        // Update property tariff assignment
        $updatedAssignment = $this->propertyTariffModel->update($assignmentId, $data);
        
        if (!$updatedAssignment) {
            return $response->withJson([
                'success' => false,
                'message' => $this->propertyTariffModel->getError() ?: 'Failed to update property tariff assignment'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Property tariff assignment updated successfully',
            'data' => $updatedAssignment
        ]);
    }

    /**
     * Delete a property tariff assignment
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deletePropertyTariff(Request $request, Response $response, array $args): Response
    {
        $assignmentId = $args['id'] ?? null;
        
        if (!$assignmentId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property tariff assignment ID is required'
            ], 400);
        }
        
        // Check if property tariff assignment exists
        $propertyTariff = $this->propertyTariffModel->find($assignmentId);
        
        if (!$propertyTariff) {
            return $response->withJson([
                'success' => false,
                'message' => 'Property tariff assignment not found'
            ], 404);
        }
        
        // Delete property tariff assignment
        $result = $this->propertyTariffModel->delete($assignmentId);
        
        if (!$result) {
            return $response->withJson([
                'success' => false,
                'message' => 'Failed to delete property tariff assignment'
            ], 500);
        }
        
        return $response->withJson([
            'success' => true,
            'message' => 'Property tariff assignment deleted successfully'
        ]);
    }

    /**
     * Get applied discounts for a customer
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getCustomerDiscounts(Request $request, Response $response, array $args): Response
    {
        $customerId = $args['customerId'] ?? null;
        $params = $request->getQueryParams();
        $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
        $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
        
        if (!$customerId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Customer ID is required'
            ], 400);
        }
        
        $discounts = $this->appliedDiscountModel->getAllForCustomer($customerId, $limit, $offset);
        
        return $response->withJson([
            'success' => true,
            'data' => $discounts
        ]);
    }

    /**
     * Get discount statistics for a customer
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getCustomerDiscountStats(Request $request, Response $response, array $args): Response
    {
        $customerId = $args['customerId'] ?? null;
        $params = $request->getQueryParams();
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        
        if (!$customerId) {
            return $response->withJson([
                'success' => false,
                'message' => 'Customer ID is required'
            ], 400);
        }
        
        $stats = $this->appliedDiscountModel->getCustomerDiscountStats($customerId, $startDate, $endDate);
        
        return $response->withJson([
            'success' => true,
            'data' => $stats
        ]);
    }
}