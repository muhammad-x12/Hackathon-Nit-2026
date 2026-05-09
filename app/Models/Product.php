<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'supplier_id',
        'category_id',
        'subcategory_id',
        'sku',
        'product_type',
        'name',
        'brand',
        'short_description',
        'description',
        'base_price',
        'bulk_pricing',
        'gst_percentage',
        'hsn_code',
        'size',
        'color',
        'variant_price_adjustments',
        'material',
        'gender',
        'class_mapping',
        'customization_flag',
        'customization_options',
        'logo_placement_image',
        'images',
        'color_images',
        'size_chart',
        'demo_image',
        'stock_quantity',
        'low_stock_threshold',
        'stock_type',
        'weight',
        'length',
        'width',
        'height',
        'dimensions',
        'dispatch_days',
        'delivery_type',
        'for_schools_only',
        'target_schools',
        'min_quantity',
        'school_min_qty',
        'max_quantity',
        'status',
        'meta_title',
        'meta_description',
        'meta_keywords'
    ];

    protected $casts = [
        'images' => 'array',
        'customization_flag' => 'boolean',
        'bulk_pricing' => 'array',
        'customization_options' => 'array',
        'target_schools' => 'array',
        'for_schools_only' => 'boolean',
        'variant_price_adjustments' => 'array',
        'color_images' => 'array',
    ];

    protected $appends = ['average_rating', 'review_count', 'pricing'];

    /**
     * Get dynamic pricing based on context (School or public)
     */
    public function getPricingAttribute()
    {
        $school = request()->get('school');
        $schoolProduct = null;

        if ($school) {
            $schoolProduct = $this->schoolProducts()->where('school_id', $school->id)->first();
        }

        $raw = request()->query('pincode')
            ?? request()->query('shipping_pincode')
            ?? request()->query('delivery_pincode');
        $pincode = null;
        if ($raw !== null && $raw !== '') {
            $digits = preg_replace('/\D/', '', (string) $raw);
            if (strlen($digits) === 6) {
                $pincode = $digits;
            }
        }

        return app(\App\Services\PricingService::class)->calculateParams($this, $schoolProduct, $pincode);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function getAverageRatingAttribute()
    {
        return round($this->reviews()->where('is_approved', true)->avg('rating') ?: 0, 1);
    }

    public function getReviewCountAttribute()
    {
        return $this->reviews()->where('is_approved', true)->count();
    }

    public function schoolProducts()
    {
        return $this->hasMany(SchoolProduct::class);
    }
}
