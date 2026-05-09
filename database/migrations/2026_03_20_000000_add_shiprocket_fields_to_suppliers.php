<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('shiprocket_pickup_nickname')->nullable()->after('contact_info');
        });
    }
    public function down() {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn('shiprocket_pickup_nickname');
        });
    }
};
