<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'payment_status' => $this->payment_status,
            'order_status' => $this->order_status,
            'delivery_status' => $this->delivery_status,
            'supplier_status' => $this->supplier_status ?? null,
            'total_amount' => $this->total_amount,
            'transaction_id' => $this->transaction_id ?? null,
            'payment_provider' => $this->payment_provider ?? null,
            'payment_method' => $this->payment_method ?? 'online',
            'shipping_address' => $this->shipping_address,
            'created_at' => $this->created_at->toIso8601String(),

            'user' => $this->whenLoaded('customer', fn() => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ]),

            'customer' => $this->whenLoaded('customer', fn() => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ]),

            'school' => $this->whenLoaded('school', fn() => [
                'id' => $this->school?->id,
                'name' => $this->school?->name,
            ]),

            'items' => $this->whenLoaded('items', function () {
                return OrderItemResource::collection($this->items);
            }),

            // legacy key kept as string for react rendering
            'status' => $this->order_status,
            'status_details' => [
                'payment' => $this->payment_status,
                'order' => $this->order_status,
                'delivery' => $this->delivery_status,
            ],
        ];
    }
}
