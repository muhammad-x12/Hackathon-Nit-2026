<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingProvider;
use App\Models\AuthorityShippingConfig;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function getProviders()
    {
        return response()->json(ShippingProvider::where('is_active', true)->get());
    }

    public function getMyConfigs(Request $request)
    {
        $user = $request->user();

        // Owner is the supplier instance or the super_admin user
        $owner = $user->hasRole('supplier') ? $user->supplier : $user;

        if (!$owner) {
            return response()->json(['error' => 'No authority found'], 403);
        }

        $configs = AuthorityShippingConfig::where('owner_id', $owner->id)
            ->where('owner_type', get_class($owner))
            ->with('provider')
            ->get();

        return response()->json($configs);
    }

    public function saveConfig(Request $request)
    {
        $user = $request->user();
        $owner = $user->hasRole('supplier') ? $user->supplier : $user;

        if (!$owner) {
            return response()->json(['error' => 'No authority found'], 403);
        }

        $validated = $request->validate([
            'shipping_provider_id' => 'required|exists:shipping_providers,id',
            'credentials' => 'required|array',
            'is_enabled' => 'boolean',
        ]);

        $config = AuthorityShippingConfig::updateOrCreate(
            [
                'owner_id' => $owner->id,
                'owner_type' => get_class($owner),
                'shipping_provider_id' => $validated['shipping_provider_id'],
            ],
            [
                'credentials' => $validated['credentials'],
                'is_enabled' => $validated['is_enabled'] ?? true,
            ]
        );

        return response()->json(['message' => 'Shipping configuration saved', 'config' => $config]);
    }
}
