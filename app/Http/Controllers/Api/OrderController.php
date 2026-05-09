<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\LogisticsService;
use App\Services\OrderService;
use App\Services\PricingService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;

    protected $pricingService;

    protected $logisticsService;

    public function __construct(OrderService $orderService, PricingService $pricingService, LogisticsService $logisticsService)
    {
        $this->orderService = $orderService;
        $this->pricingService = $pricingService;
        $this->logisticsService = $logisticsService;
    }

    public function create(CreateOrderRequest $request)
    {
        $schoolContext = $request->get('school');
        if (!$schoolContext) {
            $targetSchoolId = $request->user()->school_id;
        } else {
            $targetSchoolId = $schoolContext->id;
        }

        $customerId = $request->user()->id;
        $customer = $request->user();

        \Log::info('Order Creation Request Detail', [
            'user_id' => $customerId,
            'school_context' => $schoolContext ? $schoolContext->id : null,
            'target_school_id' => $targetSchoolId,
            'items_count' => count($request->input('items', [])),
            'pincode' => $request->input('shipping_address.pincode'),
            'payment_method' => $request->input('payment_method', 'online'),
        ]);

        try {
            $built = $this->orderService->calculateOrderLines(
                $targetSchoolId,
                $customerId,
                $request->input('items'),
                $request->input('shipping_address'),
                $request->input('payment_method', 'online')
            );
            [$discountAmount, $appliedCode] = $this->resolveReferralDiscount(
                $request,
                $customerId,
                (float) $built['gross_total']
            );

            $result = $this->orderService->createOrder(
                $targetSchoolId,
                $customerId,
                $request->input('items'),
                $request->input('shipping_address'),
                $request->input('payment_provider', config('app.active_payment_gateway', 'razorpay')),
                $discountAmount,
                $appliedCode,
                $request->input('payment_method', 'online'),
                $built
            );

            // Persist customer's last used shipping address as default for next purchase/profile edits.
            if ($request->filled('shipping_address') && is_array($request->input('shipping_address'))) {
                $addr = $request->input('shipping_address');
                $customer->default_shipping_address = [
                    'name' => $addr['name'] ?? $customer->name,
                    'phone' => $addr['phone'] ?? null,
                    'address' => $addr['address'] ?? null,
                    'city' => $addr['city'] ?? null,
                    'pincode' => $addr['pincode'] ?? null,
                ];
                $customer->save();
            }

            return response()->json([
                'order' => new \App\Http\Resources\OrderResource($result['order']),
                'payment' => $result['payment'],
                'discount' => $discountAmount,
                'referral_code' => $appliedCode,
                'message' => 'Order initiated'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function verify(Request $request)
    {
        $request->validate(['order_id' => 'required']);

        $order = \App\Models\Order::find($request->order_id);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $provider = $order->payment_provider ?: env('ACTIVE_PAYMENT_GATEWAY', 'razorpay');

        $paymentService = null;
        if ($provider === 'cashfree') {
            $paymentService = new \App\Services\Payment\CashfreeService();
        } else {
            $paymentService = new \App\Services\Payment\RazorpayService();
        }

        \Illuminate\Support\Facades\Log::info("Payment Verification Started for {$provider}", [
            'order_id' => $order->id,
            'transaction_id' => $order->transaction_id
        ]);

        if ($paymentService->verifyPayment($request->all(), $order)) {
            
            // Avoid double processing
            if ($order->payment_status !== 'paid') {
                $order->update(['payment_status' => 'paid', 'order_status' => 'processing']);
                
                // Trigger Event (Wallet Credit + Stock Deduction)
                event(new \App\Events\OrderPlaced($order));
            }
            return response()->json([
                'message' => 'Payment verified successfully',
                'order_id' => $order->id,
                'provider' => $provider
            ]);
        }

        \Illuminate\Support\Facades\Log::error("Payment Verification Failed via {$provider}", [
            'order_id' => $order->id,
            'data' => $request->all()
        ]);

        $order->refresh();
        if (($order->payment_method ?? 'online') !== 'cod'
            && $order->payment_status === 'pending') {
            $order->update([
                'payment_status' => 'failed',
                'order_status' => 'cancelled',
            ]);
        }

        return response()->json(['error' => 'Payment verification failed'], 400);
    }

    /**
     * Customer closed the gateway or left checkout without completing payment (online orders only).
     */
    public function abandonPayment(Request $request)
    {
        $request->validate(['order_id' => 'required|integer']);

        $order = $request->user()->orders()->find($request->order_id);
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if (($order->payment_method ?? 'online') === 'cod') {
            return response()->json(['message' => 'Not applicable']);
        }
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Already paid']);
        }
        if ($order->payment_status === 'failed') {
            return response()->json(['message' => 'Already failed']);
        }

        if ($order->order_status === 'initiated' && $order->payment_status === 'pending') {
            $order->update([
                'payment_status' => 'failed',
                'order_status' => 'cancelled',
            ]);

            return response()->json(['message' => 'Payment not completed']);
        }

        return response()->json(['message' => 'No change']);
    }

    public function index(Request $request)
    {
        // For customer to see their orders in this school?
        // Or all orders?
        // Requirement says "GET /api/school/orders" (for school admin) and "GET /api/supplier/orders"
        // But also "Customer... Only own orders".

        // This controller is likely for Customer scope.
        $school = $request->get('school');
        $query = $request->user()->orders()
            ->whereIn('payment_status', ['paid', 'pending'])
            ->with(['items.product', 'school'])
            ->latest();

        if ($school) {
            $query->where('school_id', $school->id);
        }

        return \App\Http\Resources\OrderResource::collection(
            $query->paginate(15)
        );
    }

    public function show(Request $request, $id)
    {
        $order = $request->user()->orders()
            ->with(['items.product', 'school'])
            ->findOrFail($id);

        return new \App\Http\Resources\OrderResource($order);
    }

    public function calculateShipping(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.weight' => 'nullable|numeric|min:0.01',
            'items.*.length' => 'nullable|numeric|min:1',
            'items.*.width' => 'nullable|numeric|min:1',
            'items.*.height' => 'nullable|numeric|min:1',
            // Strict: prevent "ABC123" or spaces from silently turning into fallback shipping.
            'pincode' => ['required', 'regex:/^\d{6}$/'],
            'payment_method' => 'nullable|string|in:online,cod',
        ]);

        $totalShipping = 0;
        $items = $request->input('items');
        $pincode = $request->input('pincode');
        $paymentMethod = $request->input('payment_method', 'online');
        $isCod = strtolower((string) $paymentMethod) === 'cod';

        \Log::info('Shipping Calculation Request', [
            'item_ids' => collect($items)->pluck('product_id')->all(),
            'pincode' => $pincode,
            'payment_method' => $paymentMethod
        ]);

        $lines = [];
        $deliveryDates = [];
        $deliveryDays = [];
        try {
            foreach ($items as $item) {
                $product = \App\Models\Product::with('supplier.shippingConfigs.provider')->find($item['product_id']);
                $qty = (int) $item['quantity'];
                $weightOverride = isset($item['weight']) && is_numeric($item['weight']) ? (float) $item['weight'] : null;
                $lengthOverride = isset($item['length']) && is_numeric($item['length']) ? (float) $item['length'] : null;
                $widthOverride = isset($item['width']) && is_numeric($item['width']) ? (float) $item['width'] : null;
                $heightOverride = isset($item['height']) && is_numeric($item['height']) ? (float) $item['height'] : null;

                $quote = $this->pricingService->quoteShippingQuoteForCartLine(
                    $product, 
                    $pincode, 
                    $qty, 
                    $isCod, 
                    $weightOverride,
                    $lengthOverride,
                    $widthOverride,
                    $heightOverride
                );
                $lineShipping = (float) $quote['charge'];
                $totalShipping += $lineShipping;

                if (! empty($quote['expected_delivery_by'])) {
                    $deliveryDates[] = $quote['expected_delivery_by'];
                }
                if (isset($quote['expected_delivery_days']) && $quote['expected_delivery_days'] !== null && (int) $quote['expected_delivery_days'] > 0) {
                    $deliveryDays[] = (int) $quote['expected_delivery_days'];
                }

                $storedKg = (float) ($product->weight ?? 0);
                $unitKg = $this->logisticsService->billableUnitWeightKg($product);
                $weightUsed = $weightOverride !== null ? round($weightOverride, 3) : round(max(0.05, $unitKg * max(1, $qty)), 3);
                
                $finalDims = $this->logisticsService->billablePackageDimensionsCm($product, $lengthOverride, $widthOverride, $heightOverride);
                
                $weightSource = $weightOverride !== null
                    ? 'request_override'
                    : ($storedKg <= 0
                        ? 'database_default_0_5kg_per_unit'
                        : ($storedKg < 0.05 ? 'database_under_50g_raised_to_0_5kg_per_unit' : 'database'));
                $lines[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $qty,
                    'stored_unit_weight_kg' => $storedKg > 0 ? round($storedKg, 3) : null,
                    'unit_weight_used_kg' => round($unitKg, 3),
                    'billable_weight_kg' => $weightUsed,
                    'length' => $finalDims[0],
                    'width' => $finalDims[1],
                    'height' => $finalDims[2],
                    'weight_source' => $weightSource,
                    'shipping' => round($lineShipping, 2),
                    'origin_pincode' => $quote['pickup_pincode'] ?? null,
                    'courier_name' => $quote['courier_name'] ?? null,
                    'expected_delivery_by' => $quote['expected_delivery_by'],
                    'expected_delivery_days' => $quote['expected_delivery_days'],
                ];
            }

            $expectedDeliveryBy = $deliveryDates !== [] ? max($deliveryDates) : null;
            $expectedDeliveryDays = $deliveryDays !== [] ? max($deliveryDays) : null;

            return response()->json([
                'received' => [
                    'items' => $items,
                    'pincode' => $pincode,
                    'payment_method' => $request->input('payment_method', 'online'),
                ],
                'shipping_charge' => round($totalShipping, 2),
                'pincode' => $pincode,
                'expected_delivery_by' => $expectedDeliveryBy,
                'expected_delivery_days' => $expectedDeliveryDays,
                'lines' => $lines,
                'weight_policy' => 'Weight and dimensions are loaded from the products table by product_id. To send custom values, add weight, length, width, or height to the items array.',
            ]);
        } catch (\Throwable $e) {
            \Log::error('Shipping Calculation Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    public function trackOrder(Request $request, $id)
    {
        $order = $request->user()->orders()->findOrFail($id);
        
        // Find first item with tracking number
        $item = $order->items()->whereNotNull('tracking_number')->first();
        
        if (!$item) {
            return response()->json(['status' => 'Order is being processed', 'tracking' => null]);
        }

        $logistics = app(\App\Services\LogisticsService::class);
        $tracking = $logistics->trackShipment($item->tracking_number);

        return response()->json([
            'status' => 'Shipped',
            'awb' => $item->tracking_number,
            'courier' => $item->courier_name,
            'tracking' => $tracking
        ]);
    }

    /**
     * Exact totals used for order creation and payment gateways (matches Cashfree / Razorpay charge).
     */
    public function previewOrder(CreateOrderRequest $request)
    {
        $schoolContext = $request->get('school');
        $targetSchoolId = $schoolContext ? $schoolContext->id : $request->user()->school_id;
        $customerId = $request->user()->id;

        try {
            $built = $this->orderService->calculateOrderLines(
                $targetSchoolId,
                $customerId,
                $request->input('items'),
                $request->input('shipping_address'),
                $request->input('payment_method', 'online')
            );
            [$discountAmount, $appliedCode] = $this->resolveReferralDiscount(
                $request,
                $customerId,
                (float) $built['gross_total']
            );
            $gross = round((float) $built['gross_total'], 2);
            $discountAmount = round($discountAmount, 2);
            $total = max(0.0, round($gross - $discountAmount, 2));

            return response()->json([
                'gross_total' => $gross,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'referral_code' => $appliedCode,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }

    /**
     * Referral discount is applied to the same gross order total the customer pays (incl. tax, margins, shipping in line prices).
     *
     * @return array{0: float, 1: string|null}
     */
    protected function resolveReferralDiscount(Request $request, int $customerId, float $grossOrderTotal): array
    {
        $discountAmount = 0.0;
        $appliedCode = null;

        if (! $request->filled('referral_code')) {
            return [$discountAmount, $appliedCode];
        }

        $settings = PlatformSetting::pluck('value', 'key');
        if (! ($settings['referral_enabled'] ?? '1')) {
            return [$discountAmount, $appliedCode];
        }

        $referrer = User::where('referral_code', strtoupper($request->referral_code))->first();
        if (! $referrer || $referrer->id === $customerId) {
            return [$discountAmount, $appliedCode];
        }

        $type = $settings['referral_discount_type'] ?? 'percentage';
        $value = (float) ($settings['referral_discount_value'] ?? 10);
        $max = (float) ($settings['referral_discount_max'] ?? 500);

        if ($type === 'percentage') {
            $discountAmount = min($grossOrderTotal * $value / 100, $max);
        } else {
            $discountAmount = min($value, $max);
        }

        $appliedCode = strtoupper($request->referral_code);

        return [$discountAmount, $appliedCode];
    }
}
