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
        Schema::table('testimonials', function (Blueprint $table) {
            $table->string('author_name')->after('id');
            $table->string('author_role')->nullable()->after('author_name');
            $table->text('content')->after('author_role');
            $table->integer('rating')->default(5)->after('content');
            $table->string('author_image_path')->nullable()->after('rating');
            $table->boolean('is_active')->default(true)->after('author_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropColumn(['author_name', 'author_role', 'content', 'rating', 'author_image_path', 'is_active']);
        });
    }
};
