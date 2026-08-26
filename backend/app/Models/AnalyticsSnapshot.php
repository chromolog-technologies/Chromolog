<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsSnapshot extends Model
{
    use HasFactory;

    protected $table = 'analytics_snapshots';

    protected $fillable = [
        'snapshot_date',
        'active_users',
        'sessions',
        'search_impressions',
        'search_clicks',
        'avg_ctr',
        'top_keywords',
        'traffic_sources',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'top_keywords' => 'array',
        'traffic_sources' => 'array',
        'avg_ctr' => 'float',
    ];
}
