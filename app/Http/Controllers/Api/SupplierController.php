<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\CreateProductRequest;
use App\Models\Product;
use App\Models\Order;
use App\Models\School;
use App\Models\SchoolProduct;
use App\Http\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SupplierController extends Controller
{
    public function createProduct(CreateProductRequest $request)
    {
        $supplier = $request->user()->supplier;

        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $data = $request->validated();
        $data['supplier_id'] = $supplier->id;
        $data['status'] = $request->input('status', 'active');

        // Handle Gallery Images
        if ($request->hasFile('images')) {
            $imagePaths = [];
            $files = $request->file('images');
            if (!is_array($files)) {
                $files = [$files];
            }
            foreach ($files as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        // Handle Color-Specific Images
        $colorImages = [];
        if ($request->has('color_images_data')) {
            $colorImages = json_decode($request->color_images_data, true) ?: [];
        }

        if ($request->hasFile('color_images')) {
            $colorData = $request->file('color_images');
            foreach ($colorData as $color => $files) {
                if (is_array($files)) {
                    foreach ($files as $file) {
                        $path = $file->store('products', 'public');
                        $colorImages[$color][] = $path;
                    }
                }
            }
        }
        if (!empty($colorImages)) {
            $data['color_images'] = $colorImages;
        }

        // Handle Individual File Fields
        $fileFields = ['logo_placement_image', 'size_chart', 'demo_image'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store('products', 'public');
                $data[$field] = $path;
            }
        }

        // Handle JSON fields if they come as strings
        $jsonFields = ['bulk_pricing', 'customization_options', 'target_schools', 'variant_price_adjustments'];
        foreach ($jsonFields as $field) {
            if ($request->has($field) && is_string($request->$field)) {
                $data[$field] = json_decode($request->$field, true);
            }
        }

        $product = Product::create($data);

        return response()->json([
            'message' => 'Product created',
            'data' => new \App\Http\Resources\ProductResource($product)
        ], 201);
    }
    public function indexProducts(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $limit = $request->get('limit', 100);
        $products = Product::where('supplier_id', $supplier->id)
            ->with(['category', 'subcategory', 'supplier'])
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        return \App\Http\Resources\ProductResource::collection($products);
    }

    public function showProduct(Request $request, $id)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $product = Product::where('id', $id)
            ->where('supplier_id', $supplier->id)
            ->with(['category', 'subcategory', 'supplier'])
            ->firstOrFail();

        return new \App\Http\Resources\ProductResource($product);
    }

    public function updateProduct(Request $request, $id)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $product = Product::where('id', $id)->where('supplier_id', $supplier->id)->firstOrFail();

        $dummyReq = new \App\Http\Requests\Product\CreateProductRequest();
        $dummyReq->setUserResolver($request->getUserResolver());
        $rules = $dummyReq->rules();
        $rules['sku'] = 'nullable|string|max:100|unique:products,sku,' . $id;
        // Make essential fields optional for update
        $rules['name'] = 'nullable|string|max:255';
        $rules['base_price'] = 'nullable|numeric|min:0';
        $rules['stock_quantity'] = 'nullable|integer|min:0';
        $rules['category_id'] = 'nullable|exists:categories,id';
        $rules['subcategory_id'] = 'nullable|exists:categories,id';

        $data = $request->validate($rules);

        // Handle Gallery Images
        if ($request->hasFile('images')) {
            $imagePaths = $product->images ?? [];
            $files = $request->file('images');
            if (!is_array($files)) {
                $files = [$files];
            }
            foreach ($files as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = $path;
            }
            $data['images'] = $imagePaths;
        }

        // Handle Color-Specific Images
        $colorImages = $product->color_images ?? [];
        if ($request->has('color_images_data')) {
            $colorImages = json_decode($request->color_images_data, true) ?: [];
        }

        if ($request->hasFile('color_images')) {
            $colorData = $request->file('color_images');
            foreach ($colorData as $color => $files) {
                if (is_array($files)) {
                    foreach ($files as $file) {
                        $path = $file->store('products', 'public');
                        $colorImages[$color][] = $path;
                    }
                }
            }
        }
        $data['color_images'] = $colorImages;

        // Handle Individual File Fields
        $fileFields = ['logo_placement_image', 'size_chart', 'demo_image'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store('products', 'public');
                $data[$field] = $path;
            }
        }

        // Handle JSON fields if they come as strings
        $jsonFields = ['bulk_pricing', 'customization_options', 'target_schools', 'variant_price_adjustments', 'color_images'];
        foreach ($jsonFields as $field) {
            if ($request->has($field) && is_string($request->$field)) {
                $data[$field] = json_decode($request->$field, true);
            }
        }

        $product->update($data);

        return response()->json([
            'message' => 'Product updated',
            'data' => new \App\Http\Resources\ProductResource($product)
        ]);
    }

    public function deleteProduct(Request $request, $id)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $product = Product::where('id', $id)->where('supplier_id', $supplier->id)->firstOrFail();

        // Ensure constrained order items are removed first to prevent SQL 1451
        \App\Models\OrderItem::where('product_id', $product->id)->delete();
        \App\Models\SchoolProduct::where('product_id', $product->id)->delete();

        // Remove images if needed
        if (is_array($product->images)) {
            foreach ($product->images as $img) {
                if (!str_starts_with($img, 'http')) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($img);
                }
            }
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }

    public function updateProductStock(Request $request, $id)
    {
        $supplier = $request->user()->supplier;
        $product = Product::where('id', $id)->where('supplier_id', $supplier->id)->firstOrFail();

        $validated = $request->validate([
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $product->update(['stock_quantity' => $validated['stock_quantity']]);

        return response()->json(['message' => 'Stock updated', 'product' => $product]);
    }

    public function orders(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        // Supplier sees items that belong to them in confirmed orders
        $items = \App\Models\OrderItem::supplier($supplier->id)
            ->whereHas('order', function ($q) {
                $q->where(function ($q2) {
                    $q2->whereIn('payment_status', ['paid', 'pending'])
                        ->where('order_status', '!=', 'initiated');
                })->orWhere('payment_status', 'failed');
            })
            // Order newest orders first
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->orderByDesc('orders.created_at')
            ->orderByDesc('order_items.id')
            ->select('order_items.*')
            ->with(['order.school', 'product'])
            ->get();

        return \App\Http\Resources\OrderItemResource::collection($items);
    }

    public function dispatchOrder(Request $request, $orderId)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        // This endpoint will dispatch ALL items belonging to THIS supplier in THIS order
        $items = \App\Models\OrderItem::where('order_id', $orderId)
            ->supplier($supplier->id)
            ->get();

        if ($items->isEmpty()) {
            return response()->json(['error' => 'No items in this order belong to you'], 403);
        }

        $tracking = $request->input('tracking_number');
        $courier = $request->input('courier_name');
        $providerId = $request->input('shipping_provider_id');

        /** @var \App\Models\OrderItem $item */
        foreach ($items as $item) {
            $updateData = [
                'fulfillment_status' => 'dispatched',
                'tracking_number' => $tracking ?: $item->tracking_number,
                'courier_name' => $courier ?: $item->courier_name,
                'shipping_provider_id' => $providerId ?: $item->shipping_provider_id,
            ];

            // Try automatic shipment only if no tracking info is provided
            if (!$updateData['tracking_number']) {
                try {
                    $logistics = app(\App\Services\LogisticsService::class);
                    $shipment = $logistics->createShipment($item);
                    if ($shipment) {
                        $updateData['tracking_number'] = $shipment['awb_code'] ?: $shipment['shipment_id'];
                        $updateData['courier_name'] = $shipment['courier_name'];
                    }
                } catch (\Exception $e) {
                    Log::error("Automatic shipment failed: " . $e->getMessage());
                }
            }

            $item->update($updateData);
        }

        // Update overall order status
        $totalItems = \App\Models\OrderItem::where('order_id', $orderId)->count();
        $dispatchedItems = \App\Models\OrderItem::where('order_id', $orderId)
            ->where('fulfillment_status', 'dispatched')
            ->count();

        $order = $items->first()->order;
        if ($totalItems === $dispatchedItems) {
            $order->update([
                'supplier_status' => 'dispatched',
                'delivery_status' => 'shipped',
            ]);
        } else {
            $order->update([
                'supplier_status' => 'partially_dispatched',
                'delivery_status' => 'processing',
            ]);
        }

        return response()->json([
            'message' => 'Items dispatched successfully',
            'order_status' => $order->supplier_status,
            'is_fully_dispatched' => ($totalItems === $dispatchedItems)
        ]);
    }

    /**
     * Assign AWB (optional courier_id; null = Shiprocket auto-assign like their dashboard), pickup, update order.
     *
     * @return array{success: bool, awb?: string, courier?: string, error?: string, details?: mixed}
     */
    private function runShiprocketAwbDispatch(\App\Models\OrderItem $item, ?int $courierId): array
    {
        if (!$item->shiprocket_shipment_id) {
            return ['success' => false, 'error' => 'No Shiprocket Shipment ID'];
        }

        $logistics = app(\App\Services\LogisticsService::class);
        $awbRes = $logistics->assignAWB($item, $item->shiprocket_shipment_id, $courierId);
        $body = $awbRes['response'] ?? [];
        $data = $body['data'] ?? ($body['response']['data'] ?? []);
        $awb = $data['awb_code'] ?? null;
        $courier = $data['courier_name'] ?? ($data['courier_company_name'] ?? 'Shiprocket');
        $ok = ($body['status'] ?? null) === 1 || ($body['success'] ?? null) === true || !empty($awb);
        if (!$ok || empty($awb)) {
            return ['success' => false, 'error' => 'AWB assignment failed', 'details' => $awbRes];
        }

        $logistics->requestPickup($item, $item->shiprocket_shipment_id);

        $item->update([
            'fulfillment_status' => 'dispatched',
            'tracking_number' => $awb,
            'courier_name' => $courier,
        ]);

        $order = $item->order()->first();
        if ($order) {
            $totalItems = $order->items()->count();
            $dispatchedItems = $order->items()->where('fulfillment_status', 'dispatched')->count();

            if ($totalItems === $dispatchedItems) {
                $order->update(['supplier_status' => 'dispatched', 'delivery_status' => 'shipped']);
            } else {
                $order->update(['supplier_status' => 'partially_dispatched', 'delivery_status' => 'processing']);
            }
        }

        return ['success' => true, 'awb' => $awb, 'courier' => $courier];
    }

    /**
     * One action: create Shiprocket shipment (if needed) + AWB assign with Shiprocket auto courier + pickup.
     * Matches the strategy used in the Shiprocket web panel (assign/awb without courier_id).
     */
    public function shiprocketShipAndDispatch(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)
            ->supplier($supplier->id)
            ->with(['product.supplier', 'order'])
            ->firstOrFail();

        if ($item->fulfillment_status === 'dispatched') {
            return response()->json(['error' => 'Already dispatched'], 422);
        }

        $logistics = app(\App\Services\LogisticsService::class);

        if (!$item->shiprocket_shipment_id) {
            $created = $logistics->createShipment($item);
            if (!$created || !isset($created['shipment_id'])) {
                Log::error('shiprocketShipAndDispatch: createShipment failed', ['item_id' => $orderItemId, 'res' => $created]);

                return response()->json(['error' => 'Failed to create Shiprocket shipment.', 'details' => $created], 500);
            }
            $item->update([
                'shiprocket_shipment_id' => (string) $created['shipment_id'],
                'shiprocket_order_id' => (string) ($created['order_id'] ?? ''),
            ]);
            $item->refresh();
        }

        // Auto-pick the cheapest courier, then assign AWB with that courier.
        $svc = $logistics->fetchCourierServiceability($item, $item->shiprocket_shipment_id);
        $cheapest = $svc['cheapest_courier'] ?? null;
        $courierId = is_array($cheapest) ? (int) ($cheapest['courier_company_id'] ?? 0) : 0;
        $out = $this->runShiprocketAwbDispatch($item, $courierId > 0 ? $courierId : null);
        if (!$out['success']) {
            return response()->json([
                'error' => $out['error'] ?? 'Fulfillment failed',
                'details' => $out['details'] ?? null,
            ], 500);
        }

        return response()->json([
            'message' => 'Shiprocket shipment dispatched with cheapest available courier.',
            'awb' => $out['awb'],
            'courier' => $out['courier'],
            'shipment_id' => $item->shiprocket_shipment_id,
            'shiprocket_order_id' => $item->shiprocket_order_id,
        ]);
    }

    public function shiprocketCreateOrder(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)->supplier($supplier->id)->firstOrFail();

        $logistics = app(\App\Services\LogisticsService::class);
        $result = $logistics->createShipment($item);

        if (!$result || !isset($result['shipment_id'])) {
            Log::error("Failed to create Shiprocket shipment", ['item_id' => $orderItemId, 'res' => $result]);
            return response()->json(['error' => 'Failed to create Shiprocket order. Check configuration.'], 500);
        }

        $item->update([
            'shiprocket_shipment_id' => (string) $result['shipment_id'],
            'shiprocket_order_id' => (string) ($result['order_id'] ?? ''),
        ]);

        return response()->json([
            'message' => 'Shiprocket shipment created. Use auto-assign AWB or pick a courier in the fulfillment panel.',
            'shipment_id' => $result['shipment_id'],
            'order_id' => $result['order_id'] ?? null
        ]);
    }

    public function shiprocketServiceability(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)
            ->supplier($supplier->id)
            ->with(['product', 'order'])
            ->firstOrFail();

        if (!$item->shiprocket_shipment_id) {
            return response()->json(['error' => 'Order not created in Shiprocket yet.'], 400);
        }

        $logistics = app(\App\Services\LogisticsService::class);
        $payload = $logistics->fetchCourierServiceability($item, $item->shiprocket_shipment_id);

        // Do not expose courier list to suppliers; only show the cheapest choice (used for auto-ship).
        $payload['couriers'] = [];
        $payload['available_courier_companies'] = [];

        return response()->json($payload);
    }

    public function shiprocketFulfill(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)->supplier($supplier->id)->with('order')->firstOrFail();

        // Courier is auto-selected (cheapest). Supplier cannot override.

        if (!$item->shiprocket_shipment_id) {
            return response()->json(['error' => 'No Shiprocket Shipment ID'], 400);
        }

        $logistics = app(\App\Services\LogisticsService::class);
        $svc = $logistics->fetchCourierServiceability($item, $item->shiprocket_shipment_id);
        $cheapest = $svc['cheapest_courier'] ?? null;
        $courierId = is_array($cheapest) ? (int) ($cheapest['courier_company_id'] ?? 0) : 0;

        $out = $this->runShiprocketAwbDispatch($item, $courierId > 0 ? $courierId : null);
        if (!$out['success']) {
            return response()->json([
                'error' => $out['error'] ?? 'AWB assignment failed',
                'details' => $out['details'] ?? null,
            ], 500);
        }

        return response()->json([
            'message' => 'Shipment fulfilled successfully!',
            'awb' => $out['awb'],
            'courier' => $out['courier'],
        ]);
    }

    /**
     * Supplier cancels local fulfillment + cancels on Shiprocket (if already created).
     * This prevents pickup/AWB flow from proceeding.
     */
    public function shiprocketCancel(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)
            ->supplier($supplier->id)
            ->with(['product', 'order'])
            ->firstOrFail();

        if ($item->fulfillment_status === 'cancelled') {
            return response()->json(['error' => 'Already cancelled'], 422);
        }

        if (empty($item->shiprocket_order_id)) {
            return response()->json(['error' => 'No Shiprocket order exists for this item.'], 422);
        }

        $logistics = app(\App\Services\LogisticsService::class);
        $srRes = null;
        $srRes = $logistics->cancelShiprocketOrder($item);
        if (!($srRes['ok'] ?? false)) {
            $srBody = $srRes['response'] ?? null;
            $srMsg = is_array($srBody)
                ? ($srBody['message'] ?? $srBody['msg'] ?? $srBody['error'] ?? null)
                : null;
            return response()->json([
                'error' => $srMsg ? ('Shiprocket cancellation failed: ' . $srMsg) : 'Shiprocket cancellation failed',
                'details' => $srRes,
            ], 500);
        }

        $item->update([
            'fulfillment_status' => 'cancelled',
            'tracking_number' => null,
            'courier_name' => null,
        ]);

        // Update parent order statuses based on remaining active items
        $order = $item->order;
        if ($order) {
            $active = $order->items()->whereNotIn('fulfillment_status', ['cancelled'])->count();
            if ($active === 0) {
                $order->update([
                    'supplier_status' => 'cancelled',
                    'delivery_status' => 'cancelled',
                    'order_status' => 'cancelled',
                ]);
            } else {
                $order->update([
                    'supplier_status' => 'partially_cancelled',
                    'delivery_status' => 'processing',
                ]);
            }
        }

        return response()->json([
            'message' => 'Shipment cancelled successfully.',
            'shiprocket' => $srRes,
        ]);
    }

    /**
     * Supplier cancels the order item locally (no Shiprocket call).
     * Use this when the order was never pushed to Shiprocket.
     */
    public function cancelOrderItem(Request $request, $orderItemId)
    {
        $supplier = $request->user()->supplier;
        $item = \App\Models\OrderItem::where('id', $orderItemId)
            ->supplier($supplier->id)
            ->with('order')
            ->firstOrFail();

        if ($item->fulfillment_status === 'dispatched') {
            return response()->json(['error' => 'Already dispatched. Cannot cancel.'], 422);
        }

        if (!empty($item->shiprocket_order_id)) {
            return response()->json(['error' => 'This item has a Shiprocket order. Use shiprocket cancel.'], 422);
        }

        $item->update([
            'fulfillment_status' => 'cancelled',
        ]);

        $order = $item->order;
        if ($order) {
            $active = $order->items()->whereNotIn('fulfillment_status', ['cancelled'])->count();
            if ($active === 0) {
                $order->update([
                    'supplier_status' => 'cancelled',
                    'delivery_status' => 'cancelled',
                    'order_status' => 'cancelled',
                ]);
            } else {
                $order->update([
                    'supplier_status' => 'partially_cancelled',
                    'delivery_status' => 'processing',
                ]);
            }
        }

        return response()->json(['message' => 'Order item cancelled successfully.']);
    }

    public function reports(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $totalSku = Product::where('supplier_id', $supplier->id)->count();

        $pendingOrders = \App\Models\OrderItem::whereHas('product', function ($q) use ($supplier) {
            $q->where('supplier_id', $supplier->id);
        })->whereHas('order', function ($q) {
            $q->where('supplier_status', 'pending')
                ->whereIn('payment_status', ['paid', 'pending']);
        })->count();

        $dispatchedCount = \App\Models\OrderItem::whereHas('product', function ($q) use ($supplier) {
            $q->where('supplier_id', $supplier->id);
        })->whereHas('order', function ($q) {
            $q->where('supplier_status', 'dispatched')
                ->whereIn('payment_status', ['paid', 'pending']);
        })->count();

        $topProducts = \App\Models\OrderItem::whereHas('product', function ($q) use ($supplier) {
            $q->where('supplier_id', $supplier->id);
        })->whereHas('order', function ($q) {
            $q->whereIn('payment_status', ['paid', 'pending']);
        })
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select('products.name', \Illuminate\Support\Facades\DB::raw('sum(order_items.quantity) as total_sold'))
            ->groupBy('products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'total_sku' => $totalSku,
            'pending_orders' => $pendingOrders,
            'dispatched_count' => $dispatchedCount,
            'top_products' => $topProducts,
        ]);
    }

    public function schoolSetups(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier)
            return response()->json(['error' => 'Not a supplier'], 403);

        // Get schools that have at least one product from this supplier
        $schools = \App\Models\School::whereHas('schoolProducts', function ($q) use ($supplier) {
            $q->whereHas('product', function ($sq) use ($supplier) {
                $sq->where('supplier_id', $supplier->id);
            });
        })->get();

        return \App\Http\Resources\SchoolResource::collection($schools);
    }

    public function schoolCatalog(Request $request, $schoolId)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier)
            return response()->json(['error' => 'Not a supplier'], 403);

        $schoolProducts = \App\Models\SchoolProduct::where('school_id', $schoolId)
            ->whereHas('product', function ($q) use ($supplier) {
                $q->where('supplier_id', $supplier->id);
            })
            ->with(['product.category', 'product.supplier'])
            ->get();

        return response()->json($schoolProducts->map(function ($sp) {
            return [
                'id' => $sp->id,
                'name' => $sp->product->name,
                'category' => $sp->product->category->name,
                'required_qty' => $sp->required_qty,
                'rendered_images' => collect($sp->rendered_images ?: [])->map(fn($img) => ProductResource::normalizeStoragePath($img))->all(),
            ];
        }));
    }

    public function schoolSetupDetails(Request $request, $schoolProductId)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier)
            return response()->json(['error' => 'Not a supplier'], 403);

        $sp = \App\Models\SchoolProduct::with(['product.category', 'product.supplier', 'school'])
            ->findOrFail($schoolProductId);

        if ($sp->product->supplier_id !== $supplier->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $productData = (new \App\Http\Resources\ProductResource($sp->product))->resolve();

        return response()->json([
            'id' => $sp->id,
            'school' => $sp->school,
            'product' => $productData,
            'school_margin' => $sp->school_margin,
            'required_qty' => $sp->required_qty,
            'rendered_images' => collect($sp->rendered_images ?: [])->map(fn($img) => ProductResource::normalizeStoragePath($img))->all(),
            'created_at' => $sp->created_at,
        ]);
    }

    public function trackShipment($awb)
    {
        $logistics = app(\App\Services\LogisticsService::class);
        $tracking = $logistics->trackShipment($awb);

        if (!$tracking) {
            return response()->json(['error' => 'Tracking information not available or Shiprocket account is not configured.'], 404);
        }

        return response()->json($tracking);
    }

    public function getShipmentLabel($shipmentId)
    {
        if (!preg_match('/^\d+$/', (string) $shipmentId)) {
            return response()->json(['error' => 'Invalid shipment id.'], 422);
        }
        $logistics = app(\App\Services\LogisticsService::class);
        $labelUrl = $logistics->generateLabel($shipmentId);

        if (!$labelUrl) {
            return response()->json(['error' => 'Label generation failed. Check if shipment ID is valid and Shiprocket is configured.'], 500);
        }

        return response()->json(['label_url' => $labelUrl]);
    }

    public function savePickupLocation(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) {
            return response()->json(['error' => 'Not a registered supplier'], 403);
        }

        $validated = $request->validate([
            'pickup_location' => 'required|string|max:50', // This is the nickname/ID
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'address_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'pin_code' => 'required|string|max:20',
        ]);

        if (empty($validated['address_2'])) {
            unset($validated['address_2']);
        }

        try {
            $logistics = app(\App\Services\LogisticsService::class);
            $result = $logistics->addPickupLocation($supplier, $validated);

            $supplier->refresh();

            return response()->json([
                'message' => 'Pickup location saved successfully in Shiprocket',
                'data' => $result,
                'pickup_snapshot' => $supplier->shiprocket_pickup_snapshot,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }
    public function getNotifications(Request $request)
    {
        $supplier = $request->user()->supplier;
        if (!$supplier) return response()->json([]);

        // Latest orders containing this supplier's products
        $latestOrders = Order::where('payment_status', 'paid')
            ->whereHas('items', function($q) use ($supplier) {
                $q->whereHas('product', function($pq) use ($supplier) {
                    $pq->where('supplier_id', $supplier->id);
                });
            })
            ->with(['items' => function($q) use ($supplier) {
                $q->whereHas('product', function($pq) use ($supplier) {
                    $pq->where('supplier_id', $supplier->id);
                });
            }])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $lowStockProducts = Product::where('supplier_id', $supplier->id)
            ->where('status', 'active')
            ->where(function($query) {
                $query->whereRaw('stock_quantity <= low_stock_threshold')
                      ->orWhere('stock_quantity', '<', 10);
            })
            ->orderBy('stock_quantity', 'asc')
            ->limit(5)
            ->get();

        $notifications = [];

        foreach ($latestOrders as $order) {
            $notifications[] = [
                'id' => 'order_' . $order->id,
                'type' => 'order',
                'title' => 'New Shipment Order',
                'message' => 'Order #' . $order->order_number . ' requires fulfillment.',
                'link' => '/supplier/orders',
                'created_at' => $order->created_at->diffForHumans()
            ];
        }

        foreach ($lowStockProducts as $product) {
            $notifications[] = [
                'id' => 'stock_' . $product->id,
                'type' => 'stock',
                'title' => 'Stock Alert: ' . $product->name,
                'message' => 'Current stock: ' . $product->stock_quantity . '. Please restock soon.',
                'link' => '/supplier/inventory',
                'created_at' => $product->updated_at->diffForHumans()
            ];
        }

        return response()->json($notifications);
    }
    public function markNotificationsRead(Request $request)
    {
        return response()->json(['message' => 'All marked as read']);
    }
}
