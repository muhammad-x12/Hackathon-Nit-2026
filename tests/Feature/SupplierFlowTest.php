<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\School;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SupplierFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_supplier_can_create_product()
    {
        $supplier = Supplier::create([
            'name' => 'Supplier X',
            'email' => 'supplier-x-product@example.com',
            'password' => Hash::make('password'),
        ]);
        $user = User::create(['name' => 'S1', 'email' => 's1@s.com', 'password' => 'pwd', 'supplier_id' => $supplier->id]);
        $user->assignRole('supplier');

        $category = Category::create(['name' => 'C1', 'slug' => 'c1']);

        $response = $this->actingAs($user)
            ->postJson('/api/supplier/product', [
                'category_id' => $category->id,
                'name' => 'New Product',
                'base_price' => 100,
                'stock_quantity' => 50
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', ['name' => 'New Product', 'supplier_id' => $supplier->id]);
    }

    public function test_supplier_can_dispatch_order()
    {
        $supplier = Supplier::create([
            'name' => 'Supplier X',
            'email' => 'supplier-x-dispatch@example.com',
            'password' => Hash::make('password'),
        ]);
        $user = User::create(['name' => 'S1', 'email' => 's1@s.com', 'password' => 'pwd', 'supplier_id' => $supplier->id]);
        $user->assignRole('supplier');

        $school = School::create([
            'name' => 'S1',
            'subdomain' => 's1',
            'email' => 'school-s1-flow@example.com',
            'password' => Hash::make('password'),
        ]);
        $category = Category::create(['name' => 'C1', 'slug' => 'c1']);
        $product = Product::create(['supplier_id' => $supplier->id, 'category_id' => $category->id, 'name' => 'P1', 'base_price' => 10, 'stock_quantity' => 10]);

        $customer = User::create(['name' => 'C', 'email' => 'c@c.com', 'password' => 'p']);
        $order = Order::create(['school_id' => $school->id, 'customer_id' => $customer->id, 'order_number' => 'O1', 'total_amount' => 10, 'payment_status' => 'paid']);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'final_price' => 10
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/api/supplier/order/{$order->id}/dispatch");

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'supplier_status' => 'dispatched']);
    }
}
