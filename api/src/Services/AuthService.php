<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use IndoWater\Api\Models\User;
use IndoWater\Api\Services\EncryptionService;
use Ramsey\Uuid\Uuid;

class AuthService
{
    private User $userModel;
    private string $jwtSecret;
    private int $jwtTtl;
    private int $jwtRefreshTtl;
    private EncryptionService $encryptionService;

    public function __construct(
        User $userModel, 
        string $jwtSecret, 
        int $jwtTtl = 3600, 
        int $jwtRefreshTtl = 604800,
        EncryptionService $encryptionService
    ) {
        $this->userModel = $userModel;
        $this->jwtSecret = $jwtSecret;
        $this->jwtTtl = $jwtTtl;
        $this->jwtRefreshTtl = $jwtRefreshTtl;
        $this->encryptionService = $encryptionService;
    }

    public function login(string $email, string $password): array
    {
        $user = $this->userModel->findByEmail($email);
        
        if (!$user || !$this->encryptionService->verifyPassword($password, $user['password'])) {
            throw new \Exception('Invalid credentials', 401);
        }

        if ($user['status'] !== 'active') {
            throw new \Exception('Account is not active', 403);
        }

        // Update last login
        $this->userModel->updateLastLogin($user['id']);

        // Generate tokens
        $accessToken = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken($user);

        return [
            'user' => $this->userModel->find($user['id']), // Get updated user data
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtTtl
        ];
    }

    public function register(array $userData): array
    {
        // Check if email already exists
        if ($this->userModel->findByEmail($userData['email'])) {
            throw new \Exception('Email already exists', 409);
        }

        // Hash password with secure algorithm
        $userData['password'] = $this->encryptionService->hashPassword($userData['password']);
        
        // Set default values
        $userData['role'] = $userData['role'] ?? 'customer';
        $userData['status'] = 'pending'; // Requires email verification

        // Create user
        $user = $this->userModel->create($userData);

        // Generate email verification token
        $verificationToken = $this->generateEmailVerificationToken($user['id']);

        return [
            'user' => $user,
            'verification_token' => $verificationToken
        ];
    }

    public function refreshToken(string $refreshToken): array
    {
        try {
            $decoded = JWT::decode($refreshToken, new Key($this->jwtSecret, 'HS256'));
            
            if ($decoded->type !== 'refresh') {
                throw new \Exception('Invalid token type', 401);
            }

            $user = $this->userModel->find($decoded->user_id);
            
            if (!$user || $user['status'] !== 'active') {
                throw new \Exception('User not found or inactive', 401);
            }

            // Generate new access token
            $accessToken = $this->generateAccessToken($user);

            return [
                'access_token' => $accessToken,
                'token_type' => 'Bearer',
                'expires_in' => $this->jwtTtl
            ];
        } catch (\Exception $e) {
            throw new \Exception('Invalid refresh token', 401);
        }
    }

    public function verifyToken(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            if ($decoded->type !== 'access') {
                throw new \Exception('Invalid token type', 401);
            }

            $user = $this->userModel->find($decoded->user_id);
            
            if (!$user || $user['status'] !== 'active') {
                throw new \Exception('User not found or inactive', 401);
            }

            return $user;
        } catch (\Exception $e) {
            throw new \Exception('Invalid token', 401);
        }
    }

    public function verifyEmail(string $token): bool
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            if ($decoded->type !== 'email_verification') {
                throw new \Exception('Invalid token type', 401);
            }

            return $this->userModel->verifyEmail($decoded->user_id);
        } catch (\Exception $e) {
            throw new \Exception('Invalid verification token', 401);
        }
    }

    public function generatePasswordResetToken(string $email): string
    {
        $user = $this->userModel->findByEmail($email);
        
        if (!$user) {
            throw new \Exception('User not found', 404);
        }

        $payload = [
            'user_id' => $user['id'],
            'email' => $email,
            'type' => 'password_reset',
            'iat' => time(),
            'exp' => time() + 3600 // 1 hour
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    public function resetPassword(string $token, string $newPassword): bool
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            if ($decoded->type !== 'password_reset') {
                throw new \Exception('Invalid token type', 401);
            }

            $hashedPassword = $this->encryptionService->hashPassword($newPassword);
            return $this->userModel->updatePassword($decoded->user_id, $hashedPassword);
        } catch (\Exception $e) {
            throw new \Exception('Invalid reset token', 401);
        }
    }

    private function generateAccessToken(array $user): string
    {
        // Generate a unique token ID
        $jti = $this->encryptionService->generateToken(16);
        
        $payload = [
            'jti' => $jti, // JWT ID for token revocation
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'type' => 'access',
            'iat' => time(),
            'nbf' => time(), // Not before
            'exp' => time() + $this->jwtTtl,
            'iss' => 'indowater-api', // Issuer
            'aud' => 'indowater-client' // Audience
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    private function generateRefreshToken(array $user): string
    {
        // Generate a unique token ID
        $jti = $this->encryptionService->generateToken(16);
        
        $payload = [
            'jti' => $jti, // JWT ID for token revocation
            'user_id' => $user['id'],
            'type' => 'refresh',
            'iat' => time(),
            'nbf' => time(), // Not before
            'exp' => time() + $this->jwtRefreshTtl,
            'iss' => 'indowater-api', // Issuer
            'aud' => 'indowater-client' // Audience
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    private function generateEmailVerificationToken(string $userId): string
    {
        // Generate a unique token ID
        $jti = $this->encryptionService->generateToken(16);
        
        $payload = [
            'jti' => $jti, // JWT ID for token revocation
            'user_id' => $userId,
            'type' => 'email_verification',
            'iat' => time(),
            'nbf' => time(), // Not before
            'exp' => time() + 86400, // 24 hours
            'iss' => 'indowater-api', // Issuer
            'aud' => 'indowater-client' // Audience
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }
    
    /**
     * Encrypt sensitive data before storing
     *
     * @param mixed $data The data to encrypt
     * @return string The encrypted data
     */
    public function encryptData($data): string
    {
        return $this->encryptionService->encrypt($data);
    }
    
    /**
     * Decrypt sensitive data
     *
     * @param string $encryptedData The encrypted data
     * @return mixed The decrypted data
     */
    public function decryptData(string $encryptedData)
    {
        return $this->encryptionService->decrypt($encryptedData);
    }
}