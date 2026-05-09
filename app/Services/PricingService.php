<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SchoolProduct;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PricingService
{
    protected $platformServiceCharge;
    protected $deliveryCharges;
    protected $logisticsService;

    public function __construct(LogisticsService $logisticsService)
    {
        $this->logisticsService = $logisticsService;
        $this->loadSettings();
    }
    protected function loadSettings()
    {
        // Cache settings for 60 minutes
        $settings = Cache::remember('platform_settings', 3600, function () {
            return PlatformSetting::pluck('value', 'key')->toArray();
        });

        $this->platformServiceCharge = $settings['platform_service_charge'] ?? 0;
        $this->deliveryCharges = $settings['delivery_charges'] ?? 50; // Default 50
    }

    protected function customRound($amount)
    {
        $decimal = $amount - floor($amount);
        if ($decimal > 0 && $decimal <= 0.5) {
            return floor($amount);
        }
        return round($amount);
    }

    /**
     * @param  int  $shippingQuantity  Line qty: Shiprocket uses total weight (unit × qty); delivery in the breakdown is per unit (total ÷ qty).
     * @param  float|null  $lineWeightOverrideKg  Total kg for the line (same as checkout calculate-shipping); overrides product weight × qty when set.
     */
    public function calculateParams(
        Product $product,
        ?SchoolProduct $schoolProduct = null,
        ?string $destinationPincode = null,
        bool $isCod = false,
        int $shippingQuantity = 1,
        ?float $lineWeightOverrideKg = null,
        bool $includeDeliveryInFinalPrice = true,
        array $options = [],
        ?float $length = null,
        ?float $width = null,
        ?float $height = null
    )
    {
        $supplierCost = (float) $product->base_price;
        $variantDelta = $this->variantDelta($product, $options);
        $supplierCost = max(0.0, $supplierCost + $variantDelta);
        $marginPercentage = $schoolProduct ? (float) $schoolProduct->school_margin : 0.00;
        $schoolMargin = ($supplierCost * ($marginPercentage / 100));

        // Platform service charge (Platform Margin)
        $globalPlatformCharge = (float) $this->platformServiceCharge;

        // Category-specific platform charges
        $categoryCharge = 0;
        $cat = $product->subcategory ?: $product->category;
        if ($cat && $cat->platform_charge > 0) {
            $categoryCharge = (float) $cat->platform_charge;
        }

        // Platform margin is the global platform charge + category-specific charge.
        $totalPlatformMargin = max(0.0, $globalPlatformCharge) + max(0.0, $categoryCharge);
        
        \Log::debug("Pricing Calc [Product #{$product->id}]:", [
            'base' => $supplierCost,
            'school_margin_perc' => $marginPercentage,
            'school_margin_calc' => $schoolMargin,
            'global_platform_charge' => $globalPlatformCharge,
            'cat_platform_charge' => $categoryCharge,
            'platform_margin_total' => $totalPlatformMargin,
        ]);

        // GST is determined ONLY by Category.
        // - If subcategory exists, it inherits GST from its parent category.
        // - No product-level GST is applied.
        //
        // Ensure relations are available
        if (!$product->relationLoaded('category') || !$product->relationLoaded('subcategory')) {
            $product->loadMissing(['category', 'subcategory']);
        }

        $gstRate = 0.0;
        $cat = $product->category;
        // If product has a subcategory, GST should come from the parent category.
        if ($product->subcategory && $product->subcategory->parent_id) {
            $cat = $product->category;
        }
        if ($cat && (float) $cat->gst_percentage > 0) {
            $gstRate = (float) $cat->gst_percentage;
        }

        $taxableBase = $supplierCost + $totalPlatformMargin + $schoolMargin;
        $gstAmount = ($taxableBase * ($gstRate / 100));

        \Log::debug("Pricing Calc Result:", [
            'taxable_base' => $taxableBase,
            'gst_rate' => $gstRate,
            'gst_amount' => $gstAmount,
            'final' => ($taxableBase + $gstAmount)
        ]);

        // Base (no delivery): (Supplier Cost + Platform Margin + School Margin + GST)
        $baseWithoutDelivery = ($taxableBase + $gstAmount);

        // Delivery quote: quote one shipment for the full line weight, then allocate per unit.
        // IMPORTANT: if destination pincode is not known, do NOT add delivery to customer-visible product price.
        // (Checkout will pass destination pincode and include it.)
        $qty = max(1, $shippingQuantity);
        $totalDelivery = null;
        $delivery = 0.0;
        if (!empty($destinationPincode)) {
            $totalDelivery = (float) $this->logisticsService->calculateShipping($product, $destinationPincode, $isCod, $qty, $lineWeightOverrideKg, $length, $width, $height);
            $delivery = $totalDelivery / $qty;
        }

        // "Final" may or may not include delivery depending on context (browse vs checkout)
        $rawFinal = $includeDeliveryInFinalPrice ? ($baseWithoutDelivery + $delivery) : $baseWithoutDelivery;

        // Apply custom rounding: 12.1-12.5 -> 12, others -> 13
        $roundedFinal = (float) $this->customRound($rawFinal);

        // Payable price: always base + delivery (when quoted). Useful for customer UI.
        $rawPayable = $baseWithoutDelivery + $delivery;
        $roundedPayable = (float) $this->customRound($rawPayable);

        return [
            'base_price' => $supplierCost,
            'supplier_cost' => $supplierCost,
            'variant_delta' => $variantDelta,
            'platform_margin' => $totalPlatformMargin,
            'school_margin' => $schoolMargin,
            'gst_percentage' => $gstRate,
            'gst_amount' => round($gstAmount, 2),
            'delivery_charges' => $delivery,
            'taxable_base' => $taxableBase,
            'raw_final_price' => $rawFinal,
            'final_price' => $roundedFinal,
            // Customer-facing: shows base initially, then base+shipping once pincode is known
            'raw_payable_price' => $rawPayable,
            'payable_price' => $roundedPayable,
            'shipping_total_for_line' => $totalDelivery, // null when not quoted
            'mrp' => $roundedFinal,
        ];
    }

    /**
     * Compute delta to apply on top of base_price based on size/color.
     * Expects Product.variant_price_adjustments like:
     * { size: { "S": -10, "M": 0 }, color: { "Red": 20 } }
     */
    protected function variantDelta(Product $product, array $options): float
    {
        $adj = $product->variant_price_adjustments ?? null;
        if (!is_array($adj)) return 0.0;

        $delta = 0.0;

        $size = isset($options['size']) ? trim((string) $options['size']) : '';
        $color = isset($options['color']) ? trim((string) $options['color']) : '';

        if ($size !== '' && isset($adj['size']) && is_array($adj['size'])) {
            $map = $adj['size'];
            $delta += (float) ($this->lookupVariantDelta($map, $size) ?? 0);
        }
        if ($color !== '' && isset($adj['color']) && is_array($adj['color'])) {
            $map = $adj['color'];
            $delta += (float) ($this->lookupVariantDelta($map, $color) ?? 0);
        }

        return round($delta, 2);
    }

    protected function lookupVariantDelta(array $map, string $key): ?float
    {
        // direct
        if (array_key_exists($key, $map)) return is_numeric($map[$key]) ? (float) $map[$key] : null;

        $k = mb_strtolower(trim($key));
        foreach ($map as $label => $value) {
            if (mb_strtolower(trim((string) $label)) === $k) {
                return is_numeric($value) ? (float) $value : null;
            }
        }
        return null;
    }

    /**
     * Total shipping for a cart line (Shiprocket weight = unit × quantity unless overridden).
     */
    public function quoteShippingForCartLine(Product $product, string $pincode, int $quantity, bool $isCod = false, ?float $lineWeightKg = null, ?float $length = null, ?float $width = null, ?float $height = null): float
    {
        return (float) $this->logisticsService->calculateShipping(
            $product,
            $pincode,
            $isCod,
            max(1, $quantity),
            $lineWeightKg,
            $length,
            $width,
            $height
        );
    }

    /**
     * @return array{charge: float, expected_delivery_by: string|null, expected_delivery_days: int|null}
     */
    public function quoteShippingQuoteForCartLine(Product $product, string $pincode, int $quantity, bool $isCod = false, ?float $lineWeightKg = null, ?float $length = null, ?float $width = null, ?float $height = null): array
    {
        return $this->logisticsService->calculateShippingQuote(
            $product,
            $pincode,
            $isCod,
            max(1, $quantity),
            $lineWeightKg,
            $length,
            $width,
            $height
        );
    }
}
