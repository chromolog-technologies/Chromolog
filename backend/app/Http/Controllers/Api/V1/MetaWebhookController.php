<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\MetaLeadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MetaWebhookController extends BaseApiController
{
    public function __construct(
        protected MetaLeadService $metaLeadService
    ) {}

    /**
     * Webhook verification (GET challenge from Meta for Instagram / Facebook Ads setup)
     */
    public function verify(Request $request): Response|JsonResponse
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expectedToken = config('services.meta.webhook_verify_token', 'chromolog_meta_verify_secret_2026');

        if ($mode === 'subscribe' && $token === $expectedToken) {
            return response($challenge, 200);
        }

        return $this->error('Webhook verification failed', 403);
    }

    /**
     * Incoming Meta Lead Ads Webhook Listener (POST)
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();
        $lead = $this->metaLeadService->processMetaLeadWebhook($payload);

        if ($lead) {
            return $this->success(['lead_id' => $lead->id], 'Meta lead ingested successfully');
        }

        return $this->success(null, 'Webhook received');
    }
}
