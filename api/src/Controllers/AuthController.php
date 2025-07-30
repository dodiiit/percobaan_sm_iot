<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use IndoWater\Api\Models\User;
use PDO;

class AuthController
{
    private ContainerInterface $container;
    private PDO $db;
    private User $userModel;

    public function __construct(ContainerInterface $container, PDO $db)
    {
        $this->container = $container;
        $this->db = $db;
        $this->userModel = new User($db);
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        if (empty($data['email']) || empty($data['password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email and password are required',
            ], 400);
        }
        
        // Find user by email
        $user = $this->userModel->findByEmail($data['email']);
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Invalid credentials',
            ], 401);
        }
        
        // Verify password
        if (!password_verify($data['password'], $user['password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Invalid credentials',
            ], 401);
        }
        
        // Check if user is active
        if ($user['status'] !== 'active') {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Account is not active',
            ], 403);
        }
        
        // Update last login timestamp
        $this->userModel->updateLastLogin($user['id']);
        
        // Generate JWT token
        $token = $this->generateToken($user);
        
        // Generate refresh token
        $refreshToken = $this->generateRefreshToken($user);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'status' => $user['status'],
                ],
                'token' => $token,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer',
                'expires_in' => 3600, // 1 hour
            ],
        ]);
    }

    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Name, email, and password are required',
            ], 400);
        }
        
        // Check if email already exists
        $existingUser = $this->userModel->findByEmail($data['email']);
        
        if ($existingUser) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email already exists',
            ], 409);
        }
        
        // Hash password
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Set default role and status
        $data['role'] = $data['role'] ?? 'customer';
        $data['status'] = 'pending';
        
        // Create user
        $userId = $this->userModel->create($data);
        
        if (!$userId) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to create user',
            ], 500);
        }
        
        // Send verification email (implementation depends on your email service)
        $this->sendVerificationEmail($data['email'], $userId);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Registration successful. Please check your email to verify your account.',
            'data' => [
                'user_id' => $userId,
            ],
        ], 201);
    }

    public function logout(Request $request, Response $response): Response
    {
        // Get user from request attributes (set by JWT middleware)
        $user = $request->getAttribute('user');
        
        if ($user) {
            // Clear remember token
            $this->userModel->updateRememberToken($user['id'], null);
        }
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Logout successful',
        ]);
    }

    public function refresh(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (empty($data['refresh_token'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Refresh token is required',
            ], 400);
        }
        
        try {
            $settings = $this->container->get('settings');
            $jwtSettings = $settings['jwt'];
            
            // Decode refresh token
            $decoded = JWT::decode($data['refresh_token'], new Key($jwtSettings['refresh_secret'], $jwtSettings['algorithm']));
            
            // Get user
            $user = $this->userModel->findById($decoded->sub);
            
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            // Check if user is active
            if ($user['status'] !== 'active') {
                throw new \Exception('Account is not active');
            }
            
            // Generate new tokens
            $token = $this->generateToken($user);
            $refreshToken = $this->generateRefreshToken($user);
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $token,
                    'refresh_token' => $refreshToken,
                    'token_type' => 'Bearer',
                    'expires_in' => 3600, // 1 hour
                ],
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Invalid refresh token',
            ], 401);
        }
    }

    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (empty($data['email'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email is required',
            ], 400);
        }
        
        // Find user by email
        $user = $this->userModel->findByEmail($data['email']);
        
        if (!$user) {
            // For security reasons, don't reveal that the email doesn't exist
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'If your email exists in our system, you will receive a password reset link',
            ]);
        }
        
        // Generate reset token
        $resetToken = bin2hex(random_bytes(32));
        
        // Store reset token (implementation depends on your storage method)
        $this->storeResetToken($user['id'], $resetToken);
        
        // Send reset email (implementation depends on your email service)
        $this->sendResetEmail($user['email'], $resetToken);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'If your email exists in our system, you will receive a password reset link',
        ]);
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (empty($data['token']) || empty($data['password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Token and password are required',
            ], 400);
        }
        
        // Verify reset token (implementation depends on your storage method)
        $userId = $this->verifyResetToken($data['token']);
        
        if (!$userId) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Invalid or expired token',
            ], 400);
        }
        
        // Hash new password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Update password
        $updated = $this->userModel->updatePassword($userId, $hashedPassword);
        
        if (!$updated) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update password',
            ], 500);
        }
        
        // Clear reset token
        $this->clearResetToken($data['token']);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Password has been reset successfully',
        ]);
    }

    public function verifyEmail(Request $request, Response $response, array $args): Response
    {
        $token = $args['token'] ?? '';
        
        if (empty($token)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Token is required',
            ], 400);
        }
        
        // Verify email token (implementation depends on your storage method)
        $userId = $this->verifyEmailToken($token);
        
        if (!$userId) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Invalid or expired token',
            ], 400);
        }
        
        // Update user's email_verified_at and status
        $verified = $this->userModel->verifyEmail($userId);
        
        if (!$verified) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to verify email',
            ], 500);
        }
        
        // Clear verification token
        $this->clearEmailToken($token);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Email has been verified successfully',
        ]);
    }

    public function resendVerification(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (empty($data['email'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email is required',
            ], 400);
        }
        
        // Find user by email
        $user = $this->userModel->findByEmail($data['email']);
        
        if (!$user) {
            // For security reasons, don't reveal that the email doesn't exist
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'If your email exists in our system, you will receive a verification link',
            ]);
        }
        
        // Check if email is already verified
        if ($user['email_verified_at']) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Email is already verified',
            ], 400);
        }
        
        // Send verification email
        $this->sendVerificationEmail($user['email'], $user['id']);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'If your email exists in our system, you will receive a verification link',
        ]);
    }

    private function generateToken(array $user): string
    {
        $settings = $this->container->get('settings');
        $jwtSettings = $settings['jwt'];
        
        $now = time();
        $payload = [
            'iat' => $now,
            'exp' => $now + $jwtSettings['expiry'],
            'sub' => $user['id'],
            'role' => $user['role'],
        ];
        
        return JWT::encode($payload, $jwtSettings['secret'], $jwtSettings['algorithm']);
    }

    private function generateRefreshToken(array $user): string
    {
        $settings = $this->container->get('settings');
        $jwtSettings = $settings['jwt'];
        
        $now = time();
        $payload = [
            'iat' => $now,
            'exp' => $now + $jwtSettings['refresh_expiry'],
            'sub' => $user['id'],
        ];
        
        $token = JWT::encode($payload, $jwtSettings['refresh_secret'], $jwtSettings['algorithm']);
        
        // Store refresh token
        $this->userModel->updateRememberToken($user['id'], $token);
        
        return $token;
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    // Placeholder methods for email verification and password reset
    // These would be implemented based on your specific requirements and email service

    private function sendVerificationEmail(string $email, string $userId): void
    {
        // Generate verification token
        $token = bin2hex(random_bytes(32));
        
        // Store token in database or cache
        // ...
        
        // Send email with verification link
        // ...
    }

    private function verifyEmailToken(string $token): ?string
    {
        // Retrieve user ID associated with token
        // ...
        
        return null; // Replace with actual implementation
    }

    private function clearEmailToken(string $token): void
    {
        // Remove token from database or cache
        // ...
    }

    private function storeResetToken(string $userId, string $token): void
    {
        // Store token in database or cache
        // ...
    }

    private function sendResetEmail(string $email, string $token): void
    {
        // Send email with reset link
        // ...
    }

    private function verifyResetToken(string $token): ?string
    {
        // Retrieve user ID associated with token
        // ...
        
        return null; // Replace with actual implementation
    }

    private function clearResetToken(string $token): void
    {
        // Remove token from database or cache
        // ...
    }
}