<?php

namespace App\Providers;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        \Illuminate\Support\Facades\Event::listen(
            \App\Events\OrderPlaced::class,
            \App\Listeners\DeductProductStockListener::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\OrderPlaced::class,
            \App\Listeners\CreditWalletListener::class
        );

        \Illuminate\Http\Resources\Json\JsonResource::withoutWrapping();
    }
}
