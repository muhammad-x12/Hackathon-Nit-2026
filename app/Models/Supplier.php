<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = ['name', 'email', 'password', 'contact_info', 'status', 'priority', 'shiprocket_pickup_nickname', 'shiprocket_pickup_snapshot'];

    protected $hidden = ['password'];

    protected $casts = [
        'contact_info' => 'array',
        'shiprocket_pickup_snapshot' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function shippingConfigs()
    {
        return $this->morphMany(AuthorityShippingConfig::class, 'owner');
    }

    public function wallet()
    {
        return $this->morphOne(Wallet::class, 'owner');
    }

    public function getBalanceAttribute()
    {
        return $this->wallet->balance ?? 0;
    }
}
