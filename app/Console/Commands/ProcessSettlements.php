<?php

namespace App\Console\Commands;

use App\Models\Settlement;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessSettlements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'settlements:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Release pending settlements older than 7 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting settlement processing...');

        $pendingSettlements = Settlement::where('status', 'pending')
            ->where('created_at', '<=', Carbon::now()->subDays(7))
            ->get();

        foreach ($pendingSettlements as $settlement) {
            $settlement->update([
                'status' => 'settled',
                'settled_date' => Carbon::now(),
            ]);

            Log::info("Settlement #{$settlement->id} marked as settled.");
        }

        $this->info("Processed " . $pendingSettlements->count() . " settlements.");
    }
}
