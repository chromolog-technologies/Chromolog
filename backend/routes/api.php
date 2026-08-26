<?php

use App\Http\Controllers\Api\V1\AnalyticsHubController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\MetaWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Chromolog API Routes (V1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Public Authentication ──────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);

    // ── Public Lead Submission & Webhooks ───────────────────────────────
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/webhooks/meta', [MetaWebhookController::class, 'verify']);
    Route::post('/webhooks/meta', [MetaWebhookController::class, 'handleWebhook']);

    // ── Protected Admin API (Sanctum Middleware) ───────────────────────
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        
        // Auth inspection & logout
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Analytics & KPI Dashboard
        Route::get('/analytics/overview', [AnalyticsHubController::class, 'overview']);

        // Lead CRM Management
        Route::get('/leads', [LeadController::class, 'index']);
        Route::post('/leads', [LeadController::class, 'store']);
        Route::get('/leads/export-csv', [LeadController::class, 'exportCsv']);
        Route::get('/leads/{lead}', [LeadController::class, 'show']);
        Route::put('/leads/{lead}', [LeadController::class, 'update']);
        Route::patch('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
        Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);
    });
});
