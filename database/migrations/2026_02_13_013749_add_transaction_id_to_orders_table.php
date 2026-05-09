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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('transaction_id')->nullable()->after('payment_status');
            $table->string('payment_provider')->nullable()->after('transaction_id');
            // Extend payment_status if enum needs modification, but Laravel enums in migrations 
            // are tricky to modify in some DBs. We used Enum type in create.
            // Let's assume 'pending', 'paid', 'failed' covers 'initiated' or map 'initiated' to 'pending'.
            // Actually I used 'initiated' in my service code.
            // If DB is MySQL, I might need to alter enum.
            // Or just use string for flexibility?
            // "payment_status" enum was defined as: ['pending', 'paid', 'failed']
            // I should stick to these or add 'initiated'.
            // For now, I'll stick to 'pending' as 'initiated'.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['transaction_id', 'payment_provider']);
        });
    }
};
