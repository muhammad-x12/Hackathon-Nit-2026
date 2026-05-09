<?php

use App\Models\OrderItem;
use App\Models\Supplier;
use App\Models\ShippingProvider;
use App\Models\AuthorityShippingConfig;
use App\Http\Resources\OrderItemResource;
use Illuminate\Support\Facades\Request;

// 1. Ensure a provider exists
$provider = ShippingProvider::where('slug', 'shiprocket')->first();
if (!$provider) {
    echo "ERROR: Shiprocket provider not found. Please run: php artisan db:seed --class=ShippingProviderSeeder\n";
    exit(1);
}
echo "Found Provider: {$provider->name} ({$provider->slug})\n";

// 2. Find a supplier and an order item to test
$supplier = Supplier::first();
if (!$supplier) {
    echo "ERROR: No supplier found to test.\n";
    exit(1);
}
echo "Testing with Supplier: {$supplier->name}\n";

$item = OrderItem::whereHas('product', function ($q) use ($supplier) {
    $q->where('supplier_id', $supplier->id);
})->first();

if (!$item) {
    echo "WARNING: No OrderItems found for this supplier. Creating a dummy one for the check.\n";
    // For verification, just check the logic on a fresh instance if needed, 
    // but better to use real data. Let's see if there's any order item at all first.
    $item = OrderItem::first();
    if (!$item) {
        echo "ERROR: No order items found in database. Cannot fully verify.\n";
        exit(1);
    }
}

echo "Testing Order Item ID: {$item->id}\n";

// 3. Simulate Dispatch via SupplierController style update
$trackingId = 'SR123456789';
$item->update([
    'fulfillment_status' => 'dispatched',
    'tracking_number' => $trackingId,
    'courier_name' => 'Shiprocket Express',
    'shipping_provider_id' => $provider->id
]);

echo "Item Updated - Status: {$item->fulfillment_status}, Tracking: {$item->tracking_number}, Provider: {$item->shipping_provider_id}\n";

// 4. Verify Tracking URL Generation in Resource
$resource = new OrderItemResource($item);
$data = $resource->resolve();

echo "\n--- Resource Verification ---\n";
echo "Fulfillment Status: " . ($data['fulfillment_status'] ?? 'MISSING') . "\n";
echo "Tracking Number: " . ($data['tracking_number'] ?? 'MISSING') . "\n";
echo "Courier Name: " . ($data['courier_name'] ?? 'MISSING') . "\n";
echo "Generated Tracking URL: " . ($data['tracking_url'] ?? 'NOT GENERATED') . "\n";

if (isset($data['tracking_url']) && str_contains($data['tracking_url'], 'shiprocket.in/tracking/SR123456789')) {
    echo "\n✅ SUCCESS: Tracking URL matches the Shiprocket pattern!\n";
} else {
    echo "\n❌ FAILURE: Tracking URL does not match Shiprocket pattern.\n";
}
