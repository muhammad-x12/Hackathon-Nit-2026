<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('fulfillment_status')->default('pending')->after('quantity');
            $table->string('tracking_number')->nullable()->after('fulfillment_status');
            $table->string('courier_name')->nullable()->after('tracking_number');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['fulfillment_status', 'tracking_number', 'courier_name']);
        });
    }
};
