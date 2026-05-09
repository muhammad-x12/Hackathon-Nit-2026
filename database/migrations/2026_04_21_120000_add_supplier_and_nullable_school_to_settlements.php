<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            if (! Schema::hasColumn('settlements', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->after('school_id')->constrained('suppliers');
            }
        });

        Schema::table('settlements', function (Blueprint $table) {
            $table->unsignedBigInteger('school_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
        });

        Schema::table('settlements', function (Blueprint $table) {
            $table->unsignedBigInteger('school_id')->nullable(false)->change();
        });
    }
};
