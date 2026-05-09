<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'final_price',
        'base_price',
        'platform_charge',
        'school_margin',
        'gst_amount',
        'delivery_charge',
        'customization_data',
        'fulfillment_status',
        'tracking_number',
        'courier_name',
        'shipping_provider_id',
        'shiprocket_shipment_id',
        'shiprocket_order_id',
    ];

    protected $casts = [
        'customization_data' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function provider()
    {
        return $this->belongsTo(ShippingProvider::class, 'shipping_provider_id');
    }

    public function scopeSupplier($query, $supplierId)
    {
        return $query->whereHas('product', function ($q) use ($supplierId) {
            $q->where('supplier_id', $supplierId);
        });
    }
}
