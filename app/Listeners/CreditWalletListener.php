<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Services\WalletService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CreditWalletListener
{
    protected $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Handle the event.
     */
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;
        if ($order->payment_status === 'paid') {
            try {
                $this->walletService->creditWalletsFromOrder($order);
                Log::info("Wallet Crediting Successful via Listener", ['order_id' => $order->id]);
            } catch (\Exception $e) {
                Log::error("Wallet Crediting Failed via Listener", ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
