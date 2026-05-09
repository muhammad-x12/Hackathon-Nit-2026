<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email'),
                Rule::unique('suppliers', 'email'),
                Rule::unique('schools', 'email'),
            ],
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:customer,school,supplier',
            'school_name' => 'required_if:role,school,supplier|nullable|string|max:255',
            'abbreviation' => 'nullable|string|max:50',
            'subdomain' => 'required_if:role,school|nullable|string|max:255|unique:schools,subdomain',
            'school_id' => 'nullable|exists:schools,id',
        ];
    }
}
