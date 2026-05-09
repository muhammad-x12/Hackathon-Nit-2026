<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'school_id',
        'customer_id',
        'total_amount',
        'discount_amount',
        'referral_code_used',
        'payment_status',
        'order_status',
        'supplier_status',
        'delivery_status',
        'transaction_id',
        'payment_provider',
        'payment_method',
        'shipping_address'
    ];

    protected $casts = [
        'shipping_address' => 'array',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function settlement()
    {
        return $this->hasOne(Settlement::class);
    }
}
