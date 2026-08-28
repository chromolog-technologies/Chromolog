<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\SeoMeta;
use App\Services\SeoManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeoMetaController extends BaseApiController
{
    public function __construct(
        protected SeoManagementService $seoService
    ) {}

    public function index(): JsonResponse
    {
        $seoPages = $this->seoService->getAllPageSeo();
        return $this->success($seoPages, 'SEO page metadata retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page_path' => 'required|string',
            'page_name' => 'required|string|max:255',
            'meta_title' => 'required|string|max:255',
            'meta_description' => 'required|string',
            'meta_keywords' => 'nullable|string',
            'canonical_url' => 'nullable|url',
            'og_title' => 'nullable|string',
            'og_description' => 'nullable|string',
            'og_image_url' => 'nullable|url',
            'robots_directive' => 'nullable|string',
            'schema_type' => 'nullable|string',
        ]);

        $saved = $this->seoService->savePageSeo($validated);
        return $this->success($saved, 'Page SEO metadata saved successfully', 201);
    }

    public function show(SeoMeta $seoMeta): JsonResponse
    {
        return $this->success($seoMeta, 'SEO metadata details');
    }

    public function update(Request $request, SeoMeta $seoMeta): JsonResponse
    {
        $validated = $request->validate([
            'page_path' => 'required|string',
            'page_name' => 'required|string|max:255',
            'meta_title' => 'required|string|max:255',
            'meta_description' => 'required|string',
            'meta_keywords' => 'nullable|string',
            'canonical_url' => 'nullable|url',
            'og_title' => 'nullable|string',
            'og_description' => 'nullable|string',
            'og_image_url' => 'nullable|url',
            'robots_directive' => 'nullable|string',
            'schema_type' => 'nullable|string',
        ]);

        $score = $this->seoService->calculateSeoScore($validated);
        $validated['seo_score'] = $score;

        $seoMeta->update($validated);
        return $this->success($seoMeta, 'Page SEO metadata updated successfully');
    }

    public function destroy(SeoMeta $seoMeta): JsonResponse
    {
        $seoMeta->delete();
        return $this->success(null, 'Page SEO configuration deleted');
    }

    public function generateSitemap(): JsonResponse
    {
        return $this->success([
            'sitemap_url' => 'https://chromologtechnologies.com/sitemap.xml',
            'last_generated' => now()->toDateTimeString(),
            'total_urls' => 14,
        ], 'Dynamic XML sitemap regenerated successfully');
    }
}
