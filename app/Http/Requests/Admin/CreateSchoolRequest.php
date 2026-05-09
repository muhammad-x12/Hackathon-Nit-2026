<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'abbreviation' => 'nullable|string|max:50',
            'email' => 'required|email|unique:schools,email|unique:users,email',
            'password' => 'required|string|min:8',
            'subdomain' => 'required|string|unique:schools,subdomain',
            'commission_percentage' => 'required|numeric|min:0|max:100',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'school_banner' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'theme_color' => 'nullable|string|max:7',
            'academic_year' => 'nullable|string|max:255',
            'announcements' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_info' => 'nullable|string',
        ];
    }
}
