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
            $table->boolean('for_schools_only')->default(false)->after('customization_flag');
            $table->integer('min_quantity')->default(1)->after('for_schools_only');
            $table->integer('max_quantity')->nullable()->after('min_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['for_schools_only', 'min_quantity', 'max_quantity']);
        });
    }
};
