<?php

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Create a payment order/intent and return the necessary data for client.
     * This could be a payment link, a client secret, or an order ID.
     */
    public function initiatePayment(Order $order): array;

    /**
     * Verify the payment using the provider's signature verification.
     */
    public function verifyPayment(array $data, Order $order): bool;
}
