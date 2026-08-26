<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectItem extends Model
{
    use HasFactory;

    protected $table = 'project_items';

    protected $fillable = [
        'slug',
        'title',
        'client',
        'industry',
        'summary',
        'metrics',
        'tech_stack',
        'image_url',
        'is_featured',
    ];

    protected $casts = [
        'metrics' => 'array',
        'tech_stack' => 'array',
        'is_featured' => 'boolean',
    ];
}
