<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Add referral columns to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 12)->nullable()->unique()->after('supplier_id');
            $table->unsignedBigInteger('referred_by')->nullable()->after('referral_code');
            $table->foreign('referred_by')->references('id')->on('users')->onDelete('set null');
        });

        // 2. Add referral_discount setting to platform_settings
        DB::table('platform_settings')->insertOrIgnore([
            ['key' => 'referral_discount_type', 'value' => 'percentage'], // 'percentage' or 'flat'
            ['key' => 'referral_discount_value', 'value' => '10'],          // 10% off
            ['key' => 'referral_discount_max', 'value' => '500'],         // max ₹500 discount
            ['key' => 'referral_enabled', 'value' => '1'],
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referred_by']);
            $table->dropColumn(['referral_code', 'referred_by']);
        });
        DB::table('platform_settings')
            ->whereIn('key', ['referral_discount_type', 'referral_discount_value', 'referral_discount_max', 'referral_enabled'])
            ->delete();
    }
};
