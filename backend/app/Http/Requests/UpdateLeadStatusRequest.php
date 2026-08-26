<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeadStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:new,contacted,in_discussion,proposal_sent,closed_won,closed_lost'],
            'notes' => ['nullable', 'string'],
            'conversion_value' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
