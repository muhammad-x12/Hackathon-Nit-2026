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
        // First add columns as nullable
        Schema::table('schools', function (Blueprint $table) {
            $table->string('email')->nullable()->after('name');
            $table->string('password')->nullable()->after('email');
        });

        // Update existing records with temporary values
        $schools = DB::table('schools')->get();
        foreach ($schools as $school) {
            DB::table('schools')
                ->where('id', $school->id)
                ->update([
                    'email' => strtolower(str_replace(' ', '', $school->name)) . $school->id . '@temp.com',
                    'password' => \Illuminate\Support\Facades\Hash::make('changeme123'),
                ]);
        }

        // Now make email unique
        Schema::table('schools', function (Blueprint $table) {
            $table->string('email')->unique()->change();
            $table->string('password')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['email', 'password']);
        });
    }
};
