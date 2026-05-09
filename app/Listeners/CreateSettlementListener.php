<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Models\Settlement;
use Illuminate\Support\Facades\Log;

class CreateSettlementListener
{
    /**
     * Create a new listener instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;

        // Ensure items are loaded
        $order->load('items');

        // Calculate total school commission for this order
        // school_margin is per unit
        $totalCommission = $order->items->sum(function ($item) {
            return ($item->school_margin ?? 0) * $item->quantity;
        });

        if ($totalCommission > 0) {
            Settlement::create([
                'school_id' => $order->school_id,
                'order_id' => $order->id,
                'commission_amount' => $totalCommission,
                'status' => 'pending',
            ]);

            Log::info("Pending settlement created for Order #{$order->id}, Amount: {$totalCommission}");
        } else {
            Log::warning("Order #{$order->id} placed but total commission is 0. No settlement created.");
        }
    }
}
