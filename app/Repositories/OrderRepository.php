<?php

namespace App\Repositories;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderRepository
{
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'order_number' => 'ORD-' . strtoupper(uniqid()),
                'school_id' => $data['school_id'],
                'customer_id' => $data['customer_id'],
                'shipping_address' => $data['shipping_address'],
                'total_amount' => $data['total_amount'],
                'discount_amount' => $data['discount_amount'] ?? 0.00,
                'referral_code_used' => $data['referral_code_used'] ?? null,
                'payment_status' => 'pending',
                'order_status' => 'pending',
                'delivery_status' => 'pending',
            ]);

            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'final_price' => $item['final_price'],
                    'base_price' => $item['base_price'] ?? null,
                    'platform_charge' => $item['platform_charge'] ?? null,
                    'school_margin' => $item['school_margin'] ?? null,
                    'gst_amount' => $item['gst_amount'] ?? null,
                    'delivery_charge' => $item['delivery_charge'] ?? null,
                    'customization_data' => $item['customization_data'] ?? null,
                ]);
            }

            return $order;
        });
    }

    public function getOrdersBySchool($schoolId)
    {
        return Order::where('school_id', $schoolId)->with('items.product')->paginate(15);
    }

    public function getOrdersByCustomer($customerId)
    {
        return Order::where('customer_id', $customerId)->with('items.product')->paginate(15);
    }
}
