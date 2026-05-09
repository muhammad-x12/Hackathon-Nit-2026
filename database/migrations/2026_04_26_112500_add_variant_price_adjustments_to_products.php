<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'variant_price_adjustments')) {
                // { size: { "S": -10, "M": 0 }, color: { "Red": 20, "Blue": 10 } }
                $table->json('variant_price_adjustments')->nullable()->after('color');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'variant_price_adjustments')) {
                $table->dropColumn('variant_price_adjustments');
            }
        });
    }
};

