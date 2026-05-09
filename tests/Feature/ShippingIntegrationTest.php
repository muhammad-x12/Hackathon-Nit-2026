<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\School;
use App\Models\Supplier;
use App\Models\User;
use App\Models\ShippingProvider;
use App\Models\AuthorityShippingConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ShippingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\ShippingProviderSeeder::class);
    }

    public function test_super_admin_can_get_providers()
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@test.com', 'password' => 'pwd']);
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)->getJson('/api/shipping/providers');

        $response->assertStatus(200);
        $response->assertJsonFragment(['slug' => 'shiprocket']);
        $response->assertJsonFragment(['slug' => 'delhivery']);
    }

    public function test_supplier_can_save_shipping_config()
    {
        $supplier = Supplier::create([
            'name' => 'Supplier X',
            'email' => 'supplier-x-config@example.com',
            'password' => Hash::make('password'),
        ]);
        $user = User::create(['name' => 'S1', 'email' => 's1@s.com', 'password' => 'pwd', 'supplier_id' => $supplier->id]);
        $user->assignRole('supplier');

        $provider = ShippingProvider::where('slug', 'shiprocket')->first();

        $response = $this->actingAs($user)->postJson('/api/shipping/my-configs', [
            'shipping_provider_id' => $provider->id,
            'credentials' => ['email' => 'test@shiprocket.com', 'password' => 'secret'],
            'is_enabled' => true
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('authority_shipping_configs', [
            'owner_id' => $supplier->id,
            'owner_type' => Supplier::class,
            'shipping_provider_id' => $provider->id
        ]);
    }

    public function test_supplier_dispatch_order_with_tracking_details()
    {
        // Setup
        $supplier = Supplier::create([
            'name' => 'Supplier X',
            'email' => 'supplier-x-dispatch@example.com',
            'password' => Hash::make('password'),
        ]);
        $user = User::create(['name' => 'S1', 'email' => 's1@s.com', 'password' => 'pwd', 'supplier_id' => $supplier->id]);
        $user->assignRole('supplier');

        $school = School::create([
            'name' => 'School A',
            'subdomain' => 'schoola',
            'email' => 'school-a-shipping@example.com',
            'password' => Hash::make('password'),
        ]);
        $category = Category::create(['name' => 'Shirts', 'slug' => 'shirts']);
        $product = Product::create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'name' => 'School Hoodie',
            'base_price' => 500,
            'stock_quantity' => 100
        ]);

        $customer = User::create(['name' => 'Parent', 'email' => 'parent@school.com', 'password' => 'p']);
        $order = Order::create([
            'school_id' => $school->id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD101',
            'total_amount' => 500,
            'payment_status' => 'paid'
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'final_price' => 500
        ]);

        $provider = ShippingProvider::where('slug', 'shiprocket')->first();

        // Dispatch with tracking info
        $response = $this->actingAs($user)->patchJson("/api/supplier/order/{$order->id}/dispatch", [
            'tracking_number' => 'SR987654321',
            'courier_name' => 'Shiprocket Express',
            'shipping_provider_id' => $provider->id
        ]);

        $response->assertStatus(200);

        // Check order item updated
        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem->id,
            'fulfillment_status' => 'dispatched',
            'tracking_number' => 'SR987654321',
            'shipping_provider_id' => $provider->id
        ]);

        // Check overall order status updated
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'supplier_status' => 'dispatched'
        ]);

        // Verify Resource response includes tracking URL
        $resourceResponse = $this->actingAs($user)->getJson("/api/supplier/orders");
        $resourceResponse->assertJsonFragment([
            'tracking_url' => "https://www.shiprocket.in/shipment-tracking/SR987654321"
        ]);
    }
}
