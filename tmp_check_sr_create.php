<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$item = App\Models\OrderItem::find(26);
if (!$item) die("No item 26\n");

$order = $item->order;
$address = $order->shipping_address;
$supplier = $item->product->supplier;
$pickup = $supplier->shiprocket_pickup_nickname ?: 'Primary';

// Get token
$logistics = app(\App\Services\LogisticsService::class);
$reflection = new ReflectionClass(get_class($logistics));
$method = $reflection->getMethod('getShiprocketToken');
$method->setAccessible(true);
$token = $method->invokeArgs($logistics, [null, null]);
echo "Token: " . ($token ? "YES" : "NO") . "\n";

// Sanitize pincode like the fixed code does
$pincode = preg_replace('/\D/', '', $address['pincode'] ?? '');
if (strlen($pincode) !== 6) {
    $pincode = '110001';
    echo "WARNING: Invalid pincode '{$address['pincode']}', using fallback 110001\n";
}

$payload = [
    'order_id' => $order->id . '-' . $item->id . '-' . time(),
    'order_date' => $order->created_at->format('Y-m-d H:i'),
    'pickup_location' => $pickup,
    'billing_customer_name' => $address['name'] ?? 'Customer',
    'billing_last_name' => '',
    'billing_address' => $address['address'] ?? 'Address not provided',
    'billing_city' => $address['city'] ?? 'Delhi',
    'billing_pincode' => $pincode,
    'billing_state' => $address['state'] ?? 'Delhi',
    'billing_country' => 'India',
    'billing_email' => $order->customer->email ?? 'guest@example.com',
    'billing_phone' => preg_replace('/\D/', '', $address['phone'] ?? '0000000000'),
    'shipping_is_billing' => true,
    'order_items' => [[
        'name' => $item->product->name,
        'sku' => $item->product->sku ?: 'SKU-' . $item->product_id,
        'units' => $item->quantity,
        'selling_price' => $item->final_price,
    ]],
    'payment_method' => ($order->payment_method === 'cod') ? 'COD' : 'Prepaid',
    'sub_total' => $item->final_price * $item->quantity,
    'length' => $item->product->length ?: 10,
    'breadth' => $item->product->width ?: 10, // FIXED: was 'width'
    'height' => $item->product->height ?: 10,
    'weight' => $item->product->weight ?: 0.5,
];

echo "Pincode used: $pincode\nPickup: $pickup\n";

try {
    $response = \Illuminate\Support\Facades\Http::withToken($token)
        ->post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', $payload);
    echo "Status: " . $response->status() . "\n";
    print_r($response->json());
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
