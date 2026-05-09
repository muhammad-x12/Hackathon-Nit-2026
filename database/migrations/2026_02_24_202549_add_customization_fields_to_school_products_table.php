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
        Schema::table('school_products', function (Blueprint $table) {
            $table->integer('required_qty')->nullable()->after('is_active');
            $table->string('custom_logo_path')->nullable()->after('required_qty');
            $table->json('custom_logo_position')->nullable()->after('custom_logo_path');
            $table->string('custom_text')->nullable()->after('custom_logo_position');
            $table->json('custom_text_position')->nullable()->after('custom_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_products', function (Blueprint $table) {
            $table->dropColumn([
                'required_qty',
                'custom_logo_path',
                'custom_logo_position',
                'custom_text',
                'custom_text_position'
            ]);
        });
    }
};
