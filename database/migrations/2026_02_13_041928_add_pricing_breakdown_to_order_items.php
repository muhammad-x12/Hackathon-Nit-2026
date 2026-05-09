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
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('base_price', 10, 2)->after('quantity')->nullable();
            $table->decimal('platform_charge', 10, 2)->after('base_price')->nullable();
            $table->decimal('school_margin', 10, 2)->after('platform_charge')->nullable();
            $table->decimal('gst_amount', 10, 2)->after('school_margin')->nullable();
            $table->decimal('delivery_charge', 10, 2)->after('gst_amount')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['base_price', 'platform_charge', 'school_margin', 'gst_amount', 'delivery_charge']);
        });
    }
};
