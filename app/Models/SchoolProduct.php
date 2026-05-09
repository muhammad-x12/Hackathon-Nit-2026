<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolProduct extends Model
{
    protected $fillable = [
        'school_id',
        'product_id',
        'school_margin',
        'is_active',
        'required_qty',
        'custom_logo_path',
        'custom_logo_position',
        'custom_text',
        'custom_text_position',
        'rendered_images'
    ];

    protected $casts = [
        'custom_logo_position' => 'array',
        'custom_text_position' => 'array',
        'rendered_images' => 'array',
        'is_active' => 'boolean'
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
