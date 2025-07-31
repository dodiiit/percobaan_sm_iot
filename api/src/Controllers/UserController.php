<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use IndoWater\Api\Models\User;
use Respect\Validation\Validator as v;

class UserController
{
    private User $userModel;

    public function __construct(User $userModel)
    {
        $this->userModel = $userModel;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $queryParams = $request->getQueryParams();
            $limit = (int) ($queryParams['limit'] ?? 20);
            $offset = (int) ($queryParams['offset'] ?? 0);
            $role = $queryParams['role'] ?? null;

            $conditions = [];
            if ($role) {
                $conditions['role'] = $role;
            }

            $users = $this->userModel->findAll($conditions, $limit, $offset);
            $total = $this->userModel->count($conditions);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => [
                    'users' => $users,
                    'pagination' => [
                        'total' => $total,
                        'limit' => $limit,
                        'offset' => $offset,
                        'has_more' => ($offset + $limit) < $total
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $user = $this->userModel->find($id);

            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('name', v::stringType()->notEmpty())
                        ->key('email', v::email()->notEmpty())
                        ->key('password', v::stringType()->length(8, null))
                        ->key('role', v::in(['superadmin', 'client', 'customer']));

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            // Check if email already exists
            if ($this->userModel->findByEmail($data['email'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Email already exists'
                ], 409);
            }

            // Hash password
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            $data['status'] = $data['status'] ?? 'active';

            $user = $this->userModel->create($data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'User created successfully',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];
            $data = $request->getParsedBody();

            $user = $this->userModel->find($id);
            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // Remove password from update data if present
            unset($data['password']);

            $updatedUser = $this->userModel->update($id, $data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'User updated successfully',
                'data' => $updatedUser
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $id = $args['id'];

            $user = $this->userModel->find($id);
            if (!$user) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            $this->userModel->delete($id);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request, Response $response): Response
    {
        try {
            // Get user from JWT token (set by middleware)
            $user = $request->getAttribute('user');

            return $this->jsonResponse($response, [
                'status' => 'success',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $data = $request->getParsedBody();

            // Remove sensitive fields
            unset($data['password'], $data['role'], $data['status']);

            $updatedUser = $this->userModel->update($user['id'], $data);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => $updatedUser
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updatePassword(Request $request, Response $response): Response
    {
        try {
            $user = $request->getAttribute('user');
            $data = $request->getParsedBody();

            // Validate input
            $validator = v::key('current_password', v::stringType()->notEmpty())
                        ->key('password', v::stringType()->length(8, null))
                        ->key('password_confirmation', v::stringType()->equals($data['password'] ?? ''));

            if (!$validator->validate($data)) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Invalid input data'
                ], 400);
            }

            // Get current user data with password
            $currentUser = $this->userModel->find($user['id']);
            
            // Verify current password
            if (!password_verify($data['current_password'], $currentUser['password'])) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $this->userModel->updatePassword($user['id'], $hashedPassword);

            return $this->jsonResponse($response, [
                'status' => 'success',
                'message' => 'Password updated successfully'
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
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