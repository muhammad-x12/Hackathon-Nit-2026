<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'abbreviation' => $this->abbreviation,
            'subdomain' => $this->subdomain,
            'logo' => ProductResource::normalizeStoragePath($this->logo),
            'school_banner' => ProductResource::normalizeStoragePath($this->school_banner),
            'academic_year' => $this->academic_year,
            'announcements' => $this->announcements,
            'address' => $this->address,
            'theme_color' => $this->theme_color,
            'contact_info' => is_string($this->contact_info) ? json_decode($this->contact_info, true) : $this->contact_info,
            'status' => $this->status,
            'commission_percentage' => $this->commission_percentage,
            'created_at' => $this->created_at,
        ];
    }
}
