<?php

use App\Models\OrderItem;
use App\Models\Supplier;
use App\Models\ShippingProvider;
use App\Models\AuthorityShippingConfig;
use App\Http\Resources\OrderItemResource;
use Illuminate\Support\Facades\Request;

// 1. Verify Providers
$shiprocket = ShippingProvider::where('slug', 'shiprocket')->first();
$delhivery = ShippingProvider::where('slug', 'delhivery')->first();

if (!$shiprocket) {
    echo "ERROR: Shiprocket provider missing.\n";
    exit(1);
}
echo "✓ Providers registered.\n";

// 2. Verify Config Storage for Supplier
$supplier = Supplier::first();
if (!$supplier) {
    echo "ERROR: No supplier found.\n";
    exit(1);
}

$config = AuthorityShippingConfig::updateOrCreate(
    [
        'owner_id' => $supplier->id,
        'owner_type' => get_class($supplier),
        'shipping_provider_id' => $shiprocket->id,
    ],
    [
        'credentials' => ['email' => 'test@shiprocket.com', 'password' => 'secret'],
        'is_enabled' => true,
    ]
);

if ($config && $config->owner_id == $supplier->id) {
    echo "✅ SUCCESS: Authority shipping config saved for supplier.\n";
} else {
    echo "❌ FAILURE: Authority shipping config could not be saved.\n";
}

// 3. Verify Tracking URL Generation via Relationship
$item = OrderItem::first();
if ($item) {
    // Test Relationship 
    $item->shipping_provider_id = $shiprocket->id;
    $item->tracking_number = 'SR999';
    $item->save();

    // Refresh to check relationship
    $item->load('provider');
    echo "Item linked to provider: " . ($item->provider->name ?? 'NONE') . "\n";

    $resource = new OrderItemResource($item);
    $data = $resource->resolve();
    echo "Generated URL: " . $data['tracking_url'] . "\n";

    if (str_contains($data['tracking_url'], 'shiprocket.in/shipment-tracking/SR999')) {
        echo "✅ SUCCESS: Tracking URL correctly generated via provider relationship.\n";
    }
} else {
    echo "⚠ SKIP: No OrderItem found to test relationship.\n";
}

// 4. Verify Delhivery Logic
if ($delhivery && $item) {
    $item->shipping_provider_id = $delhivery->id;
    $item->tracking_number = 'DEL123';
    $item->save();
    $item->load('provider');
    $resource = (new OrderItemResource($item))->resolve();
    echo "Delhivery URL: " . $resource['tracking_url'] . "\n";
    if (str_contains($resource['tracking_url'], 'delhivery.com/track/package/DEL123')) {
        echo "✅ SUCCESS: Delhivery Tracking URL verified.\n";
    }
}
