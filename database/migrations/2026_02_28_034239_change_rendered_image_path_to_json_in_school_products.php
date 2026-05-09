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
            $table->json('rendered_images')->nullable()->after('custom_text_position');
            $table->dropColumn('rendered_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_products', function (Blueprint $table) {
            $table->string('rendered_image_path')->nullable()->after('custom_text_position');
            $table->dropColumn('rendered_images');
        });
    }
};
