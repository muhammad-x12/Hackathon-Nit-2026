<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Wallet;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Credit school and supplier wallets once an order is paid.
     */
    public function creditWalletsFromOrder(Order $order)
    {
        $order->loadMissing(['items.product.supplier', 'school']);

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                // 1. Credit School Margin to School Wallet
                $schoolMargin = (float) ($item->school_margin ?? 0);
                if ($order->school_id && $schoolMargin > 0) {
                    $school = $order->school;
                    if ($school) {
                        $wallet = Wallet::resolveFor($school);
                        $wallet->credit(
                            $schoolMargin * (int) $item->quantity,
                            "Commission from Order #{$order->id} - {$product->name}",
                            $order->id
                        );
                    }
                }

                // 2. Credit Base Price to Supplier Wallet
                if ($product->supplier_id) {
                    $supplier = $product->supplier;
                    if ($supplier) {
                        // base_price is stored on order_items at purchase time; fallback to current product base_price for old/partial rows.
                        $unitBase = $item->base_price !== null ? (float) $item->base_price : (float) ($product->base_price ?? 0);
                        $credit = $unitBase * (int) $item->quantity;
                        if ($credit <= 0) {
                            continue;
                        }
                        $wallet = Wallet::resolveFor($supplier);
                        $wallet->credit(
                            $credit,
                            "Sale payment from Order #{$order->id} - {$product->name}",
                            $order->id
                        );
                    }
                }
            }
        });
    }
}
