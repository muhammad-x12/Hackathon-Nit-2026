<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:categories,id',
            'supplier_id' => $this->user()->hasRole('super_admin') ? 'required|exists:suppliers,id' : 'nullable|exists:suppliers,id',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'product_type' => 'nullable|string|in:wholesale,school_store,both',
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'short_description' => 'nullable|string|max:1000',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'bulk_pricing' => 'nullable|string', // JSON string from frontend
            'hsn_code' => 'nullable|string|max:50',
            'size' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:255',
            'variant_price_adjustments' => 'nullable|string', // JSON object from frontend
            'material' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:50',
            'class_mapping' => 'nullable|string|max:255',
            'customization_flag' => 'nullable|boolean',
            'customization_options' => 'nullable|string', // JSON array from frontend
            'logo_placement_image' => 'nullable|image|max:10240',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
            'color_images' => 'nullable|array',
            'color_images.*' => 'array',
            'color_images.*.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
            'size_chart' => 'nullable|image|max:10240',
            'demo_image' => 'nullable|image|max:10240',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'stock_type' => 'nullable|string|in:ready,made_to_order',
            'weight' => 'nullable|numeric|min:0',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string|max:100',
            'dispatch_days' => 'nullable|integer|min:0',
            'delivery_type' => 'nullable|string|in:direct,bulk',
            'for_schools_only' => 'nullable|boolean',
            'target_schools' => 'nullable|string', // JSON array from frontend
            'min_quantity' => 'nullable|integer|min:1',
            'school_min_qty' => 'nullable|integer|min:1',
            'max_quantity' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:draft,active,hidden',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|string',
        ];
    }
}
