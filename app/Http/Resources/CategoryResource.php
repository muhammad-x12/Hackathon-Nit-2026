<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'image' => ProductResource::normalizeStoragePath($this->image),
            'image_url' => ProductResource::normalizeStoragePath($this->image), // Frontend uses both interchangeably
            'icon_svg' => $this->icon_svg,
            'parent_id' => $this->parent_id,
            'gst_percentage' => (float)($this->gst_percentage ?? 0),
            'sort_order' => (int)($this->sort_order ?? 0),
            'children' => CategoryResource::collection($this->children ?? []),
        ];
    }
}
