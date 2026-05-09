<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuthorityShippingConfig extends Model
{
    protected $fillable = ['owner_id', 'owner_type', 'shipping_provider_id', 'credentials', 'is_enabled'];

    protected $casts = [
        'credentials' => 'array',
        'is_enabled' => 'boolean',
    ];

    public function owner()
    {
        return $this->morphTo();
    }

    public function provider()
    {
        return $this->belongsTo(ShippingProvider::class, 'shipping_provider_id');
    }
}
