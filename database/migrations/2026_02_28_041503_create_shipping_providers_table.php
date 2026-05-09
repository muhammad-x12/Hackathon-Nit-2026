<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipping_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., Shiprocket, Delhivery, etc.
            $table->string('slug')->unique();
            $table->json('config_keys')->nullable(); // Metadata about required keys
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // Table for storing actual credentials per Authority (Admin or Supplier)
        Schema::create('authority_shipping_configs', function (Blueprint $table) {
            $table->id();
            $table->morphs('owner'); // supplier or admin (user)
            $table->foreignId('shipping_provider_id')->constrained();
            $table->json('credentials');
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });

        // Add shipping_provider_id to order_items for explicit tracking link generation
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('shipping_provider_id')->nullable()->constrained()->after('courier_name');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_provider_id');
        });
        Schema::dropIfExists('authority_shipping_configs');
        Schema::dropIfExists('shipping_providers');
    }
};
