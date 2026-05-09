<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_admin_can_create_category()
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'a@p.com', 'password' => 'p']);
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/create-category', [
                'name' => 'New Category'
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', ['name' => 'New Category', 'slug' => 'new-category']);
    }

    public function test_admin_can_update_settings()
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'a@p.com', 'password' => 'p']);
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/settings', [
                'settings' => [
                    ['key' => 'custom_setting', 'value' => 'custom_value']
                ]
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('platform_settings', ['key' => 'custom_setting', 'value' => 'custom_value']);
    }

    public function test_admin_can_create_supplier()
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'a@p.com', 'password' => 'p']);
        $admin->assignRole('super_admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/create-supplier', [
                'name' => 'New Supplier',
                'email' => 'new-supplier-adminflow@example.com',
                'password' => 'password12',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('suppliers', ['name' => 'New Supplier']);
    }
}
