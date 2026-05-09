<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.weight' => 'nullable|numeric|min:0.01',
            'items.*.length' => 'nullable|numeric|min:1',
            'items.*.width' => 'nullable|numeric|min:1',
            'items.*.height' => 'nullable|numeric|min:1',
            'items.*.customization' => 'nullable|array',
            'shipping_address' => 'required|array',
            'shipping_address.name' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.address' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.pincode' => 'required|string',
        ];
    }
}
