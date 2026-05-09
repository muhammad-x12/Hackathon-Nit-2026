<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'admin_name' => 'required|string|max:255',
            'admin_email' => [
                'required',
                'email',
                Rule::unique('users', 'email'),
                Rule::unique('schools', 'email'),
            ],
            'password' => 'required|string|min:8|confirmed',
            'school_name' => 'required|string|max:255',
            'abbreviation' => 'nullable|string|max:50',
            'subdomain' => 'required|string|unique:schools,subdomain',
        ];
    }
}
