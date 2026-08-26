<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'source',
        'external_lead_id',
        'full_name',
        'email',
        'phone',
        'company_name',
        'service_interest',
        'budget_range',
        'status',
        'conversion_value',
        'notes',
        'raw_payload',
    ];

    protected $casts = [
        'conversion_value' => 'decimal:2',
        'raw_payload' => 'array',
    ];

    public function scopeFilterBySource($query, $source)
    {
        if ($source) {
            return $query->where('source', $source);
        }
        return $query;
    }

    public function scopeFilterByStatus($query, $status)
    {
        if ($status) {
            return $query->where('status', $status);
        }
        return $query;
    }
}
