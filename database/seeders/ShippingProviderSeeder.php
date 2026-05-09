<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ShippingProvider;

class ShippingProviderSeeder extends Seeder
{
    public function run(): void
    {
        $providers = [
            [
                'name' => 'Shiprocket',
                'slug' => 'shiprocket',
                'config_keys' => ['email', 'password'],
                'is_active' => true
            ],
            [
                'name' => 'Delhivery',
                'slug' => 'delhivery',
                'config_keys' => ['api_key'],
                'is_active' => true
            ],
            [
                'name' => 'Courierbees',
                'slug' => 'courierbees',
                'config_keys' => ['client_id', 'client_secret'],
                'is_active' => true
            ],
            [
                'name' => 'Manual Tracking',
                'slug' => 'manual',
                'config_keys' => ['tracking_url_template'],
                'is_active' => true
            ],
        ];

        foreach ($providers as $p) {
            ShippingProvider::updateOrCreate(['slug' => $p['slug']], $p);
        }
    }
}
