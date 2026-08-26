<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadStatusRequest;
use App\Models\Lead;
use App\Services\LeadCRMService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadController extends BaseApiController
{
    public function __construct(
        protected LeadCRMService $leadCRMService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['source', 'status', 'search', 'per_page']);
        $leads = $this->leadCRMService->getLeads($filters);
        return $this->success($leads, 'Leads retrieved successfully');
    }

    public function store(StoreLeadRequest $request): JsonResponse
    {
        $lead = $this->leadCRMService->createLead($request->validated());
        return $this->success($lead, 'Lead created successfully', 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return $this->success($lead, 'Lead details retrieved');
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $lead->update($request->only([
            'full_name', 'email', 'phone', 'company_name',
            'service_interest', 'budget_range', 'notes', 'conversion_value'
        ]));

        return $this->success($lead, 'Lead updated successfully');
    }

    public function updateStatus(UpdateLeadStatusRequest $request, Lead $lead): JsonResponse
    {
        $updated = $this->leadCRMService->updateLeadStage(
            $lead,
            $request->validated('status'),
            $request->validated('notes'),
            $request->validated('conversion_value')
        );

        return $this->success($updated, 'Lead status updated successfully');
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();
        return $this->success(null, 'Lead deleted successfully');
    }

    public function exportCsv(): StreamedResponse
    {
        $leads = Lead::latest()->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="chromolog_crm_leads_' . date('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($leads) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Source', 'Full Name', 'Email', 'Phone', 'Company', 'Service Interest', 'Status', 'Conversion Value', 'Created At']);

            foreach ($leads as $lead) {
                fputcsv($handle, [
                    $lead->id,
                    strtoupper($lead->source),
                    $lead->full_name,
                    $lead->email,
                    $lead->phone ?? 'N/A',
                    $lead->company_name ?? 'N/A',
                    $lead->service_interest ?? 'N/A',
                    strtoupper($lead->status),
                    $lead->conversion_value ?? '0.00',
                    $lead->created_at->toDateTimeString(),
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }
}
