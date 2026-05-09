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
        Schema::table('settlements', function (Blueprint $table) {
            $table->string('payment_mode')->nullable()->after('status');
            $table->string('reference_id')->nullable()->after('payment_mode');
            $table->text('payment_notes')->nullable()->after('reference_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn(['payment_mode', 'reference_id', 'payment_notes']);
        });
    }
};
