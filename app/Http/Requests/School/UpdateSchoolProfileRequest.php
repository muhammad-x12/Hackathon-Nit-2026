<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('school') && $this->user()->school_id;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'abbreviation' => 'sometimes|nullable|string|max:50',
            'theme_color' => 'nullable|string|max:7', // Hex code
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'school_banner' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'academic_year' => 'nullable|string|max:255',
            'announcements' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_info' => 'nullable|array',
        ];
    }
}
