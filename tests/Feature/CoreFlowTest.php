<?php

namespace Tests\Feature;

use App\Models\School;
use App\Models\User;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\SchoolProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class CoreFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed roles
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\PlatformSettingSeeder::class);
    }

    public function test_super_admin_can_create_school()
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/create-school', [
                'name' => 'Test School',
                'email' => 'testschool-admin@example.com',
                'password' => 'password12',
                'subdomain' => 'testschool',
                'commission_percentage' => 5,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('school.subdomain', 'testschool');

        $this->assertDatabaseHas('schools', ['subdomain' => 'testschool']);
    }

    public function test_customer_can_view_products_on_school_subdomain()
    {
        // Setup School
        $school = School::create([
            'name' => 'Test School',
            'subdomain' => 'testschool',
            'commission_percentage' => 5,
            'email' => 'testschool-products@example.com',
            'password' => Hash::make('password'),
        ]);

        // Setup Supplier & Product
        $supplier = Supplier::create([
            'name' => 'Supplier A',
            'email' => 'supplier-a-coreflow@example.com',
            'password' => Hash::make('password'),
        ]);
        $category = Category::create(['name' => 'Uniforms', 'slug' => 'uniforms']);
        $product = Product::create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'name' => 'Test Product',
            'base_price' => 100,
            'stock_quantity' => 10,
            'status' => 'active'
        ]);

        // Link Product to School
        SchoolProduct::create([
            'school_id' => $school->id,
            'product_id' => $product->id,
            'school_margin' => 10,
            'is_active' => true
        ]);

        // Request with Host header simulating subdomain
        $response = $this->withHeaders(['X-Test-Subdomain' => 'testschool'])
            ->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'pricing', 'stock_quantity']]]);
    }

    public function test_customer_can_create_order()
    {
        // Setup School
        $school = School::create([
            'name' => 'Test School',
            'subdomain' => 'testschool',
            'commission_percentage' => 5,
            'email' => 'testschool-orders@example.com',
            'password' => Hash::make('password'),
        ]);

        // Setup Product
        $supplier = Supplier::create([
            'name' => 'Supplier A',
            'email' => 'supplier-a-order@example.com',
            'password' => Hash::make('password'),
        ]);
        $category = Category::create(['name' => 'Uniforms', 'slug' => 'uniforms']);
        $product = Product::create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'name' => 'Test Product',
            'base_price' => 100,
            'stock_quantity' => 10,
            'status' => 'active'
        ]);

        // Link Product
        SchoolProduct::create([
            'school_id' => $school->id,
            'product_id' => $product->id,
            'school_margin' => 10,
            'is_active' => true
        ]);

        // Create Customer
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        // Create Order
        $response = $this->actingAs($customer)
            ->withHeaders(['X-Test-Subdomain' => 'testschool'])
            ->postJson('/api/order/create', [
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2]
                ],
                'shipping_address' => [
                    'name' => 'John Doe',
                    'phone' => '9876543210',
                    'address' => '123 Main St',
                    'city' => 'New York',
                    'pincode' => '10001'
                ]
            ]);


        $response->assertStatus(201)
            ->assertJsonPath('message', 'Order initiated');

        $expectedTotal = (float) $response->json('order.total_amount');
        $this->assertGreaterThan(0, $expectedTotal);
        $this->assertDatabaseHas('orders', [
            'school_id' => $school->id,
            'total_amount' => $expectedTotal,
        ]);
    }
}
