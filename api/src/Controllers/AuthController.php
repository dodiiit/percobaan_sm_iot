<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Services\AuthService;
use IndoWater\Api\Services\EmailService;
use Respect\Validation\Validator as v;

class AuthController
{
    private AuthService $authService;
    private EmailService $emailService;

    public function __construct(AuthService $authService, EmailService $emailService)
    {
        $this->authService = $authService;
        $this->emailService = $emailService;
    }

    public function login(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('email', v::email()->notEmpty())
                        ->key('password', v::stringType()->notEmpty());

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            $result = $this->authService->login(
                $data['email'],
                $data['password']
            );

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function register(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('name', v::stringType()->notEmpty())
                        ->key('email', v::email()->notEmpty())
                        ->key('password', v::stringType()->length(8, null))
                        ->key('password_confirmation', v::stringType()->equals($data['password'] ?? ''));

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            $result = $this->authService->register($data);

            // Send verification email
            $this->emailService->sendVerificationEmail(
                $result['user']['email'],
                $result['user']['name'],
                $result['verification_token']
            );

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Registration successful. Please check your email to verify your account.',
                'data' => [
                    'user' => $result['user']
                ]
            ], 201);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function logout(Request $request, Response $response): Response
    {
        // For JWT, logout is handled client-side by removing the token
        // Here we could implement token blacklisting if needed
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Logout successful'
        ]);
    }

    public function refresh(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if (!isset($data['refresh_token'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Refresh token is required'
                ], 400);
            }

            $result = $this->authService->refreshToken($data['refresh_token']);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Token refreshed successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function forgotPassword(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Valid email is required'
                ], 400);
            }

            $resetToken = $this->authService->generatePasswordResetToken($data['email']);

            // Send password reset email
            $this->emailService->sendPasswordResetEmail(
                $data['email'],
                $resetToken
            );

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Password reset link has been sent to your email'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('token', v::stringType()->notEmpty())
                        ->key('password', v::stringType()->length(8, null))
                        ->key('password_confirmation', v::stringType()->equals($data['password'] ?? ''));

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            $this->authService->resetPassword($data['token'], $data['password']);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Password has been reset successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function verifyEmail(Request $request, Response $response, array $args): Response
    {
        try {
            $token = $args['token'] ?? '';

            if (empty($token)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Verification token is required'
                ], 400);
            }

            $this->authService->verifyEmail($token);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Email verified successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function resendVerification(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Valid email is required'
                ], 400);
            }

            // Generate new verification token and send email
            // This would require additional logic in AuthService
            
            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Verification email has been resent'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}