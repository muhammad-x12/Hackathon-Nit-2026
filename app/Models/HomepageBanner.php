<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Http\Resources\ProductResource;

class HomepageBanner extends Model
{
    protected $fillable = [
        'image_path',
        'title',
        'subtitle',
        'button_text',
        'button_link',
        'order',
        'is_active'
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return ProductResource::normalizeStoragePath($this->image_path);
    }
}
