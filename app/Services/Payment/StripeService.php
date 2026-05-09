<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Log;

class StripeService implements PaymentGatewayInterface
{
    protected $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.stripe.secret');
    }

    public function initiatePayment(Order $order): array
    {
        // Stripe uses PaymentIntents.
        // We would call Stripe API to create one.
        // Mock Response:
        $paymentIntentClientSecret = 'pi_' . uniqid() . '_secret_' . uniqid();

        $order->update(['payment_status' => 'pending', 'transaction_id' => $paymentIntentClientSecret]);

        return [
            'provider' => 'stripe',
            'client_secret' => $paymentIntentClientSecret,
            'publishable_key' => config('services.stripe.key'),
            'amount' => $order->total_amount * 100, // Cents
            'currency' => 'usd', // Or INR?
            'description' => 'Order #' . $order->order_number,
        ];
    }

    public function verifyPayment(array $data, Order $order): bool
    {
        // Stripe usually verifies webhook signature, or client confirms paymentIntent.
        // This method might confirm PaymentIntent status via API.

        // Mock
        return true;
    }
}
