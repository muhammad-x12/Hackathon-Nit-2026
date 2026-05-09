<?php

namespace App\Services;

use App\Repositories\OrderRepository;
use App\Models\SchoolProduct;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class OrderService
{
    protected $pricingService;
    protected $orderRepository;

    public function __construct(PricingService $pricingService, OrderRepository $orderRepository)
    {
        $this->pricingService = $pricingService;
        $this->orderRepository = $orderRepository;
    }

    protected function getPaymentService(string $provider)
    {
        if ($provider === 'stripe') {
            return new \App\Services\Payment\StripeService();
        }
        if ($provider === 'cashfree') {
            return new \App\Services\Payment\CashfreeService();
        }
        return new \App\Services\Payment\RazorpayService();
    }

    /**
     * Same line-item math as checkout / payment gateways (Cashfree, Razorpay). Use for previews so UI matches charged amount.
     *
     * @return array{items: array<int, array<string, mixed>>, gross_total: float}
     */
    public function calculateOrderLines(?int $schoolId, int $customerId, array $items, array $shippingAddress, string $paymentMethod = 'online'): array
    {
        $lineItems = [];
        $grossTotal = 0.0;

        foreach ($items as $item) {
            $productId = $item['product_id'];
            $quantity = $item['quantity'];

            $product = Product::find($productId);
            if (!$product || $product->status !== 'active' || $product->stock_quantity < $quantity) {
                throw ValidationException::withMessages(['product_id' => 'Product ' . ($product->name ?? 'ID ' . $productId) . ' is out of stock or inactive.']);
            }

            $schoolContext = app('request')->get('school');

            $schoolProduct = SchoolProduct::where('school_id', $schoolId)
                ->where('product_id', $productId)
                ->where('is_active', true)
                ->first();

            $request = app('request');
            $fromSubdomain = $request->attributes->get('from_subdomain', false);

            if (!$schoolProduct && $fromSubdomain) {
                if ($product->for_schools_only) {
                    throw ValidationException::withMessages(['product_id' => "Product {$product->name} is restricted and not available for this school's mapped catalog."]);
                }
            }

            if (!$schoolContext) {
                $bulkThreshold = $product->min_quantity ?: 1;
                if ($quantity < $bulkThreshold) {
                    throw ValidationException::withMessages(['quantity' => "On the main domain, you must purchase in bulk (minimum {$bulkThreshold} units)."]);
                }
            }

            $pincode = $shippingAddress['pincode'] ?? null;
            $lineWeightOverrideKg = null;
            $len = null;
            $wid = null;
            $hgt = null;
            if (isset($item['weight']) && is_numeric($item['weight']) && (float) $item['weight'] > 0) {
                $lineWeightOverrideKg = (float) $item['weight'];
            }
            if (isset($item['length']) && is_numeric($item['length'])) $len = (float) $item['length'];
            if (isset($item['width']) && is_numeric($item['width'])) $wid = (float) $item['width'];
            if (isset($item['height']) && is_numeric($item['height'])) $hgt = (float) $item['height'];

            $userOptions = $item['options'] ?? [];
            // Calculate pricing WITHOUT shipping included in the final unit price to avoid per-unit rounding bias for bulk orders.
            // Variant price adjustments (size/color) are applied using $userOptions.
            $pricing = $this->pricingService->calculateParams(
                $product, 
                $schoolProduct, 
                $pincode, 
                $paymentMethod === 'cod', 
                $quantity, 
                $lineWeightOverrideKg, 
                false, 
                $userOptions,
                $len,
                $wid,
                $hgt
            );

            $customization_data = $userOptions;
            if ($lineWeightOverrideKg !== null || $len !== null || $wid !== null || $hgt !== null) {
                $customization_data['_shipping'] = [
                    'line_weight_kg' => $lineWeightOverrideKg !== null ? round($lineWeightOverrideKg, 4) : null,
                    'length_cm' => $len,
                    'width_cm' => $wid,
                    'height_cm' => $hgt,
                ];
            }

            if ($schoolProduct && !empty($schoolProduct->rendered_images)) {
                $customization_data['rendered_images'] = collect($schoolProduct->rendered_images)
                    ->map(fn($p) => \App\Http\Resources\ProductResource::normalizeStoragePath($p))
                    ->all();
            }

            $lineItems[] = [
                'product_id' => $productId,
                'quantity' => $quantity,
                'final_price' => $pricing['final_price'], // Base unit price (tax+margins)
                'base_price' => $pricing['base_price'],
                'platform_charge' => $pricing['platform_margin'],
                'school_margin' => $pricing['school_margin'],
                'gst_amount' => $pricing['gst_amount'],
                'delivery_charge' => $pricing['delivery_charges'], // Per unit delivery (for records)
                'customization_data' => !empty($customization_data) ? json_encode($customization_data) : null,
            ];

            // Total for this line = (unit price * qty) + total shipping for the line
            $lineBaseTotal = $pricing['final_price'] * $quantity;
            $lineShippingTotal = $pricing['shipping_total_for_line'] ?? 0;
            $grossTotal += ($lineBaseTotal + $lineShippingTotal);
        }

        return [
            'items' => $lineItems,
            'gross_total' => $grossTotal,
        ];
    }

    /**
     * @param  array{items: array, gross_total: float}|null  $prebuilt  From {@see calculateOrderLines()} to avoid duplicate pricing/shipping API calls.
     */
    public function createOrder(?int $schoolId, int $customerId, array $items, array $shippingAddress, string $paymentProvider = 'razorpay', float $discountAmount = 0.0, ?string $referralCode = null, string $paymentMethod = 'online', ?array $prebuilt = null)
    {
        $built = $prebuilt ?? $this->calculateOrderLines($schoolId, $customerId, $items, $shippingAddress, $paymentMethod);

        $orderData = [
            'school_id' => $schoolId,
            'customer_id' => $customerId,
            'shipping_address' => $shippingAddress,
            'items' => $built['items'],
            'total_amount' => max(0.0, round((float) $built['gross_total'], 2) - $discountAmount),
            'discount_amount' => $discountAmount,
            'referral_code_used' => $referralCode,
        ];

        $order = $this->orderRepository->createOrder($orderData);
        $order->payment_method = $paymentMethod;

        $paymentData = null;
        if ($paymentMethod === 'cod') {
            $order->payment_status = 'pending';
            $order->order_status = 'pending';
            // Trigger order placed event for stock deduction even for COD? 
            // Usually, yes, to reserve stock.
            event(new \App\Events\OrderPlaced($order));
        } else {
            $paymentService = $this->getPaymentService($paymentProvider);
            $paymentData = $paymentService->initiatePayment($order);
            $order->payment_provider = $paymentProvider;
            $order->order_status = 'initiated'; // Draft state until payment is verified
            $order->payment_status = 'pending';
        }

        $order->save();

        return [
            'order' => $order,
            'payment' => $paymentData,
        ];
    }
}
