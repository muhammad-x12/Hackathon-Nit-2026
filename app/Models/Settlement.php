<?php

namespace App\Models;

use App\Models\Order;
use App\Models\School;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Model;

class Settlement extends Model
{
    protected $fillable = [
        'school_id',
        'supplier_id',
        'order_id',
        'commission_amount',
        'status',
        'settled_date',
        'payment_mode',
        'reference_id',
        'payment_notes',
    ];

    protected $casts = [
        'settled_date' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
