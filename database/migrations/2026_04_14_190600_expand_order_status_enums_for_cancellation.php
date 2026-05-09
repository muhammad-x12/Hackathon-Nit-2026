<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Supplier cancellation flow uses additional statuses.
     *
     * MySQL-only: MODIFY ENUM.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE orders MODIFY COLUMN supplier_status ENUM('pending','accepted','dispatched','rejected','partially_cancelled','cancelled') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_status ENUM('pending','processing','shipped','delivered','returned','cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::table('orders')->where('supplier_status', 'partially_cancelled')->update(['supplier_status' => 'pending']);
        DB::table('orders')->where('supplier_status', 'cancelled')->update(['supplier_status' => 'pending']);
        DB::table('orders')->where('delivery_status', 'processing')->update(['delivery_status' => 'pending']);
        DB::table('orders')->where('delivery_status', 'cancelled')->update(['delivery_status' => 'pending']);

        DB::statement("ALTER TABLE orders MODIFY COLUMN supplier_status ENUM('pending','accepted','dispatched','rejected') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE orders MODIFY COLUMN delivery_status ENUM('pending','shipped','delivered','returned') NOT NULL DEFAULT 'pending'");
    }
};

