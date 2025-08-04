<?php

namespace IndoWater\Api\Models;

use PDO;
use Exception;
use Ramsey\Uuid\Uuid;

class PropertyDocument extends BaseModel
{
    protected string $table = 'property_documents';
    
    // Document types
    public const DOCUMENT_TYPES = [
        'ownership_certificate' => 'Ownership Certificate',
        'building_permit' => 'Building Permit',
        'occupancy_permit' => 'Occupancy Permit',
        'tax_certificate' => 'Tax Certificate',
        'environmental_permit' => 'Environmental Permit',
        'fire_safety_certificate' => 'Fire Safety Certificate',
        'water_connection_permit' => 'Water Connection Permit',
        'business_license' => 'Business License',
        'insurance_policy' => 'Insurance Policy',
        'floor_plan' => 'Floor Plan',
        'site_plan' => 'Site Plan',
        'photos' => 'Property Photos',
        'other' => 'Other Documents'
    ];
    
    // Required documents by property type
    public const REQUIRED_DOCUMENTS = [
        'residential' => ['ownership_certificate', 'tax_certificate'],
        'commercial' => ['ownership_certificate', 'business_license', 'tax_certificate', 'fire_safety_certificate'],
        'industrial' => ['ownership_certificate', 'business_license', 'environmental_permit', 'fire_safety_certificate'],
        'dormitory' => ['ownership_certificate', 'occupancy_permit', 'fire_safety_certificate'],
        'rental_home' => ['ownership_certificate', 'tax_certificate'],
        'boarding_house' => ['ownership_certificate', 'business_license', 'fire_safety_certificate'],
        'apartment' => ['ownership_certificate', 'occupancy_permit', 'fire_safety_certificate'],
        'office_building' => ['ownership_certificate', 'business_license', 'fire_safety_certificate'],
        'shopping_center' => ['ownership_certificate', 'business_license', 'fire_safety_certificate', 'environmental_permit'],
        'warehouse' => ['ownership_certificate', 'business_license', 'fire_safety_certificate'],
        'factory' => ['ownership_certificate', 'business_license', 'environmental_permit', 'fire_safety_certificate'],
        'hotel' => ['ownership_certificate', 'business_license', 'fire_safety_certificate'],
        'restaurant' => ['ownership_certificate', 'business_license', 'fire_safety_certificate'],
        'hospital' => ['ownership_certificate', 'business_license', 'fire_safety_certificate', 'environmental_permit'],
        'school' => ['ownership_certificate', 'occupancy_permit', 'fire_safety_certificate'],
        'government' => ['ownership_certificate'],
        'other' => ['ownership_certificate']
    ];

    /**
     * Get documents for a property
     */
    public function findByPropertyId(string $propertyId): array
    {
        $sql = "SELECT pd.*, u.name as uploaded_by_name, v.name as verified_by_name
                FROM {$this->table} pd
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
            $document['file_size_formatted'] = $this->formatFileSize($document['file_size']);
        }
        
        return $documents;
    }

    /**
     * Upload document
     */
    public function upload(array $data): string
    {
        $id = Uuid::uuid4()->toString();
        
        $sql = "INSERT INTO {$this->table} (
                    id, property_id, document_type, document_name, file_path, file_size, mime_type,
                    uploaded_by, is_required, expiry_date, notes, created_at, updated_at
                ) VALUES (
                    :id, :property_id, :document_type, :document_name, :file_path, :file_size, :mime_type,
                    :uploaded_by, :is_required, :expiry_date, :notes, NOW(), NOW()
                )";
        
        $params = [
            'id' => $id,
            'property_id' => $data['property_id'],
            'document_type' => $data['document_type'],
            'document_name' => $data['document_name'],
            'file_path' => $data['file_path'],
            'file_size' => $data['file_size'],
            'mime_type' => $data['mime_type'],
            'uploaded_by' => $data['uploaded_by'],
            'is_required' => $data['is_required'] ?? false,
            'expiry_date' => $data['expiry_date'] ?? null,
            'notes' => $data['notes'] ?? null
        ];
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $id;
    }

    /**
     * Update document
     */
    public function update(string $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['document_name', 'expiry_date', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
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
     * Verify document
     */
    public function verify(string $id, string $verifiedBy, string $notes = null): bool
    {
        $sql = "UPDATE {$this->table} SET 
                    is_verified = TRUE,
                    verified_by = :verified_by,
                    verified_at = NOW(),
                    notes = :notes,
                    updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'verified_by' => $verifiedBy,
            'notes' => $notes
        ]);
    }

    /**
     * Reject document verification
     */
    public function reject(string $id, string $verifiedBy, string $notes): bool
    {
        $sql = "UPDATE {$this->table} SET 
                    is_verified = FALSE,
                    verified_by = :verified_by,
                    verified_at = NOW(),
                    notes = :notes,
                    updated_at = NOW()
                WHERE id = :id AND deleted_at IS NULL";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'verified_by' => $verifiedBy,
            'notes' => $notes
        ]);
    }

    /**
     * Delete document
     */
    public function delete(string $id): bool
    {
        $sql = "UPDATE {$this->table} SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    /**
     * Get required documents for property type
     */
    public function getRequiredDocuments(string $propertyType): array
    {
        $requiredTypes = self::REQUIRED_DOCUMENTS[$propertyType] ?? self::REQUIRED_DOCUMENTS['other'];
        
        $documents = [];
        foreach ($requiredTypes as $type) {
            $documents[] = [
                'type' => $type,
                'name' => self::DOCUMENT_TYPES[$type],
                'required' => true
            ];
        }
        
        return $documents;
    }

    /**
     * Check if property has all required documents
     */
    public function hasAllRequiredDocuments(string $propertyId, string $propertyType): array
    {
        $requiredTypes = self::REQUIRED_DOCUMENTS[$propertyType] ?? self::REQUIRED_DOCUMENTS['other'];
        
        // Get uploaded documents
        $sql = "SELECT document_type, is_verified FROM {$this->table} 
                WHERE property_id = :property_id AND deleted_at IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['property_id' => $propertyId]);
        $uploadedDocs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $uploadedTypes = [];
        $verifiedTypes = [];
        
        foreach ($uploadedDocs as $doc) {
            $uploadedTypes[] = $doc['document_type'];
            if ($doc['is_verified']) {
                $verifiedTypes[] = $doc['document_type'];
            }
        }
        
        $missingDocs = array_diff($requiredTypes, $uploadedTypes);
        $unverifiedDocs = array_diff($requiredTypes, $verifiedTypes);
        
        return [
            'has_all_required' => empty($missingDocs),
            'has_all_verified' => empty($unverifiedDocs),
            'missing_documents' => $missingDocs,
            'unverified_documents' => $unverifiedDocs,
            'required_count' => count($requiredTypes),
            'uploaded_count' => count(array_intersect($requiredTypes, $uploadedTypes)),
            'verified_count' => count(array_intersect($requiredTypes, $verifiedTypes))
        ];
    }

    /**
     * Get documents pending verification
     */
    public function getPendingVerification(int $limit = 50): array
    {
        $sql = "SELECT pd.*, p.name as property_name, p.type as property_type,
                       c.company_name as client_name, u.name as uploaded_by_name
                FROM {$this->table} pd
                JOIN properties p ON pd.property_id = p.id
                JOIN clients c ON p.client_id = c.id
                JOIN users u ON pd.uploaded_by = u.id
                WHERE pd.is_verified = FALSE AND pd.verified_by IS NULL AND pd.deleted_at IS NULL
                ORDER BY pd.created_at ASC
                LIMIT :limit";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($documents as &$document) {
            $document['is_required'] = (bool) $document['is_required'];
            $document['is_verified'] = (bool) $document['is_verified'];
            $document['file_size_formatted'] = $this->formatFileSize($document['file_size']);
        }
        
        return $documents;
    }

    /**
     * Get expiring documents
     */
    public function getExpiringDocuments(int $days = 30): array
    {
        $sql = "SELECT pd.*, p.name as property_name, p.type as property_type,
                       c.company_name as client_name, c.contact_email
                FROM {$this->table} pd
                JOIN properties p ON pd.property_id = p.id
                JOIN clients c ON p.client_id = c.id
                WHERE pd.expiry_date IS NOT NULL 
                AND pd.expiry_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
                AND pd.expiry_date >= CURDATE()
                AND pd.deleted_at IS NULL
                ORDER BY pd.expiry_date ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($documents as &$document) {
            $document['is_required'] = (bool) $document['is_required'];
            $document['is_verified'] = (bool) $document['is_verified'];
            $document['file_size_formatted'] = $this->formatFileSize($document['file_size']);
            $document['days_until_expiry'] = (new \DateTime($document['expiry_date']))->diff(new \DateTime())->days;
        }
        
        return $documents;
    }

    /**
     * Get document statistics
     */
    public function getStatistics(string $propertyId = null): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_documents,
                    COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_documents,
                    COUNT(CASE WHEN is_verified = FALSE AND verified_by IS NULL THEN 1 END) as pending_verification,
                    COUNT(CASE WHEN is_verified = FALSE AND verified_by IS NOT NULL THEN 1 END) as rejected_documents,
                    COUNT(CASE WHEN is_required = TRUE THEN 1 END) as required_documents,
                    COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_soon
                FROM {$this->table} 
                WHERE deleted_at IS NULL";
        
        $params = [];
        
        if ($propertyId) {
            $sql .= " AND property_id = :property_id";
            $params['property_id'] = $propertyId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Format file size
     */
    private function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Validate file upload
     */
    public function validateFile(array $file, string $documentType): array
    {
        $errors = [];
        
        // Check file size (max 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size must not exceed 10MB';
        }
        
        // Check file type
        $allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!in_array($file['type'], $allowedTypes)) {
            $errors[] = 'Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX';
        }
        
        // Check if document type is valid
        if (!array_key_exists($documentType, self::DOCUMENT_TYPES)) {
            $errors[] = 'Invalid document type';
        }
        
        return $errors;
    }

    /**
     * Generate secure file path
     */
    public function generateFilePath(string $propertyId, string $documentType, string $originalName): string
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $filename = Uuid::uuid4()->toString() . '.' . $extension;
        
        return "properties/{$propertyId}/documents/{$documentType}/{$filename}";
    }
}