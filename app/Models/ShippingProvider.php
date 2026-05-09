<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingProvider extends Model
{
    protected $fillable = ['name', 'slug', 'config_keys', 'is_active'];

    protected $casts = [
        'config_keys' => 'array',
        'is_active' => 'boolean',
    ];
}
