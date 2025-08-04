<?php

namespace IndoWater\Api\Models;

use PDO;
use Exception;
use Ramsey\Uuid\Uuid;

class Property extends BaseModel
{
    protected string $table = 'properties';
    
    // Property types
    public const TYPES = [
        'residential' => 'Residential',
        'commercial' => 'Commercial',
        'industrial' => 'Industrial',
        'dormitory' => 'Dormitory',
        'rental_home' => 'Rental Home',
        'boarding_house' => 'Boarding House',
        'apartment' => 'Apartment',
        'office_building' => 'Office Building',
        'shopping_center' => 'Shopping Center',
        'warehouse' => 'Warehouse',
        'factory' => 'Factory',
        'hotel' => 'Hotel',
        'restaurant' => 'Restaurant',
        'hospital' => 'Hospital',
        'school' => 'School',
        'government' => 'Government',
        'other' => 'Other'
    ];
    
    // Verification statuses
    public const VERIFICATION_STATUSES = [
        'pending' => 'Pending Review',
        'under_review' => 'Under Review',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
        'requires_update' => 'Requires Update'
    ];
    
    // Property statuses
    public const STATUSES = [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'maintenance' => 'Under Maintenance',
        'suspended' => 'Suspended'
    ];
    
    // Water sources
    public const WATER_SOURCES = [
        'municipal' => 'Municipal Water',
        'well' => 'Well Water',
        'mixed' => 'Mixed Sources',
        'other' => 'Other'
    ];
    
    // Water pressure levels
    public const WATER_PRESSURES = [
        'low' => 'Low Pressure',
        'medium' => 'Medium Pressure',
        'high' => 'High Pressure'
    ];

    /**
     * Get all properties with optional filters
     */
    public function findAll(array $filters = [], int $limit = null, int $offset = 0): array
    {
        $sql = "SELECT p.*, c.company_name as client_name, 
                       u.name as verified_by_name,
                       COUNT(pm.meter_id) as meter_count
                FROM {$this->table} p
                LEFT JOIN clients c ON p.client_id = c.id
                LEFT JOIN users u ON p.verified_by = u.id
                LEFT JOIN property_meters pm ON p.id = pm.property_id AND pm.status = 'active'
                WHERE p.deleted_at IS NULL";
        
        $params = [];
        
        // Apply filters
        if (!empty($filters['client_id'])) {
            $sql .= " AND p.client_id = :client_id";
            $params['client_id'] = $filters['client_id'];
        }
        
        if (!empty($filters['type'])) {
            $sql .= " AND p.type = :type";
            $params['type'] = $filters['type'];
        }
        
        if (!empty($filters['verification_status'])) {
            $sql .= " AND p.verification_status = :verification_status";
            $params['verification_status'] = $filters['verification_status'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND p.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['city'])) {
            $sql .= " AND p.city LIKE :city";
            $params['city'] = '%' . $filters['city'] . '%';
        }
        
        if (!empty($filters['province'])) {
            $sql .= " AND p.province LIKE :province";
            $params['province'] = '%' . $filters['province'] . '%';
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (p.name LIKE :search OR p.property_code LIKE :search OR p.address LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";
        
        if ($limit) {
            $sql .= " LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($properties as &$property) {
            $property['documents'] = $property['documents'] ? json_decode($property['documents'], true) : [];
            $property['amenities'] = $property['amenities'] ? json_decode($property['amenities'], true) : [];
            $property['backup_water'] = (bool) $property['backup_water'];
        }
        
        return $properties;
    }

    /**
     * Get property by ID with full details
     */
    public function findById(string $id): ?array
    {
        $sql = "SELECT p.*, c.company_name as client_name, c.contact_person as client_contact,
                       u.name as verified_by_name, u.email as verified_by_email
                FROM {$this->table} p
                LEFT JOIN clients c ON p.client_id = c.id
                LEFT JOIN users u ON p.verified_by = u.id
                WHERE p.id = :id AND p.deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        $property = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($property) {
            // Parse JSON fields
            $property['documents'] = $property['documents'] ? json_decode($property['documents'], true) : [];
            $property['amenities'] = $property['amenities'] ? json_decode($property['amenities'], true) : [];
            $property['backup_water'] = (bool) $property['backup_water'];
            
            // Get associated meters
            $property['meters'] = $this->getPropertyMeters($id);
            
            // Get verification history
            $property['verification_history'] = $this->getVerificationHistory($id);
            
            // Get documents
            $property['document_files'] = $this->getPropertyDocuments($id);
        }
        
        return $property;
    }

    /**
     * Create new property
     */
    public function create(array $data): string
    {
        $id = Uuid::uuid4()->toString();
        
        // Generate property code if not provided
        if (empty($data['property_code'])) {
            $data['property_code'] = $this->generatePropertyCode($data['client_id'], $data['type']);
        }
        
        $sql = "INSERT INTO {$this->table} (
                    id, client_id, property_code, name, description, type, address, city, province, postal_code,
                    latitude, longitude, total_area, building_area, floors, units, year_built,
                    owner_name, owner_phone, owner_email, manager_name, manager_phone, manager_email,
                    verification_status, documents, amenities, water_source, water_pressure, backup_water,
                    emergency_contact_name, emergency_contact_phone, status, created_at, updated_at
                ) VALUES (
                    :id, :client_id, :property_code, :name, :description, :type, :address, :city, :province, :postal_code,
                    :latitude, :longitude, :total_area, :building_area, :floors, :units, :year_built,
                    :owner_name, :owner_phone, :owner_email, :manager_name, :manager_phone, :manager_email,
                    :verification_status, :documents, :amenities, :water_source, :water_pressure, :backup_water,
                    :emergency_contact_name, :emergency_contact_phone, :status, NOW(), NOW()
                )";
        
        $params = [
            'id' => $id,
            'client_id' => $data['client_id'],
            'property_code' => $data['property_code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? 'residential',
            'address' => $data['address'],
            'city' => $data['city'],
            'province' => $data['province'],
            'postal_code' => $data['postal_code'],
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'total_area' => $data['total_area'] ?? null,
            'building_area' => $data['building_area'] ?? null,
            'floors' => $data['floors'] ?? null,
            'units' => $data['units'] ?? null,
            'year_built' => $data['year_built'] ?? null,
            'owner_name' => $data['owner_name'] ?? null,
            'owner_phone' => $data['owner_phone'] ?? null,
            'owner_email' => $data['owner_email'] ?? null,
            'manager_name' => $data['manager_name'] ?? null,
            'manager_phone' => $data['manager_phone'] ?? null,
            'manager_email' => $data['manager_email'] ?? null,
            'verification_status' => 'pending',
            'documents' => isset($data['documents']) ? json_encode($data['documents']) : null,
            'amenities' => isset($data['amenities']) ? json_encode($data['amenities']) : null,
            'water_source' => $data['water_source'] ?? 'municipal',
            'water_pressure' => $data['water_pressure'] ?? null,
            'backup_water' => $data['backup_water'] ?? false,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
            'status' => $data['status'] ?? 'active'
        ];
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        // Log the creation in verification history
        $this->addVerificationHistory($id, $data['client_id'], 'submitted', null, 'pending', 'Property submitted for verification');
        
        return $id;
    }

    /**
     * Update property
     */
    public function update(string $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = [
            'name', 'description', 'type', 'address', 'city', 'province', 'postal_code',
            'latitude', 'longitude', 'total_area', 'building_area', 'floors', 'units', 'year_built',
            'owner_name', 'owner_phone', 'owner_email', 'manager_name', 'manager_phone', 'manager_email',
            'water_source', 'water_pressure', 'backup_water', 'emergency_contact_name', 'emergency_contact_phone',
            'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }
        
        // Handle JSON fields
        if (array_key_exists('documents', $data)) {
            $fields[] = "documents = :documents";
            $params['documents'] = json_encode($data['documents']);
        }
        
        if (array_key_exists('amenities', $data)) {
            $fields[] = "amenities = :amenities";
            $params['amenities'] = json_encode($data['amenities']);
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $fields[] = "updated_at = NOW()";
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id AND deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Update verification status
     */
    public function updateVerificationStatus(string $id, string $status, string $userId, string $notes = null, string $rejectionReason = null): bool
    {
        // Get current status
        $currentProperty = $this->findById($id);
        if (!$currentProperty) {
            throw new Exception('Property not found');
        }
        
        $previousStatus = $currentProperty['verification_status'];
        
        $sql = "UPDATE {$this->table} SET 
                    verification_status = :status,
                    verification_notes = :notes,
                    verified_by = :verified_by,
                    verified_at = :verified_at,
                    rejection_reason = :rejection_reason,
                    updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL";
        
        $params = [
            'id' => $id,
            'status' => $status,
            'notes' => $notes,
            'verified_by' => $userId,
            'verified_at' => in_array($status, ['approved', 'rejected']) ? date('Y-m-d H:i:s') : null,
            'rejection_reason' => $rejectionReason
        ];
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            // Log the status change
            $action = match($status) {
                'under_review' => 'under_review',
                'approved' => 'approved',
                'rejected' => 'rejected',
                'requires_update' => 'update_requested',
                default => 'under_review'
            };
            
            $this->addVerificationHistory($id, $userId, $action, $previousStatus, $status, $notes);
        }
        
        return $result;
    }

    /**
     * Associate meter with property
     */
    public function associateMeter(string $propertyId, string $meterId, array $data = []): string
    {
        $id = Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO property_meters (
                    id, property_id, meter_id, installation_location, is_main_meter, 
                    meter_purpose, status, notes, created_at, updated_at
                ) VALUES (
                    :id, :property_id, :meter_id, :installation_location, :is_main_meter,
                    :meter_purpose, :status, :notes, NOW(), NOW()
                )";
        
        $params = [
            'id' => $id,
            'property_id' => $propertyId,
            'meter_id' => $meterId,
            'installation_location' => $data['installation_location'] ?? null,
            'is_main_meter' => $data['is_main_meter'] ?? false,
            'meter_purpose' => $data['meter_purpose'] ?? 'main_supply',
            'status' => $data['status'] ?? 'active',
            'notes' => $data['notes'] ?? null
        ];
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $id;
    }

    /**
     * Remove meter association
     */
    public function dissociateMeter(string $propertyId, string $meterId): bool
    {
        $sql = "UPDATE property_meters SET 
                    status = 'inactive', 
                    removed_at = NOW(), 
                    updated_at = NOW()
                WHERE property_id = :property_id AND meter_id = :meter_id";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'property_id' => $propertyId,
            'meter_id' => $meterId
        ]);
    }

    /**
     * Get property meters
     */
    public function getPropertyMeters(string $propertyId): array
    {
        $sql = "SELECT pm.*, m.meter_id, m.meter_type, m.meter_model, m.status as meter_status,
                       c.first_name, c.last_name, c.customer_number
                FROM property_meters pm
                JOIN meters m ON pm.meter_id = m.id
                LEFT JOIN customers c ON m.customer_id = c.id
                WHERE pm.property_id = :property_id AND pm.status = 'active'
                ORDER BY pm.is_main_meter DESC, pm.created_at ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['property_id' => $propertyId]);
        
        $meters = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($meters as &$meter) {
            $meter['is_main_meter'] = (bool) $meter['is_main_meter'];
            $meter['customer_name'] = trim($meter['first_name'] . ' ' . $meter['last_name']);
        }
        
        return $meters;
    }

    /**
     * Get verification history
     */
    public function getVerificationHistory(string $propertyId): array
    {
        $sql = "SELECT pvh.*, u.name as user_name, u.email as user_email
                FROM property_verification_history pvh
                JOIN users u ON pvh.user_id = u.id
                WHERE pvh.property_id = :property_id
                ORDER BY pvh.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['property_id' => $propertyId]);
        
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($history as &$entry) {
            $entry['documents_changed'] = $entry['documents_changed'] ? json_decode($entry['documents_changed'], true) : [];
        }
        
        return $history;
    }

    /**
     * Get property documents
     */
    public function getPropertyDocuments(string $propertyId): array
    {
        $sql = "SELECT pd.*, u.name as uploaded_by_name, v.name as verified_by_name
                FROM property_documents pd
                JOIN users u ON pd.uploaded_by = u.id
                LEFT JOIN users v ON pd.verified_by = v.id
                WHERE pd.property_id = :property_id AND pd.deleted_at IS NULL
                ORDER BY pd.is_required DESC, pd.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['property_id' => $propertyId]);
        
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($documents as &$document) {
            $document['is_required'] = (bool) $document['is_required'];
            $document['is_verified'] = (bool) $document['is_verified'];
        }
        
        return $documents;
    }

    /**
     * Add verification history entry
     */
    private function addVerificationHistory(string $propertyId, string $userId, string $action, ?string $previousStatus, string $newStatus, string $notes = null): void
    {
        $id = Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO property_verification_history (
                    id, property_id, user_id, action, previous_status, new_status, notes, created_at
                ) VALUES (
                    :id, :property_id, :user_id, :action, :previous_status, :new_status, :notes, NOW()
                )";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'property_id' => $propertyId,
            'user_id' => $userId,
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'notes' => $notes
        ]);
    }

    /**
     * Generate unique property code
     */
    private function generatePropertyCode(string $clientId, string $type): string
    {
        // Get client info for code prefix
        $stmt = $this->db->prepare("SELECT company_name FROM clients WHERE id = :id");
        $stmt->execute(['id' => $clientId]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$client) {
            throw new Exception('Client not found');
        }
        
        // Create prefix from company name and type
        $companyPrefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $client['company_name']), 0, 3));
        $typePrefix = strtoupper(substr($type, 0, 3));
        
        // Get next sequence number
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM {$this->table} WHERE client_id = :client_id AND deleted_at IS NULL");
        $stmt->execute(['client_id' => $clientId]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        
        return "{$companyPrefix}-{$typePrefix}-{$sequence}";
    }

    /**
     * Get properties pending verification
     */
    public function getPendingVerification(int $limit = 50): array
    {
        return $this->findAll(['verification_status' => 'pending'], $limit);
    }

    /**
     * Get properties by client
     */
    public function findByClientId(string $clientId, array $filters = []): array
    {
        $filters['client_id'] = $clientId;
        return $this->findAll($filters);
    }

    /**
     * Soft delete property
     */
    public function delete(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get property statistics
     */
    public function getStatistics(string $clientId = null): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_properties,
                    COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_verification,
                    COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
                FROM {$this->table} 
                WHERE deleted_at IS NULL";
        
        $params = [];
        
        if ($clientId) {
            $sql .= " AND client_id = :client_id";
            $params['client_id'] = $clientId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}