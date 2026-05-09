<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Role::create(['name' => 'super_admin']);
        Role::create(['name' => 'school']);
        Role::create(['name' => 'supplier']);
        Role::create(['name' => 'customer']);
    }
}
