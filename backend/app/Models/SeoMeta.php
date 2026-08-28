<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoMeta extends Model
{
    use HasFactory;

    protected $table = 'seo_metas';

    protected $fillable = [
        'page_path',
        'page_name',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'canonical_url',
        'og_title',
        'og_description',
        'og_image_url',
        'robots_directive',
        'schema_type',
        'seo_score',
    ];

    protected $casts = [
        'seo_score' => 'integer',
    ];
}
