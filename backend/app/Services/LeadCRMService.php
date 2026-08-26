<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

class LeadCRMService
{
    /**
     * Store new lead inquiry from website or ad channels
     */
    public function createLead(array $data): Lead
    {
        return Lead::create([
            'source' => $data['source'] ?? 'website',
            'external_lead_id' => $data['external_lead_id'] ?? null,
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'service_interest' => $data['service_interest'] ?? null,
            'budget_range' => $data['budget_range'] ?? null,
            'status' => 'new',
            'notes' => $data['notes'] ?? null,
            'raw_payload' => $data['raw_payload'] ?? null,
        ]);
    }

    /**
     * Get paginated leads with filters
     */
    public function getLeads(array $filters = []): LengthAwarePaginator
    {
        $query = Lead::query();

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Update lead pipeline stage & notes
     */
    public function updateLeadStage(Lead $lead, string $status, ?string $notes = null, ?float $conversionValue = null): Lead
    {
        $updateData = ['status' => $status];

        if ($notes !== null) {
            $existingNotes = $lead->notes ? $lead->notes . "\n---\n" : '';
            $updateData['notes'] = $existingNotes . '[' . now()->toDateTimeString() . '] Status changed to ' . strtoupper($status) . ': ' . $notes;
        }

        if ($conversionValue !== null) {
            $updateData['conversion_value'] = $conversionValue;
        }

        $lead->update($updateData);
        return $lead;
    }

    /**
     * Calculate multi-channel conversion analytics breakdown
     */
    public function getChannelConversionMetrics(): array
    {
        $sources = ['website', 'instagram', 'facebook', 'google_ads', 'referral', 'direct'];
        $metrics = [];

        foreach ($sources as $source) {
            $total = Lead::where('source', $source)->count();
            $won = Lead::where('source', $source)->where('status', 'closed_won')->count();
            $revenue = Lead::where('source', $source)->where('status', 'closed_won')->sum('conversion_value');
            $rate = $total > 0 ? round(($won / $total) * 100, 1) : 0;

            $metrics[$source] = [
                'total_leads' => $total,
                'closed_won' => $won,
                'conversion_rate_percent' => $rate,
                'total_revenue' => (float) $revenue,
            ];
        }

        return $metrics;
    }
}
