<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Online checkout sets order_status to "initiated" until payment is verified;
     * the original enum did not include this value (MySQL 1265 / data truncated).
     *
     * MySQL-only: SQLite/testing uses a string column for enums and does not support MODIFY.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending','processing','completed','cancelled','initiated') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::table('orders')->where('order_status', 'initiated')->update(['order_status' => 'pending']);
        DB::statement("ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending'");
    }
};
