<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Normalize an image/file path stored in the DB.
     * Handles: full absolute URLs (old data), relative paths with 'storage/' prefix, and plain relative paths.
     * Always returns a full URL using the current APP_URL.
     */
    public static function normalizeStoragePath(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        // Strip any hardcoded domain prefix (e.g. http://127.0.0.1:8000/storage/...)
        if (str_starts_with($path, 'http')) {
            $parsed = parse_url($path, PHP_URL_PATH);
            $path = $parsed ? ltrim($parsed, '/') : $path;
        }

        $path = ltrim($path, '/');

        // Remove 'storage/' prefix so we have the pure relative path
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return url('storage/' . $path);
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'images' => (function () {
                $imgs = $this->images;
                if (is_string($imgs)) {
                    $decoded = json_decode($imgs, true);
                    $imgs = is_array($decoded) ? $decoded : (empty($imgs) ? [] : [$imgs]);
                }
                if (!is_array($imgs))
                    $imgs = $imgs ? [$imgs] : [];

                return collect($imgs)->map(function ($path) {
                    return self::normalizeStoragePath($path);
                })->filter()->values()->all();
            })(),
            'pricing' => $this->pricing ?? null,
            // Customer-side behavior:
            // - Without pincode: `final_price` is base-only (no shipping)
            // - With pincode: `payable_price` is base + Shiprocket-minimum shipping quote
            'price' => (function () {
                if (!is_array($this->pricing ?? null)) {
                    return null;
                }
                if (isset($this->pricing['payable_price']) && $this->pricing['shipping_total_for_line'] !== null) {
                    return $this->pricing['payable_price'];
                }
                return $this->pricing['final_price'] ?? null;
            })(),
            'customizable' => $this->customization_flag,
            'category' => $this->whenLoaded('category', function () {
                return $this->category;
            }),
            'subcategory' => $this->whenLoaded('subcategory', function () {
                return $this->subcategory;
            }),
            'supplier' => $this->whenLoaded('supplier', function () use ($request) {
                $isSuperAdmin = $request->user() && $request->user()->hasRole('super_admin');
                return [
                    'id' => $this->supplier->id,
                    'name' => $this->supplier->name,
                    'contact_info' => $isSuperAdmin ? $this->supplier->contact_info : null,
                    'status' => $this->supplier->status,
                ];
            }),
            'category_id' => $this->category_id,
            'subcategory_id' => $this->subcategory_id,
            'supplier_id' => $this->supplier_id,
            'sku' => $this->sku,
            'brand' => $this->brand,
            'short_description' => $this->short_description,
            'product_type' => $this->product_type,
            'base_price' => $this->base_price,
            'min_quantity' => $this->min_quantity,
            'max_quantity' => $this->max_quantity,
            'bulk_pricing' => $this->bulk_pricing,
            'gst_percentage' => $this->gst_percentage,
            'hsn_code' => $this->hsn_code,
            'size' => $this->size,
            'color' => $this->color,
            'color_images' => (function () {
                $colorImgs = $this->color_images;
                if (is_string($colorImgs)) {
                    $colorImgs = json_decode($colorImgs, true);
                }
                if (!is_array($colorImgs)) return [];

                $result = [];
                foreach ($colorImgs as $color => $paths) {
                    if (is_array($paths)) {
                        $result[$color] = collect($paths)->map(function ($path) {
                            return self::normalizeStoragePath($path);
                        })->filter()->values()->all();
                    }
                }
                return $result;
            })(),
            'variant_price_adjustments' => $this->variant_price_adjustments,
            'gender' => $this->gender,
            'class_mapping' => $this->class_mapping,
            'customization_flag' => (bool) $this->customization_flag,
            'customization_options' => $this->customization_options,
            'stock_quantity' => $this->stock_quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'stock_type' => $this->stock_type,
            'weight' => $this->weight,
            'length' => $this->length,
            'width' => $this->width,
            'height' => $this->height,
            'dispatch_days' => $this->dispatch_days,
            'logo_placement_image' => self::normalizeStoragePath($this->logo_placement_image),
            'size_chart' => self::normalizeStoragePath($this->size_chart),
            'demo_image' => self::normalizeStoragePath($this->demo_image),
            'for_schools_only' => (bool) $this->for_schools_only,
            'target_schools' => $this->target_schools,
            'school_min_qty' => $this->school_min_qty,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'status' => $this->status,
            'average_rating' => (float) $this->average_rating,
            'review_count' => (int) $this->review_count,
            'reviews' => $this->whenLoaded('reviews', function () {
                return $this->reviews->where('is_approved', true)->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'user_name' => $r->guest_name ?: ($r->user->name ?? 'Anonymous'),
                        'rating' => $r->rating,
                        'comment' => $r->comment,
                        'is_featured' => (bool) $r->is_featured,
                        'created_at' => $r->created_at->diffForHumans(),
                    ];
                });
            }),
            'school_customization' => $this->school_customization ?? null,
            'school_products' => $this->whenLoaded('schoolProducts', function () {
                return $this->schoolProducts->map(function ($sp) {
                    return [
                        'id' => $sp->id,
                        'school_id' => $sp->school_id,
                        'school_margin' => $sp->school_margin ?? 0,
                        'selling_price' => $sp->selling_price ?? null,
                        'is_active' => $sp->is_active ?? true,
                        'required_qty' => $sp->required_qty,
                        'rendered_images' => collect($sp->rendered_images ?: [])->map(fn($p) => self::normalizeStoragePath($p))->all(),
                    ];
                });
            }),
        ];
    }
}
