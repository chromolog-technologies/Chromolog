<?php

namespace App\Services;

use App\Models\SeoMeta;

class SeoManagementService
{
    /**
     * Get all SEO page configurations with health scores
     */
    public function getAllPageSeo(): array
    {
        $records = SeoMeta::latest()->get();

        if ($records->isEmpty()) {
            return $this->getDefaultSeoPages();
        }

        return $records->toArray();
    }

    /**
     * Store or update page SEO metadata and calculate SEO health score
     */
    public function savePageSeo(array $data): SeoMeta
    {
        $score = $this->calculateSeoScore($data);
        $data['seo_score'] = $score;

        return SeoMeta::updateOrCreate(
            ['page_path' => $data['page_path']],
            $data
        );
    }

    /**
     * Calculate automated SEO Health Score (0-100)
     */
    public function calculateSeoScore(array $data): int
    {
        $score = 0;

        // Title length check (ideal 40 - 65 chars)
        $titleLen = strlen($data['meta_title'] ?? '');
        if ($titleLen >= 30 && $titleLen <= 65) {
            $score += 25;
        } elseif ($titleLen > 0) {
            $score += 15;
        }

        // Description length check (ideal 120 - 160 chars)
        $descLen = strlen($data['meta_description'] ?? '');
        if ($descLen >= 110 && $descLen <= 165) {
            $score += 25;
        } elseif ($descLen > 0) {
            $score += 15;
        }

        // Keywords configured
        if (!empty($data['meta_keywords'])) {
            $score += 15;
        }

        // Canonical URL configured
        if (!empty($data['canonical_url'])) {
            $score += 15;
        }

        // OpenGraph Banner configured
        if (!empty($data['og_image_url'])) {
            $score += 10;
        }

        // Robots directive set to index, follow
        if (($data['robots_directive'] ?? 'index, follow') === 'index, follow') {
            $score += 10;
        }

        return min($score, 100);
    }

    /**
     * Fallback initial SEO configuration pages
     */
    public function getDefaultSeoPages(): array
    {
        return [
            [
                'id' => 1,
                'page_path' => '/',
                'page_name' => 'Home Page',
                'meta_title' => 'Custom Software & Digital Systems | Chromolog Technologies',
                'meta_description' => 'Chromolog Technologies builds custom software, web applications, CRM, ERP & HRMS systems to automate processes and scale growing businesses.',
                'meta_keywords' => 'custom software development Kerala, web application development Kerala, website development company Kerala, custom CRM ERP Kerala',
                'canonical_url' => 'https://chromologtechnologies.com/',
                'og_title' => 'Custom Software & Digital Systems | Chromolog',
                'og_description' => 'Build high-performance web applications, custom CRM & ERP systems.',
                'og_image_url' => 'https://chromologtechnologies.com/images/chromologtechnologies.webp',
                'robots_directive' => 'index, follow',
                'schema_type' => 'Organization',
                'seo_score' => 98,
            ],
            [
                'id' => 2,
                'page_path' => '/services',
                'page_name' => 'Services Catalog',
                'meta_title' => 'Digital Systems & Engineering Services | Chromolog',
                'meta_description' => 'Explore custom software development, web applications, custom CRM, ERP platforms, HRMS payroll & business process automation services.',
                'meta_keywords' => 'custom software services, web app development, custom CRM systems, ERP development company',
                'canonical_url' => 'https://chromologtechnologies.com/services',
                'og_title' => 'Engineering Services | Chromolog Technologies',
                'og_description' => 'Tailored software solutions engineered for enterprise scale.',
                'og_image_url' => 'https://chromologtechnologies.com/images/chromologtechnologies.webp',
                'robots_directive' => 'index, follow',
                'schema_type' => 'Service',
                'seo_score' => 94,
            ],
            [
                'id' => 3,
                'page_path' => '/case-studies',
                'page_name' => 'Case Studies & Proof',
                'meta_title' => 'Client Success Case Studies | Chromolog Technologies',
                'meta_description' => 'Discover how Chromolog built custom EMR healthcare portals, retail ERPs, and campus automation systems with proven ROI metrics.',
                'meta_keywords' => 'software case studies, custom ERP proof, EMR portal case study, HRMS implementation proof',
                'canonical_url' => 'https://chromologtechnologies.com/case-studies',
                'og_title' => 'Software Case Studies | Chromolog Technologies',
                'og_description' => 'Real-world digital systems engineered with verified ROI results.',
                'og_image_url' => 'https://chromologtechnologies.com/images/chromologtechnologies.webp',
                'robots_directive' => 'index, follow',
                'schema_type' => 'CreativeWork',
                'seo_score' => 96,
            ],
            [
                'id' => 4,
                'page_path' => '/free-consultation',
                'page_name' => 'Free Technology Consultation',
                'meta_title' => 'Free Custom Software Strategy Session | Chromolog',
                'meta_description' => 'Book a free technical consultation with senior engineers to blueprint your custom software, CRM, or digital system architecture.',
                'meta_keywords' => 'free software consultation, custom CRM roadmap session, web development audit',
                'canonical_url' => 'https://chromologtechnologies.com/free-consultation',
                'og_title' => 'Free Technology Consultation | Chromolog',
                'og_description' => 'Discuss your software requirements with senior system architects.',
                'og_image_url' => 'https://chromologtechnologies.com/images/chromologtechnologies.webp',
                'robots_directive' => 'index, follow',
                'schema_type' => 'ContactPage',
                'seo_score' => 92,
            ],
        ];
    }
}
