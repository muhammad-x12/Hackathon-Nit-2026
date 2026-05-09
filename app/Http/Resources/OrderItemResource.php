<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /** @var array<string, array<string,mixed>|null> */
    private static array $schoolProductCache = [];

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fulfillment = (string) ($this->fulfillment_status ?? '');
        $isDispatched = $fulfillment === 'dispatched';
        $isCancelled = $fulfillment === 'cancelled';
        $hasShiprocket = !empty($this->shiprocket_order_id);
        // Shiprocket cancellations are allowed up to the point Shiprocket refuses (e.g. after pickup).
        // So we expose the cancel button for any Shiprocket-created item unless already cancelled locally.
        $canCancelShiprocket = $hasShiprocket && !$isCancelled;
        // Local-only cancellations should remain blocked once marked dispatched.
        $canCancelLocal = !$hasShiprocket && !$isDispatched && !$isCancelled;

        $orderSchoolId = $this->order?->school_id;
        $schoolProduct = null;
        if ($orderSchoolId && $this->product_id) {
            $cacheKey = $orderSchoolId . ':' . $this->product_id;
            if (!array_key_exists($cacheKey, self::$schoolProductCache)) {
                $sp = \App\Models\SchoolProduct::query()
                    ->where('school_id', $orderSchoolId)
                    ->where('product_id', $this->product_id)
                    ->first();
                self::$schoolProductCache[$cacheKey] = $sp ? $sp->toArray() : null;
            }
            $schoolProduct = self::$schoolProductCache[$cacheKey];
        }

        $originalImages = (function () {
            $imgs = $this->product?->images ?? [];
            if (is_string($imgs)) {
                $decoded = json_decode($imgs, true);
                $imgs = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($imgs)) {
                $imgs = [];
            }
            return collect($imgs)
                ->map(fn ($p) => ProductResource::normalizeStoragePath((string) $p))
                ->filter()
                ->values()
                ->all();
        })();

        $customization = $this->customization_data ? json_decode($this->customization_data, true) : null;
        $renderedImages = (function () use ($customization, $schoolProduct) {
            $imgs = [];
            if (is_array($customization) && !empty($customization['rendered_images']) && is_array($customization['rendered_images'])) {
                $imgs = $customization['rendered_images'];
            } elseif (is_array($schoolProduct) && !empty($schoolProduct['rendered_images']) && is_array($schoolProduct['rendered_images'])) {
                $imgs = $schoolProduct['rendered_images'];
            }
            return collect($imgs)
                ->map(fn ($p) => ProductResource::normalizeStoragePath((string) $p))
                ->filter()
                ->values()
                ->all();
        })();

        $schoolUploadedImage = null;
        if (is_array($schoolProduct) && !empty($schoolProduct['custom_logo_path'])) {
            $schoolUploadedImage = ProductResource::normalizeStoragePath((string) $schoolProduct['custom_logo_path']);
        }

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name ?? 'Unknown', 
            'product_image' => (function() {
                $imgs = $this->product?->images ?? [];
                if (is_string($imgs)) {
                    $decoded = json_decode($imgs, true);
                    $imgs = is_array($decoded) ? $decoded : [];
                }
                if (!empty($imgs[0])) {
                    return ProductResource::normalizeStoragePath($imgs[0]);
                }
                return null;
            })(),
            'product' => $this->whenLoaded('product', function () {
                return new ProductResource($this->product);
            }),
            'quantity' => $this->quantity,
            'fulfillment_status' => $this->fulfillment_status,
            'shiprocket_shipment_id' => $this->shiprocket_shipment_id,
            'shiprocket_order_id' => $this->shiprocket_order_id,
            'tracking_number' => $this->tracking_number,
            'courier_name' => $this->courier_name,
            // Frontend helpers for supplier panel buttons
            'can_cancel_shiprocket' => $canCancelShiprocket,
            'can_cancel_order_item' => $canCancelLocal,
            'tracking_url' => (function () {
                if (empty($this->tracking_number))
                    return null;
                $slug = $this->provider?->slug ?? strtolower($this->courier_name ?? '');
                if (str_contains($slug, 'shiprocket'))
                    return "https://www.shiprocket.in/shipment-tracking/{$this->tracking_number}";
                if (str_contains($slug, 'delhivery'))
                    return "https://www.delhivery.com/track/package/{$this->tracking_number}";
                return null;
            })(),
            'price' => $this->final_price,
            'subtotal' => $this->final_price * $this->quantity,
            'customization' => $customization,

            // Extra images for supplier modal
            'original_images' => $originalImages,
            'rendered_images' => $renderedImages,
            'school_uploaded_image' => $schoolUploadedImage,
            // If called from Supplier view, maybe include Order context?
            'order' => $this->whenLoaded('order', function () {
                // Return minimal order info or full resource? avoid infinite recursion.
                return [
                    'id' => $this->order->id,
                    'order_number' => $this->order->order_number,
                    'status' => $this->order->order_status,
                    'payment_status' => $this->order->payment_status,
                    'payment_provider' => $this->order->payment_provider,
                    'payment_method' => $this->order->payment_method,
                    'transaction_id' => $this->order->transaction_id,
                    'total_amount' => $this->order->total_amount,
                    'supplier_status' => $this->order->supplier_status,
                    'delivery_status' => $this->order->delivery_status,
                    'created_at' => $this->order->created_at,
                    'shipping_address' => $this->order->shipping_address,
                    'school' => $this->order->relationLoaded('school') && $this->order->school ? [
                        'id' => $this->order->school->id,
                        'name' => $this->order->school->name,
                    ] : null,
                ];
            }),
        ];
    }
}
