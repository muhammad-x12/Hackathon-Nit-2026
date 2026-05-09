<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Jobs\NotifySupplierJob;

class NotifySupplierListener
{
    public function handle(OrderPlaced $event): void
    {
        // 1. Identify suppliers involved in order (via items -> product -> supplier)
        // 2. Dispatch job for each/all.
        // Or cleaner: Dispatch Job which handles the complex logic.

        NotifySupplierJob::dispatch($event->order);
    }
}
