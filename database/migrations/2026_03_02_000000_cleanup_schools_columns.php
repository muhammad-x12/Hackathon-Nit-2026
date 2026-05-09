<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop columns if they exist (cleanup from partial migration)
        if (Schema::hasColumn('schools', 'email')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->dropColumn('email');
            });
        }
        
        if (Schema::hasColumn('schools', 'password')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->dropColumn('password');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to do
    }
};
