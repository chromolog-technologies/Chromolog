<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends BaseApiController
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $data = $this->authService->authenticateAdmin($request->validated());
            return $this->success($data, 'Admin authenticated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error('Authentication failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->error('Internal server error', 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success([
            'user' => $request->user(),
        ], 'Current user details');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Logged out successfully');
    }
}
