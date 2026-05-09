<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('shiprocket_shipment_id')->nullable()->after('shipping_provider_id');
            $table->string('shiprocket_order_id')->nullable()->after('shiprocket_shipment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['shiprocket_shipment_id', 'shiprocket_order_id']);
        });
    }
};
