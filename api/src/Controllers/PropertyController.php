<?php

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Models\Property;
use IndoWater\Api\Models\PropertyDocument;
use IndoWater\Api\Services\EmailService;
use IndoWater\Api\Services\RealtimeService;
use Respect\Validation\Validator as v;
use Exception;

class PropertyController extends BaseController
{
    private Property $propertyModel;
    private PropertyDocument $documentModel;
    private EmailService $emailService;
    private RealtimeService $realtimeService;

    public function __construct(
        Property $propertyModel,
        PropertyDocument $documentModel,
        EmailService $emailService,
        RealtimeService $realtimeService
    ) {
        $this->propertyModel = $propertyModel;
        $this->documentModel = $documentModel;
        $this->emailService = $emailService;
        $this->realtimeService = $realtimeService;
    }

    /**
     * Get all properties with filtering and pagination
     */
    public function index(Request $request, Response $response): Response
    {
        try {
            $params = $request->getQueryParams();
            $user = $request->getAttribute('user');
            
            // Build filters
            $filters = [];
            
            // Role-based filtering
            if ($user['role'] === 'client') {
                $filters['client_id'] = $user['client_id'];
            }
            
            // Apply query filters
            $allowedFilters = ['type', 'verification_status', 'status', 'city', 'province', 'search'];
            foreach ($allowedFilters as $filter) {
                if (!empty($params[$filter])) {
                    $filters[$filter] = $params[$filter];
                }
            }
            
            // Pagination
            $limit = isset($params['limit']) ? (int)$params['limit'] : 20;
            $page = isset($params['page']) ? (int)$params['page'] : 1;
            $offset = ($page - 1) * $limit;
            
            $properties = $this->propertyModel->findAll($filters, $limit, $offset);
            
            // Get total count for pagination
            $totalCount = $this->propertyModel->count($filters);
            
            return $this->jsonResponse($response, [
                'properties' => $properties,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $totalCount,
                    'total_pages' => ceil($totalCount / $limit)
                ],
                'filters' => $filters
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to fetch properties: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get property by ID
     */
    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $user = $request->getAttribute('user');
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Check access permissions
            if ($user['role'] === 'client' && $property['client_id'] !== $user['client_id']) {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            return $this->jsonResponse($response, $property);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to fetch property: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create new property
     */
    public function create(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $user = $request->getAttribute('user');
            
            // Validation
            $validation = $this->validatePropertyData($data);
            if (!$validation['valid']) {
                return $this->errorResponse($response, 'Validation failed', 400, $validation['errors']);
            }
            
            // Set client_id based on user role
            if ($user['role'] === 'client') {
                $data['client_id'] = $user['client_id'];
            } elseif (empty($data['client_id'])) {
                return $this->errorResponse($response, 'Client ID is required', 400);
            }
            
            $propertyId = $this->propertyModel->create($data);
            $property = $this->propertyModel->findById($propertyId);
            
            // Send notification to superadmin about new property registration
            $this->notifyNewPropertyRegistration($property);
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'created', $property);
            
            return $this->jsonResponse($response, [
                'message' => 'Property created successfully',
                'property' => $property
            ], 201);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to create property: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update property
     */
    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $data = $request->getParsedBody();
            $user = $request->getAttribute('user');
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Check access permissions
            if ($user['role'] === 'client' && $property['client_id'] !== $user['client_id']) {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            // Validation
            $validation = $this->validatePropertyData($data, true);
            if (!$validation['valid']) {
                return $this->errorResponse($response, 'Validation failed', 400, $validation['errors']);
            }
            
            // If property is approved and significant changes are made, reset to pending
            if ($property['verification_status'] === 'approved' && $this->hasSignificantChanges($property, $data)) {
                $data['verification_status'] = 'requires_update';
                $this->propertyModel->updateVerificationStatus(
                    $propertyId, 
                    'requires_update', 
                    $user['id'], 
                    'Property updated - requires re-verification'
                );
            }
            
            $success = $this->propertyModel->update($propertyId, $data);
            
            if (!$success) {
                return $this->errorResponse($response, 'Failed to update property', 500);
            }
            
            $updatedProperty = $this->propertyModel->findById($propertyId);
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'updated', $updatedProperty);
            
            return $this->jsonResponse($response, [
                'message' => 'Property updated successfully',
                'property' => $updatedProperty
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to update property: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete property
     */
    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $user = $request->getAttribute('user');
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Check access permissions
            if ($user['role'] === 'client' && $property['client_id'] !== $user['client_id']) {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            // Check if property has active meters
            $meters = $this->propertyModel->getPropertyMeters($propertyId);
            if (!empty($meters)) {
                return $this->errorResponse($response, 'Cannot delete property with active meters', 400);
            }
            
            $success = $this->propertyModel->delete($propertyId);
            
            if (!$success) {
                return $this->errorResponse($response, 'Failed to delete property', 500);
            }
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'deleted', $property);
            
            return $this->jsonResponse($response, [
                'message' => 'Property deleted successfully'
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to delete property: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update property verification status (superadmin only)
     */
    public function updateVerificationStatus(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $data = $request->getParsedBody();
            $user = $request->getAttribute('user');
            
            // Only superadmin can update verification status
            if ($user['role'] !== 'superadmin') {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Validation
            $status = $data['status'] ?? '';
            $notes = $data['notes'] ?? '';
            $rejectionReason = $data['rejection_reason'] ?? null;
            
            if (!in_array($status, ['pending', 'under_review', 'approved', 'rejected', 'requires_update'])) {
                return $this->errorResponse($response, 'Invalid verification status', 400);
            }
            
            if ($status === 'rejected' && empty($rejectionReason)) {
                return $this->errorResponse($response, 'Rejection reason is required when rejecting property', 400);
            }
            
            $success = $this->propertyModel->updateVerificationStatus(
                $propertyId, 
                $status, 
                $user['id'], 
                $notes, 
                $rejectionReason
            );
            
            if (!$success) {
                return $this->errorResponse($response, 'Failed to update verification status', 500);
            }
            
            $updatedProperty = $this->propertyModel->findById($propertyId);
            
            // Send notification email to client
            $this->notifyVerificationStatusChange($updatedProperty, $status, $notes, $rejectionReason);
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'verification_updated', $updatedProperty);
            
            return $this->jsonResponse($response, [
                'message' => 'Verification status updated successfully',
                'property' => $updatedProperty
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to update verification status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Associate meter with property
     */
    public function associateMeter(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $data = $request->getParsedBody();
            $user = $request->getAttribute('user');
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Check access permissions
            if ($user['role'] === 'client' && $property['client_id'] !== $user['client_id']) {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            // Validation
            if (empty($data['meter_id'])) {
                return $this->errorResponse($response, 'Meter ID is required', 400);
            }
            
            $associationId = $this->propertyModel->associateMeter($propertyId, $data['meter_id'], $data);
            
            // Get updated property with meters
            $updatedProperty = $this->propertyModel->findById($propertyId);
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'meter_associated', $updatedProperty);
            
            return $this->jsonResponse($response, [
                'message' => 'Meter associated successfully',
                'association_id' => $associationId,
                'property' => $updatedProperty
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to associate meter: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove meter association
     */
    public function dissociateMeter(Request $request, Response $response, array $args): Response
    {
        try {
            $propertyId = $args['id'];
            $meterId = $args['meter_id'];
            $user = $request->getAttribute('user');
            
            $property = $this->propertyModel->findById($propertyId);
            
            if (!$property) {
                return $this->errorResponse($response, 'Property not found', 404);
            }
            
            // Check access permissions
            if ($user['role'] === 'client' && $property['client_id'] !== $user['client_id']) {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            $success = $this->propertyModel->dissociateMeter($propertyId, $meterId);
            
            if (!$success) {
                return $this->errorResponse($response, 'Failed to remove meter association', 500);
            }
            
            // Get updated property
            $updatedProperty = $this->propertyModel->findById($propertyId);
            
            // Real-time notification
            $this->realtimeService->broadcastPropertyUpdate($propertyId, 'meter_dissociated', $updatedProperty);
            
            return $this->jsonResponse($response, [
                'message' => 'Meter association removed successfully',
                'property' => $updatedProperty
            ]);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to remove meter association: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get property statistics
     */
    public function statistics(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            
            $clientId = null;
            if ($user['role'] === 'client') {
                $clientId = $user['client_id'];
            }
            
            $stats = $this->propertyModel->getStatistics($clientId);
            
            return $this->jsonResponse($response, $stats);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to fetch statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get properties pending verification (superadmin only)
     */
    public function pendingVerification(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            
            if ($user['role'] !== 'superadmin') {
                return $this->errorResponse($response, 'Access denied', 403);
            }
            
            $params = $request->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
            
            $properties = $this->propertyModel->getPendingVerification($limit);
            
            return $this->jsonResponse($response, $properties);
            
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Failed to fetch pending properties: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get property types
     */
    public function getTypes(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, Property::TYPES);
    }

    /**
     * Get verification statuses
     */
    public function getVerificationStatuses(Request $request, Response $response): Response
    {
        return $this->jsonResponse($response, Property::VERIFICATION_STATUSES);
    }

    /**
     * Validate property data
     */
    private function validatePropertyData(array $data, bool $isUpdate = false): array
    {
        $errors = [];
        
        if (!$isUpdate || isset($data['name'])) {
            if (empty($data['name'])) {
                $errors['name'] = 'Property name is required';
            } elseif (strlen($data['name']) > 255) {
                $errors['name'] = 'Property name must not exceed 255 characters';
            }
        }
        
        if (!$isUpdate || isset($data['type'])) {
            if (empty($data['type'])) {
                $errors['type'] = 'Property type is required';
            } elseif (!array_key_exists($data['type'], Property::TYPES)) {
                $errors['type'] = 'Invalid property type';
            }
        }
        
        if (!$isUpdate || isset($data['address'])) {
            if (empty($data['address'])) {
                $errors['address'] = 'Address is required';
            }
        }
        
        if (!$isUpdate || isset($data['city'])) {
            if (empty($data['city'])) {
                $errors['city'] = 'City is required';
            }
        }
        
        if (!$isUpdate || isset($data['province'])) {
            if (empty($data['province'])) {
                $errors['province'] = 'Province is required';
            }
        }
        
        if (!$isUpdate || isset($data['postal_code'])) {
            if (empty($data['postal_code'])) {
                $errors['postal_code'] = 'Postal code is required';
            }
        }
        
        // Optional field validations
        if (isset($data['latitude']) && !empty($data['latitude'])) {
            if (!is_numeric($data['latitude']) || $data['latitude'] < -90 || $data['latitude'] > 90) {
                $errors['latitude'] = 'Invalid latitude value';
            }
        }
        
        if (isset($data['longitude']) && !empty($data['longitude'])) {
            if (!is_numeric($data['longitude']) || $data['longitude'] < -180 || $data['longitude'] > 180) {
                $errors['longitude'] = 'Invalid longitude value';
            }
        }
        
        if (isset($data['water_source']) && !empty($data['water_source'])) {
            if (!array_key_exists($data['water_source'], Property::WATER_SOURCES)) {
                $errors['water_source'] = 'Invalid water source';
            }
        }
        
        if (isset($data['water_pressure']) && !empty($data['water_pressure'])) {
            if (!array_key_exists($data['water_pressure'], Property::WATER_PRESSURES)) {
                $errors['water_pressure'] = 'Invalid water pressure level';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Check if property has significant changes that require re-verification
     */
    private function hasSignificantChanges(array $originalProperty, array $newData): bool
    {
        $significantFields = ['type', 'address', 'total_area', 'building_area', 'water_source'];
        
        foreach ($significantFields as $field) {
            if (isset($newData[$field]) && $originalProperty[$field] !== $newData[$field]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Send notification about new property registration
     */
    private function notifyNewPropertyRegistration(array $property): void
    {
        try {
            // Get superadmin emails
            $stmt = $this->propertyModel->getDb()->prepare("
                SELECT email FROM users WHERE role = 'superadmin' AND status = 'active'
            ");
            $stmt->execute();
            $superadmins = $stmt->fetchAll(\PDO::FETCH_COLUMN);
            
            foreach ($superadmins as $email) {
                $this->emailService->sendPropertyRegistrationNotification($email, $property);
            }
        } catch (Exception $e) {
            // Log error but don't fail the request
            error_log('Failed to send property registration notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification about verification status change
     */
    private function notifyVerificationStatusChange(array $property, string $status, string $notes = null, string $rejectionReason = null): void
    {
        try {
            // Get client contact email
            $stmt = $this->propertyModel->getDb()->prepare("
                SELECT c.contact_email, c.company_name, u.email as user_email
                FROM clients c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = :client_id
            ");
            $stmt->execute(['client_id' => $property['client_id']]);
            $client = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($client) {
                $this->emailService->sendPropertyVerificationStatusUpdate(
                    $client['contact_email'],
                    $property,
                    $status,
                    $notes,
                    $rejectionReason
                );
                
                // Also send to user email if different
                if ($client['user_email'] !== $client['contact_email']) {
                    $this->emailService->sendPropertyVerificationStatusUpdate(
                        $client['user_email'],
                        $property,
                        $status,
                        $notes,
                        $rejectionReason
                    );
                }
            }
        } catch (Exception $e) {
            // Log error but don't fail the request
            error_log('Failed to send verification status notification: ' . $e->getMessage());
        }
    }
}