<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotifySupplierJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function handle(): void
    {
        // Fetch suppliers linked to this order
        $suppliers = [];

        foreach ($this->order->items as $item) {
            $supplier = $item->product->supplier;
            if ($supplier) {
                $suppliers[$supplier->id] = $supplier;
            }
        }

        foreach ($suppliers as $supplier) {
            // Send Notification (Email / Webhook)
            Log::info("Notifying Supplier {$supplier->name} (ID: {$supplier->id}) regarding Order #{$this->order->order_number}: Please prepare items for dispatch.");

            // In a real app:
            // Mail::to($supplier->contact_info)->send(new SupplierOrderNotification($this->order));
        }

        // Also update supplier_status to 'pending' if not already set (default is pending)
    }
}
