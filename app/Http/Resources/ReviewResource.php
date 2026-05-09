<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'user_id' => $this->user_id,
            'school_id' => $this->school_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'is_approved' => $this->is_approved,
            'guest_name' => $this->guest_name,
            'created_at' => $this->created_at,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'product' => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'images' => collect($this->product->images ?? [])->map(function($img) {
                    return ProductResource::normalizeStoragePath($img);
                })->toArray(),
            ] : null,
            'school' => $this->school ? [
                'id' => $this->school->id,
                'name' => $this->school->name,
            ] : null,
        ];
    }
}
