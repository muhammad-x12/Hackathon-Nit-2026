<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\WalletTransaction;

class Wallet extends Model
{
    protected $fillable = ['owner_id', 'owner_type', 'balance', 'currency', 'status'];

    public function owner()
    {
        return $this->morphTo();
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Helper to get or create wallet for a school or supplier.
     */
    public static function resolveFor($model)
    {
        return self::firstOrCreate([
            'owner_id' => $model->id,
            'owner_type' => get_class($model)
        ]);
    }

    public function credit($amount, $description = null, $reference_id = null)
    {
        $this->increment('balance', $amount);
        return $this->transactions()->create([
            'amount' => $amount,
            'type' => 'credit',
            'description' => $description,
            'reference_id' => $reference_id,
        ]);
    }

    public function debit($amount, $description = null, $reference_id = null)
    {
        if ($this->balance < $amount) {
            throw new \Exception("Insufficient balance");
        }
        $this->decrement('balance', $amount);
        return $this->transactions()->create([
            'amount' => $amount,
            'type' => 'debit',
            'description' => $description,
            'reference_id' => $reference_id,
        ]);
    }
}
