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
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('email')->nullable()->after('name');
            $table->string('password')->nullable()->after('email');
        });

        // Update existing records with temporary values
        $suppliers = DB::table('suppliers')->get();
        foreach ($suppliers as $supplier) {
            DB::table('suppliers')
                ->where('id', $supplier->id)
                ->update([
                    'email' => strtolower(str_replace(' ', '', $supplier->name)) . $supplier->id . '@temp.com',
                    'password' => \Illuminate\Support\Facades\Hash::make('changeme123'),
                ]);
        }

        // Now make email unique
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('email')->unique()->change();
            $table->string('password')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['email', 'password']);
        });
    }
};
