<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaLeadService
{
    /**
     * Process incoming Meta (Facebook / Instagram) Lead Ad Webhook payload
     */
    public function processMetaLeadWebhook(array $payload): ?Lead
    {
        try {
            $entry = $payload['entry'][0] ?? null;
            $changes = $entry['changes'][0] ?? null;
            $value = $changes['value'] ?? null;

            if (!$value || !isset($value['leadgen_id'])) {
                return null;
            }

            $leadgenId = $value['leadgen_id'];
            $pageId = $value['page_id'] ?? null;
            $formId = $value['form_id'] ?? null;

            // Determine channel source (instagram vs facebook)
            $channel = str_contains(json_encode($payload), 'instagram') ? 'instagram' : 'facebook';

            // Retrieve lead details via Meta Graph API if token configured
            $metaAccessToken = config('services.meta.access_token');
            $leadData = [];

            if ($metaAccessToken) {
                $response = Http::get("https://graph.facebook.com/v19.0/{$leadgenId}", [
                    'access_token' => $metaAccessToken,
                ]);

                if ($response->successful()) {
                    $leadData = $response->json();
                }
            }

            // Extract field data from payload or Meta API
            $fieldData = $leadData['field_data'] ?? [];
            $parsed = $this->parseMetaFieldData($fieldData);

            return Lead::create([
                'source' => $channel,
                'external_lead_id' => (string) $leadgenId,
                'full_name' => $parsed['full_name'] ?? 'Meta Lead ' . substr($leadgenId, -4),
                'email' => $parsed['email'] ?? "meta_{$leadgenId}@lead.local",
                'phone' => $parsed['phone'] ?? null,
                'company_name' => $parsed['company_name'] ?? null,
                'service_interest' => $parsed['service_interest'] ?? 'Social Lead Ad',
                'status' => 'new',
                'raw_payload' => $payload,
            ]);
        } catch (\Exception $e) {
            Log::error('Meta Lead Webhook Error: ' . $e->getMessage(), ['payload' => $payload]);
            return null;
        }
    }

    private function parseMetaFieldData(array $fieldData): array
    {
        $result = [];
        foreach ($fieldData as $field) {
            $name = strtolower($field['name'] ?? '');
            $val = $field['values'][0] ?? null;

            if (str_contains($name, 'full_name') || str_contains($name, 'name')) {
                $result['full_name'] = $val;
            } elseif (str_contains($name, 'email')) {
                $result['email'] = $val;
            } elseif (str_contains($name, 'phone')) {
                $result['phone'] = $val;
            } elseif (str_contains($name, 'company')) {
                $result['company_name'] = $val;
            }
        }
        return $result;
    }
}
