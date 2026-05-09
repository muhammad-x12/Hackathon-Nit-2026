<?php

namespace App\Services\Payment;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CashfreeService implements PaymentGatewayInterface
{
    protected $appId;
    protected $secretKey;
    protected $environment;
    protected $baseUrl;

    public function __construct()
    {
        $this->appId = env('CASHFREE_APP_ID');
        $this->secretKey = env('CASHFREE_SECRET_KEY');
        $this->environment = env('CASHFREE_ENVIRONMENT', 'TEST');
        $this->baseUrl = $this->environment === 'PROD'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }

    public function initiatePayment(Order $order): array
    {
        $cashfreeOrderId = 'CF_ORDER_' . $order->id . '_' . time();
        
        // Sanitize phone: Remove spaces, dashes, leading 0 or +91 to get 10 digits
        $phone = $order->shipping_address['phone'] ?? '9999999999';
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($phone) > 10) {
            $phone = substr($phone, -10);
        }

        $payloadArray = [
            'order_id' => $cashfreeOrderId,
            // Temporary string to be replaced
            'order_amount' => '##AMOUNT##',
            'order_currency' => 'INR',
            'customer_details' => [
                'customer_id' => 'CUST_' . $order->customer_id,
                'customer_name' => $order->customer->name ?? 'Customer',
                'customer_email' => $order->customer->email ?? 'customer@example.com',
                'customer_phone' => $phone
            ],
            'order_meta' => [
                'return_url' => str_replace('http://', 'https://', url("/order-success/{$order->id}?order_id={order_id}"))
            ]
        ];

        $jsonPayload = json_encode($payloadArray);
        $amountStr = number_format((float) $order->total_amount, 2, '.', '');
        // Replace the string placeholder with the unquoted number
        $jsonPayload = str_replace('"##AMOUNT##"', $amountStr, $jsonPayload);

        Log::info('Initiating Cashfree Order', ['payload' => json_decode($jsonPayload, true), 'raw_json' => $jsonPayload]);

        $response = Http::withHeaders([
            'x-client-id' => $this->appId,
            'x-client-secret' => $this->secretKey,
            'x-api-version' => '2023-08-01',
            'Content-Type' => 'application/json',
            'Accept' => 'application/json'
        ])->withBody($jsonPayload, 'application/json')->post("{$this->baseUrl}/orders");

        if ($response->successful()) {
            $data = $response->json();
            $order->update([
                'payment_status' => 'pending',
                'transaction_id' => $cashfreeOrderId,
                'payment_provider' => 'cashfree'
            ]);

            return [
                'provider' => 'cashfree',
                'order_id' => $cashfreeOrderId,
                'payment_session_id' => $data['payment_session_id'] ?? null,
                'cf_order_id' => $data['cf_order_id'] ?? null,
                'environment' => $this->environment,
            ];
        }

        $resData = $response->json();
        Log::error('Cashfree Order Creation Failed', [
            'response' => $resData,
            'payload_sent' => $payloadArray
        ]);
        throw new \Exception('Failed to initiate payment with Cashfree: ' . ($resData['message'] ?? 'Unknown error'));
    }

    public function verifyPayment(array $data, Order $order): bool
    {
        // Use the transaction_id stored in our DB (the Cashfree Order ID) for the status check
        $cashfreeOrderId = $order->transaction_id;

        if (!$cashfreeOrderId) {
            return false;
        }

        $response = Http::withHeaders([
            'x-client-id' => $this->appId,
            'x-client-secret' => $this->secretKey,
            'x-api-version' => '2023-08-01',
            'Accept' => 'application/json'
        ])->get("{$this->baseUrl}/orders/{$cashfreeOrderId}");

        if ($response->successful()) {
            $orderInfo = $response->json();
            return isset($orderInfo['order_status']) && $orderInfo['order_status'] === 'PAID';
        }

        return false;
    }
}
