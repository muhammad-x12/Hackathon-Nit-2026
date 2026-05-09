<?php

namespace Tests\Feature;

use App\Events\OrderPlaced;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\School;
use App\Models\SchoolProduct;
use App\Models\Settlement;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SettlementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_settlement_is_created_when_order_placed()
    {
        // 1. Setup Data
        $school = School::create([
            'name' => 'Test School',
            'subdomain' => 'testschool',
            'email' => 'testschool-settlement@example.com',
            'password' => Hash::make('password'),
        ]);
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'email' => 'test-supplier-settlement@example.com',
            'password' => Hash::make('password'),
        ]);
        $category = Category::create(['name' => 'Testing', 'slug' => 'testing']);

        $product = Product::create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'name' => 'Test Product',
            'base_price' => 100,
            'stock_quantity' => 10,
            'status' => 'active'
        ]);

        $schoolProduct = SchoolProduct::create([
            'school_id' => $school->id,
            'product_id' => $product->id,
            'school_margin' => 50,
            'is_active' => true
        ]);

        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => bcrypt('password')
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST',
            'school_id' => $school->id,
            'customer_id' => $customer->id,
            'total_amount' => 150,
            'payment_status' => 'paid'
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'final_price' => 75,
            'school_margin' => 50 // Commission per unit
        ]);

        // 2. Trigger Event
        event(new OrderPlaced($order));

        // 3. Assert Settlement exists
        // commission = 50 * 2 = 100
        $this->assertDatabaseHas('settlements', [
            'school_id' => $school->id,
            'order_id' => $order->id,
            'commission_amount' => 100.00,
            'status' => 'pending'
        ]);
    }

    public function test_settlement_processing_command()
    {
        $customer = User::create(['name' => 'Cust', 'email' => 'c@c.com', 'password' => 'pwd']);
        $school = School::create([
            'name' => 'Test School',
            'subdomain' => 'testschool',
            'email' => 'testschool-settlement@example.com',
            'password' => Hash::make('password'),
        ]);
        $order = Order::create(['order_number' => 'ORD-1', 'school_id' => $school->id, 'customer_id' => $customer->id, 'total_amount' => 100]);

        // Create a settlement 8 days ago
        $settlement = Settlement::create([
            'school_id' => $school->id,
            'order_id' => $order->id,
            'commission_amount' => 50,
            'status' => 'pending',
        ]);
        $settlement->created_at = Carbon::now()->subDays(8);
        $settlement->save();

        // Run command
        $this->artisan('settlements:process')
            ->expectsOutput('Starting settlement processing...')
            ->assertExitCode(0);

        $this->assertDatabaseHas('settlements', [
            'id' => $settlement->id,
            'status' => 'settled'
        ]);
    }
}
