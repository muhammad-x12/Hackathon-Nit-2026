<?php

namespace App\Http\Requests\School;

use Illuminate\Foundation\Http\FormRequest;

class SelectProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'school_margin' => 'required|numeric|min:0',
            'required_qty' => 'nullable|integer|min:1',
            'custom_logo' => 'nullable|image|max:2048', // 2MB Max
            'custom_logo_position' => 'nullable|array',
            'custom_text' => 'nullable|string|max:255',
            'custom_text_position' => 'nullable|array',
            'rendered_images' => 'nullable|array',
            'rendered_images.*' => 'image|max:5120',
        ];
    }
}
