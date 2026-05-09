<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Http\Resources\ProductResource;

class School extends Model
{
    protected $fillable = [
        'name',
        'abbreviation',
        'email',
        'password',
        'subdomain',
        'logo',
        'theme_color',
        'status',
        'commission_percentage',
        'school_banner',
        'academic_year',
        'announcements',
        'address',
        'contact_info'
    ];

    protected $casts = [
        'contact_info' => 'array',
    ];

    protected $hidden = ['password'];

    protected $appends = ['logo_url', 'school_banner_url'];

    public function getLogoUrlAttribute(): ?string
    {
        return ProductResource::normalizeStoragePath($this->logo);
    }

    public function getSchoolBannerUrlAttribute(): ?string
    {
        return ProductResource::normalizeStoragePath($this->school_banner);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function schoolProducts()
    {
        return $this->hasMany(SchoolProduct::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function settlements()
    {
        return $this->hasMany(Settlement::class);
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
