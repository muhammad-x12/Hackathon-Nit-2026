<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PlatformSetting;

class PlatformSettingSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::create(['key' => 'platform_service_charge', 'value' => '10']); // Fixed Amount
        PlatformSetting::create(['key' => 'gst_percentage', 'value' => '18']); // 18%
        PlatformSetting::create(['key' => 'delivery_charges', 'value' => '50']); // Fixed Amount
    }
}
