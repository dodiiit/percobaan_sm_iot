<?php

declare(strict_types=1);

namespace IndoWater\Api\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Container\ContainerInterface;
use IndoWater\Api\Models\User;
use PDO;

class UserController
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

    public function index(Request $request, Response $response): Response
    {
        // Get query parameters
        $params = $request->getQueryParams();
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $role = $params['role'] ?? null;
        
        // Calculate offset
        $offset = ($page - 1) * $limit;
        
        // Get users
        $conditions = [];
        if ($role) {
            $conditions['role'] = $role;
        }
        
        $users = $this->userModel->getAll($conditions, ['created_at' => 'DESC'], $limit, $offset);
        $total = $this->userModel->count($conditions);
        
        // Calculate pagination
        $totalPages = ceil($total / $limit);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Users retrieved successfully',
            'data' => [
                'users' => $users,
                'pagination' => [
                    'total' => $total,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                ],
            ],
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User ID is required',
            ], 400);
        }
        
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'User retrieved successfully',
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate required fields
        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Name, email, password, and role are required',
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
        
        // Set default status if not provided
        $data['status'] = $data['status'] ?? 'active';
        
        // Create user
        $userId = $this->userModel->create($data);
        
        if (!$userId) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to create user',
            ], 500);
        }
        
        // Get created user
        $user = $this->userModel->findById($userId);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'User created successfully',
            'data' => [
                'user' => $user,
            ],
        ], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        $data = $request->getParsedBody();
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User ID is required',
            ], 400);
        }
        
        // Check if user exists
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        // Check if email is being changed and if it already exists
        if (isset($data['email']) && $data['email'] !== $user['email']) {
            $existingUser = $this->userModel->findByEmail($data['email']);
            
            if ($existingUser) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Email already exists',
                ], 409);
            }
        }
        
        // Hash password if provided
        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            // Remove password from data if empty
            unset($data['password']);
        }
        
        // Update user
        $updated = $this->userModel->update($id, $data);
        
        if (!$updated) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update user',
            ], 500);
        }
        
        // Get updated user
        $updatedUser = $this->userModel->findById($id);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'User updated successfully',
            'data' => [
                'user' => $updatedUser,
            ],
        ]);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? '';
        
        if (empty($id)) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User ID is required',
            ], 400);
        }
        
        // Check if user exists
        $user = $this->userModel->findById($id);
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        // Delete user
        $deleted = $this->userModel->delete($id);
        
        if (!$deleted) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to delete user',
            ], 500);
        }
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'User deleted successfully',
        ]);
    }

    public function me(Request $request, Response $response): Response
    {
        // Get user from request attributes (set by JWT middleware)
        $user = $request->getAttribute('user');
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }
        
        // Get user details
        $userDetails = $this->userModel->findById($user['id']);
        
        if (!$userDetails) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'User profile retrieved successfully',
            'data' => [
                'user' => $userDetails,
            ],
        ]);
    }

    public function updateProfile(Request $request, Response $response): Response
    {
        // Get user from request attributes (set by JWT middleware)
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }
        
        // Check if user exists
        $userDetails = $this->userModel->findById($user['id']);
        
        if (!$userDetails) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        // Check if email is being changed and if it already exists
        if (isset($data['email']) && $data['email'] !== $userDetails['email']) {
            $existingUser = $this->userModel->findByEmail($data['email']);
            
            if ($existingUser) {
                return $this->jsonResponse($response, [
                    'status' => 'error',
                    'message' => 'Email already exists',
                ], 409);
            }
        }
        
        // Remove sensitive fields that shouldn't be updated via this endpoint
        unset($data['password'], $data['role'], $data['status']);
        
        // Update user
        $updated = $this->userModel->update($user['id'], $data);
        
        if (!$updated) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update profile',
            ], 500);
        }
        
        // Get updated user
        $updatedUser = $this->userModel->findById($user['id']);
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $updatedUser,
            ],
        ]);
    }

    public function updatePassword(Request $request, Response $response): Response
    {
        // Get user from request attributes (set by JWT middleware)
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        
        if (!$user) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }
        
        // Validate required fields
        if (empty($data['current_password']) || empty($data['new_password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Current password and new password are required',
            ], 400);
        }
        
        // Get user details
        $userDetails = $this->userModel->findById($user['id']);
        
        if (!$userDetails) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'User not found',
            ], 404);
        }
        
        // Verify current password
        if (!password_verify($data['current_password'], $userDetails['password'])) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Current password is incorrect',
            ], 400);
        }
        
        // Hash new password
        $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
        
        // Update password
        $updated = $this->userModel->updatePassword($user['id'], $hashedPassword);
        
        if (!$updated) {
            return $this->jsonResponse($response, [
                'status' => 'error',
                'message' => 'Failed to update password',
            ], 500);
        }
        
        return $this->jsonResponse($response, [
            'status' => 'success',
            'message' => 'Password updated successfully',
        ]);
    }

    private function jsonResponse(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}