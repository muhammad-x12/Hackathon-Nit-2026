<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\SchoolProduct;
use App\Services\PricingService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $pricingService;

    public function __construct(PricingService $pricingService)
    {
        $this->pricingService = $pricingService;
    }


    public function index(Request $request)
    {
        $school = $request->get('school');

        // Helper to get all descendant category IDs
        $getDescendantIds = function ($catId) {
            $ids = [$catId];
            $children = \App\Models\Category::where('parent_id', $catId)->pluck('id')->toArray();
            while (!empty($children)) {
                $ids = array_merge($ids, $children);
                $children = \App\Models\Category::whereIn('parent_id', $children)->pluck('id')->toArray();
            }
            return array_unique($ids);
        };

        if (!$school) {
            // Main domain access - list products directly from Product model
            $query = \App\Models\Product::query()->with(['category', 'subcategory', 'supplier.shippingConfigs.provider']);

            if ($request->has('for_schools')) {
                $query->where('for_schools_only', $request->boolean('for_schools'));
            }

            if ($request->has('supplier_id')) {
                $query->where('supplier_id', $request->query('supplier_id'));
            }

            if ($request->has('category_id')) {
                $catIds = $getDescendantIds($request->query('category_id'));
                $query->where(function ($q) use ($catIds) {
                    $q->whereIn('category_id', $catIds)
                        ->orWhereIn('subcategory_id', $catIds);
                });
            }

            if ($request->has('subcategory_id')) {
                $query->where('subcategory_id', $request->query('subcategory_id'));
            }

            // Support filtering by category name
            if ($request->has('category') && !$request->has('category_id')) {
                $query->whereHas('category', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->query('category') . '%');
                });
            }

            if ($request->has('min_qty')) {
                $query->where('min_quantity', '>=', $request->query('min_qty'));
            }

            if ($request->has('max_qty')) {
                $query->where('max_quantity', '<=', $request->query('max_qty'));
            }

            $results = $query->paginate(100);
            $results->getCollection()->transform(function ($product) {
                // Customer-side: Pricing is base-only on index/list (no shipping). Pincode is ignored here.
                $pricing = $this->pricingService->calculateParams($product, null, null, false, 1, null, false);
                $product->pricing = $pricing;
                return new \App\Http\Resources\ProductResource($product);
            });

            return $results;
        }

        $query = SchoolProduct::query()
            ->with(['product.category', 'product.subcategory', 'product.supplier.shippingConfigs.provider'])
            ->where('school_id', $school->id)
            ->where('is_active', true)
            ->whereHas('product', function ($q) {
                $q->where('status', 'active');
            });

        if ($request->has('category_id')) {
            $catIds = $getDescendantIds($request->query('category_id'));
            $query->whereHas('product', function ($q) use ($catIds) {
                $q->where(function ($sq) use ($catIds) {
                    $sq->whereIn('category_id', $catIds)
                        ->orWhereIn('subcategory_id', $catIds);
                });
            });
        }

        if ($request->has('subcategory_id')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('subcategory_id', $request->query('subcategory_id'));
            });
        }

        $results = $query->paginate(100);

        // Transform the results to include calculated pricing and customization
        $results->getCollection()->transform(function ($schoolProduct) {
            // Customer-side (school subdomain): base price excludes shipping until checkout.
            $pricing = $this->pricingService->calculateParams($schoolProduct->product, $schoolProduct, null, false, 1, null, false);
            $schoolProduct->product->pricing = $pricing;

            // Attach school customization data
            $schoolProduct->product->school_customization = [
                'logo' => $schoolProduct->custom_logo_path ? ProductResource::normalizeStoragePath($schoolProduct->custom_logo_path) : null,
                'logo_position' => $schoolProduct->custom_logo_position,
                'text' => $schoolProduct->custom_text,
                'text_position' => $schoolProduct->custom_text_position,
                'required_qty' => $schoolProduct->required_qty,
                'rendered_images' => collect($schoolProduct->rendered_images ?: [])->map(fn($p) => ProductResource::normalizeStoragePath($p))->all(),
            ];

            return new \App\Http\Resources\ProductResource($schoolProduct->product);
        });

        return $results;
    }

    public function show(Request $request, $id)
    {
        $school = $request->get('school');
        if (!$school) {
            // Main domain - show product directly
            $product = \App\Models\Product::with(['category', 'subcategory', 'reviews.user'])->findOrFail($id);
            $pricing = $this->pricingService->calculateParams($product, null, null, false, 1, null, false);
            $product->pricing = $pricing;
            return new \App\Http\Resources\ProductResource($product);
        }

        $schoolProduct = SchoolProduct::with(['product.category', 'product.subcategory', 'product.reviews.user'])
            ->where('school_id', $school->id)
            ->where('product_id', $id)
            ->where('is_active', true)
            ->first();

        if (!$schoolProduct) {
            // If not mapped to school, allow viewing if it is a general product (not schools-only)
            $product = \App\Models\Product::with(['category', 'subcategory', 'reviews.user'])->findOrFail($id);
            if ($product->for_schools_only) {
                abort(404, "Product not available in this school's catalog.");
            }
            $pricing = $this->pricingService->calculateParams($product, null, null, false, 1, null, false);
            $product->pricing = $pricing;
            return new \App\Http\Resources\ProductResource($product);
        }

        $pricing = $this->pricingService->calculateParams($schoolProduct->product, $schoolProduct, null, false, 1, null, false);
        $schoolProduct->product->pricing = $pricing; // Dynamically attach calculation

        // Attach school customization data
        $schoolProduct->product->school_customization = [
            'logo' => $schoolProduct->custom_logo_path ? ProductResource::normalizeStoragePath($schoolProduct->custom_logo_path) : null,
            'logo_position' => $schoolProduct->custom_logo_position,
            'text' => $schoolProduct->custom_text,
            'text_position' => $schoolProduct->custom_text_position,
            'required_qty' => $schoolProduct->required_qty,
            'rendered_images' => collect($schoolProduct->rendered_images ?: [])->map(fn($p) => ProductResource::normalizeStoragePath($p))->all(),
        ];

        return new \App\Http\Resources\ProductResource($schoolProduct->product);
    }
}
