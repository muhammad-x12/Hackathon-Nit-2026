<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:suppliers,email|unique:users,email',
            'password' => 'required|string|min:8',
            'contact_info' => 'nullable|string',
            'priority' => 'nullable|integer|min:0',
            'shiprocket_pickup_nickname' => 'nullable|string|max:255',
        ];
    }
}
