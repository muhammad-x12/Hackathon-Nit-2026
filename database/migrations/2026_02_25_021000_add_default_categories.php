<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $categories = [
            'Books',
            'Stationery',
            'Accessories',
            'Footwear',
            'Sports',
            'Bags'
        ];

        foreach ($categories as $category) {
            DB::table('categories')->insertOrIgnore([
                'name' => $category,
                'slug' => Str::slug($category),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $categories = [
            'Books',
            'Stationery',
            'Accessories',
            'Footwear',
            'Sports',
            'Bags'
        ];

        DB::table('categories')->whereIn('name', $categories)->delete();
    }
};
