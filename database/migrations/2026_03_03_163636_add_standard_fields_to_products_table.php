<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 1. Basic Info
            $table->string('sku')->nullable()->unique()->after('id');
            $table->string('brand')->nullable()->after('name');
            $table->string('short_description')->nullable()->after('brand');
            // 'description' already exists as full description

            // 2. Product Type
            // options: 'wholesale', 'school_store', 'both'
            $table->string('product_type')->default('both')->after('category_id');

            // 3. Pricing Details
            $table->json('bulk_pricing')->nullable()->after('base_price');
            $table->decimal('gst_percentage', 5, 2)->default(0)->after('bulk_pricing');
            $table->string('hsn_code')->nullable()->after('gst_percentage');

            // 4. Variants & Customization
            $table->string('gender')->nullable()->after('material'); // boys, girls, unisex
            $table->string('class_mapping')->nullable()->after('gender'); // e.g. "1,2,3"
            $table->json('customization_options')->nullable()->after('customization_flag');
            // example: ["logo", "embroidery", "name", "book_list", "bundle"]
            $table->string('logo_placement_image')->nullable()->after('customization_options');

            // 5. Inventory & Stock
            $table->integer('low_stock_threshold')->default(10)->after('stock_quantity');
            $table->string('stock_type')->default('ready')->after('low_stock_threshold'); // ready, made_to_order

            // 6. Media Upload (Additional)
            $table->string('size_chart')->nullable()->after('images');
            $table->string('demo_image')->nullable()->after('size_chart');

            // 7. Shipping Details
            $table->decimal('weight', 8, 2)->nullable()->after('demo_image');
            $table->string('dimensions')->nullable()->after('weight'); // L x W x H
            $table->integer('dispatch_days')->default(3)->after('dimensions');
            $table->string('delivery_type')->default('direct')->after('dispatch_days'); // direct, bulk

            // 8. Visibility Settings
            $table->json('target_schools')->nullable()->after('for_schools_only'); // null for all, or [id1, id2]

            // 9. SEO
            $table->string('meta_title')->nullable()->after('status');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->text('meta_keywords')->nullable()->after('meta_description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'sku',
                'brand',
                'short_description',
                'product_type',
                'bulk_pricing',
                'gst_percentage',
                'hsn_code',
                'gender',
                'class_mapping',
                'customization_options',
                'logo_placement_image',
                'low_stock_threshold',
                'stock_type',
                'size_chart',
                'demo_image',
                'weight',
                'dimensions',
                'dispatch_days',
                'delivery_type',
                'target_schools',
                'meta_title',
                'meta_description',
                'meta_keywords'
            ]);
        });
    }
};
