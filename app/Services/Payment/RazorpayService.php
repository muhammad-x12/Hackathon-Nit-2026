<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RazorpayService implements PaymentGatewayInterface
{
    protected $apiKey;
    protected $apiSecret;

    public function __construct()
    {
        $this->apiKey = config('services.razorpay.key');
        $this->apiSecret = config('services.razorpay.secret');
    }

    public function initiatePayment(Order $order): array
    {
        $amount = round($order->total_amount * 100); // Razorpay expects amount in paise (1 INR = 100 paise)
        
        $payload = [
            'amount' => $amount,
            'currency' => 'INR',
            'receipt' => 'receipt_order_' . $order->id,
            'notes' => [
                'order_id' => $order->id,
                'customer_name' => $order->customer->name ?? 'Customer',
            ]
        ];

        $response = Http::withBasicAuth($this->apiKey, $this->apiSecret)
            ->post('https://api.razorpay.com/v1/orders', $payload);

        if ($response->successful()) {
            $data = $response->json();
            $razorpayOrderId = $data['id'];

            $order->update([
                'payment_status' => 'pending', 
                'transaction_id' => $razorpayOrderId,
                'payment_provider' => 'razorpay'
            ]);

            return [
                'provider' => 'razorpay',
                'order_id' => $razorpayOrderId,
                'key_id' => $this->apiKey,
                'amount' => $amount,
                'currency' => 'INR',
                'name' => $order->school ? $order->school->name : config('app.name'),
                'description' => 'Order #' . $order->id,
                'prefill' => [
                    'name' => $order->customer?->name,
                    'email' => $order->customer?->email,
                    'contact' => $order->shipping_address['phone'] ?? null,
                ]
            ];
        }

        Log::error('Razorpay Order Creation Failed', [
            'order_id' => $order->id,
            'response' => $response->json()
        ]);

        throw new \Exception('Failed to initiate payment with Razorpay: ' . ($response->json()['error']['description'] ?? 'Unknown error'));
    }

    public function verifyPayment(array $data, Order $order): bool
    {
        if (!isset($data['razorpay_order_id'], $data['razorpay_payment_id'], $data['razorpay_signature'])) {
            return false;
        }

        $generated_signature = hash_hmac(
            'sha256', 
            $data['razorpay_order_id'] . "|" . $data['razorpay_payment_id'], 
            $this->apiSecret
        );

        Log::info('Razorpay Signature Verification', [
            'order_id' => $data['razorpay_order_id'],
            'payment_id' => $data['razorpay_payment_id'],
            'generated_signature' => $generated_signature,
            'received_signature' => $data['razorpay_signature']
        ]);

        if ($generated_signature === $data['razorpay_signature']) {
            return true;
        }

        return false;
    }
}
