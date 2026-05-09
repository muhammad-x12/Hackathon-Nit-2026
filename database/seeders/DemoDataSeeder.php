<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\School;
use App\Models\Supplier;
use App\Models\Category;
use App\Models\Product;
use App\Models\SchoolProduct;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@platform.com',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('super_admin');

        // Supplier
        $supplier = Supplier::create([
            'name' => 'Alpha Uniforms',
            'email' => 'supplier@alpha.com',
            'password' => Hash::make('password'),
            'contact_info' => 'contact@alpha.com',
        ]);
        $supplierUser = User::create([
            'name' => 'Supplier Admin',
            'email' => 'supplier@alpha.com',
            'password' => Hash::make('password'),
            'supplier_id' => $supplier->id,
        ]);
        $supplierUser->assignRole('supplier');

        // School
        $school = School::create([
            'name' => 'Greenwood High',
            'email' => 'school@greenwood.com',
            'password' => Hash::make('password'),
            'subdomain' => 'greenwood',
            'commission_percentage' => 5.00,
        ]);
        $schoolUser = User::create([
            'name' => 'Greenwood Admin',
            'email' => 'admin@greenwood.com',
            'password' => Hash::make('password'),
            'school_id' => $school->id,
        ]);
        $schoolUser->assignRole('school');

        // Customer
        $customer = User::create([
            'name' => 'Parent User',
            'email' => 'parent@greenwood.com',
            'password' => Hash::make('password'),
        ]); // Customer role usually assigned on registration, but for demo:
        $customer->assignRole('customer');
        // Note: Customer doesn't strictly need school_id in users table, 
        // they are linked to school context via orders or session.
        // But if we want to bind them to a school? Schema has school_id nullable.
        // Let's leave it null for multi-school access or set it.
        $customer->update(['school_id' => $school->id]);


        // Categories & Products
        $category = Category::create(['name' => 'Uniforms', 'slug' => 'uniforms']);

        $product = Product::create([
            'supplier_id' => $supplier->id,
            'category_id' => $category->id,
            'name' => 'Classic Polo T-Shirt',
            'description' => 'Comfortable cotton polo',
            'base_price' => 500.00,
            'stock_quantity' => 100,
            'status' => 'active',
            'customization_flag' => true,
        ]);

        // Add Product to School Catalog
        SchoolProduct::create([
            'school_id' => $school->id,
            'product_id' => $product->id,
            'school_margin' => 100.00,
            'is_active' => true,
        ]);
    }
}
