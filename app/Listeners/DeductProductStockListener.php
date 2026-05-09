<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeductProductStockListener
{
    /**
     * Handle the event.
     */
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;
        $order->load('items');

        Log::info("Deducting stock for Order #{$order->id}");

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if ($product) {
                    $product->decrement('stock_quantity', $item->quantity);
                    Log::info("Product {$product->id} stock decremented by {$item->quantity}");
                }
            }
        });
    }
}
