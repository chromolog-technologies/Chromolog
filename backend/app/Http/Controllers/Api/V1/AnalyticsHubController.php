<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Lead;
use App\Services\GoogleAnalyticsService;
use App\Services\LeadCRMService;
use App\Services\SearchConsoleService;
use Illuminate\Http\JsonResponse;

class AnalyticsHubController extends BaseApiController
{
    public function __construct(
        protected LeadCRMService $leadCRMService,
        protected GoogleAnalyticsService $gaService,
        protected SearchConsoleService $searchConsoleService
    ) {}

    public function overview(): JsonResponse
    {
        $channelConversions = $this->leadCRMService->getChannelConversionMetrics();
        $gaMetrics = $this->gaService->getAnalyticsSummary();
        $searchConsoleMetrics = $this->searchConsoleService->getSearchConsoleMetrics();

        $totalLeads = Lead::count();
        $newLeadsCount = Lead::where('status', 'new')->count();
        $wonLeadsCount = Lead::where('status', 'closed_won')->count();
        $totalRevenue = (float) Lead::where('status', 'closed_won')->sum('conversion_value');
        $overallConversionRate = $totalLeads > 0 ? round(($wonLeadsCount / $totalLeads) * 100, 1) : 0;

        return $this->success([
            'kpis' => [
                'total_leads' => $totalLeads,
                'new_leads' => $newLeadsCount,
                'won_deals' => $wonLeadsCount,
                'total_revenue' => $totalRevenue,
                'conversion_rate_percent' => $overallConversionRate,
            ],
            'channel_conversions' => $channelConversions,
            'google_analytics' => $gaMetrics,
            'search_console' => $searchConsoleMetrics,
        ], 'Unified analytics & CRM metrics overview');
    }
}
