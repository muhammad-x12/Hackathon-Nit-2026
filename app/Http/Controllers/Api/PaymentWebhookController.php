<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Events\OrderPlaced;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(Request $request, string $provider)
    {
        switch ($provider) {
            case 'razorpay':
                return $this->handleRazorpay($request);
            case 'stripe':
                return $this->handleStripe($request);
            case 'cashfree':
                return $this->handleCashfree($request);
            default:
                return response()->json(['error' => 'Invalid provider'], 400);
        }
    }

    protected function handleCashfree(Request $request)
    {
        Log::info('Cashfree Webhook Received', $request->all());

        $payload = $request->all();
        // New Cashfree Webhook format (v3) has 'data' -> 'order' -> 'order_id'
        $cfOrderId = $payload['data']['order']['order_id'] ?? null;
        $status = $payload['data']['payment']['payment_status'] ?? null;

        if (!$cfOrderId) {
            return response()->json(['message' => 'No order ID'], 200);
        }

        // Cashfree Order ID in our system looks like: CF_ORDER_{order_id}_{time}
        // Extract the original order ID
        if (preg_match('/CF_ORDER_(\d+)_/', $cfOrderId, $matches)) {
            $orderId = $matches[1];
            $order = Order::find($orderId);
        } else {
            // Fallback: search by transaction_id
            $order = Order::where('transaction_id', $cfOrderId)->first();
        }

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 200);
        }

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Already processed'], 200);
        }

        if ($status === 'SUCCESS') {
            $order->update(['payment_status' => 'paid', 'order_status' => 'processing']);
            event(new OrderPlaced($order));
        } elseif (in_array($status, ['FAILED', 'CANCELLED'])) {
            $order->update(['payment_status' => 'failed', 'order_status' => 'cancelled']);
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleRazorpay(Request $request)
    {
        // 1. Verify signature
        // $signature = $request->header('X-Razorpay-Signature');
        // $secret = config('services.razorpay.webhook_secret');
        // Logic to verify signature using hmac...
        if (!$this->verifyRazorpaySignature($request->all(), $request->header('X-Razorpay-Signature'))) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // 2. Extract order ID and status
        $payload = $request->all();
        // Assuming payload has 'payload.payment.entity.notes.order_number' or similar 
        // to map back to our Order.
        // Or if we passed our order ID as reference.

        $orderNumber = $payload['payload']['payment']['entity']['notes']['order_number'] ?? null;

        if (!$orderNumber) {
            return response()->json(['message' => 'Order number not found'], 200); // 200 to acknowledge webhook
        }

        $order = Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 200);
        }

        // Idempotency check: If already paid, do nothing
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Already processed'], 200);
        }

        if ($payload['event'] === 'payment.captured') {
            $order->update(['payment_status' => 'paid', 'order_status' => 'processing']);

            // Trigger Order Placed Event (OrderFulfillment)
            event(new OrderPlaced($order));
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleStripe(Request $request)
    {
        // Similar logic for Stripe
        // Verify signature using Stripe library
        // ...

        // For MVP mock:
        $orderNumber = $request->input('data.object.metadata.order_number');

        if ($orderNumber) {
            $order = Order::where('order_number', $orderNumber)->first();
            if ($order && $order->payment_status !== 'paid') {
                $order->update(['payment_status' => 'paid', 'order_status' => 'processing']);
                event(new OrderPlaced($order));
            }
        }

        return response()->json(['status' => 'success']);
    }

    protected function verifyRazorpaySignature($payload, $signature)
    {
        // Placeholder verification logic
        return true;
    }
}
