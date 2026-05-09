<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'parent_id', 'sort_order', 'image', 'icon_svg', 'platform_charge', 'gst_percentage'];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (!$this->image)
            return null;
        if (filter_var($this->image, FILTER_VALIDATE_URL))
            return $this->image;
        return asset('storage/' . $this->image);
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Check if this is a top-level (parent) category
     */
    public function isParent(): bool
    {
        return is_null($this->parent_id);
    }
}
