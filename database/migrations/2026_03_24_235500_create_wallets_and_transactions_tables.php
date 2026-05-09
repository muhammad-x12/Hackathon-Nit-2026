<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->morphs('owner'); // owner_id, owner_type (School or Supplier)
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('currency')->default('INR');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->string('type'); // credit, debit, payout
            $table->string('status')->default('completed'); // pending, completed, failed
            $table->string('reference_id')->nullable(); // Order ID or Payout ID
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
