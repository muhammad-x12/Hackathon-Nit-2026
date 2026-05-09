<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\AuthorityShippingConfig;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LogisticsService
{
    /**
     * Get platform settings from cache or database.
     */
    protected function getSettings()
    {
        return Cache::remember('platform_settings', 3600, function () {
            return \App\Models\PlatformSetting::pluck('value', 'key')->all();
        });
    }

    /**
     * Calculate shipping charge for a product to a destination pincode.
     *
     * @param  int  $billableQuantity  Units in the line (Shiprocket is quoted on total weight = unit × qty).
     * @param  float|null  $totalWeightOverrideKg  Optional total kg for the line (overrides product weight × qty).
     */
    public function calculateShipping(
        Product $product,
        ?string $destinationPincode = null,
        bool $isCod = false,
        int $billableQuantity = 1,
        ?float $totalWeightOverrideKg = null,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): float {
        return $this->calculateShippingQuote(
            $product,
            $destinationPincode,
            $isCod,
            $billableQuantity,
            $totalWeightOverrideKg,
            $lengthOverride,
            $widthOverride,
            $heightOverride
        )['charge'];
    }

    /**
     * Shipping charge plus Shiprocket estimated delivery (when available).
     *
     * @return array{charge: float, expected_delivery_by: string|null, expected_delivery_days: int|null}
     */
    public function calculateShippingQuote(
        Product $product,
        ?string $destinationPincode = null,
        bool $isCod = false,
        int $billableQuantity = 1,
        ?float $totalWeightOverrideKg = null,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): array {
        $settings = $this->getSettings();
        $emptyEta = ['expected_delivery_by' => null, 'expected_delivery_days' => null, 'pickup_pincode' => null];
        $destinationPincode = $destinationPincode !== null && $destinationPincode !== ''
            ? preg_replace('/\D/', '', (string) $destinationPincode)
            : '';
        if (strlen($destinationPincode) !== 6) {
            return array_merge(['charge' => $this->shippingFallbackFromSettings($settings)], $emptyEta);
        }

        $supplier = $product->supplier;

        $config = null;
        if ($supplier) {
            if ($supplier->relationLoaded('shippingConfigs')) {
                $config = $supplier->shippingConfigs->where('is_enabled', true)->first();
            } else {
                $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
                    ->where('owner_type', Supplier::class)
                    ->where('is_enabled', true)
                    ->first();
            }
        }

        if (!$config) {
            $token = $this->getShiprocketToken(null, null);
            if ($token) {
                $pickup = $this->resolveShiprocketPickupPostcode($supplier, [], $token);
                if ($pickup === '110001') {
                    $settingsPickup = preg_replace('/\D/', '', (string) ($settings['shiprocket_pickup_pincode'] ?? $settings['pickup_pincode'] ?? '110001'));
                    if (strlen($settingsPickup) === 6 && $settingsPickup !== '110001') {
                        $pickup = $settingsPickup;
                    }
                }
                $detail = $this->quoteShiprocketServiceabilityDetail(
                    $token,
                    $pickup,
                    $product,
                    $destinationPincode,
                    $isCod ? 1 : 0,
                    max(1, $billableQuantity),
                    $totalWeightOverrideKg,
                    $lengthOverride,
                    $widthOverride,
                    $heightOverride
                );
                if ($detail !== null) {
                    return [
                        'charge' => $detail['shipping_charge'],
                        'expected_delivery_by' => $detail['expected_delivery_by'],
                        'expected_delivery_days' => $detail['expected_delivery_days'],
                        'courier_name' => $detail['courier_name'] ?? null,
                        'pickup_pincode' => $pickup,
                    ];
                }
            }

            return array_merge(['charge' => $this->shippingFallbackFromSettings($settings), 'courier_name' => null], $emptyEta);
        }

        $provider = $config->relationLoaded('provider') ? $config->provider : $config->provider;

        return match ($provider->slug) {
            'shiprocket' => $this->calculateShiprocketQuote(
                $config,
                $product,
                $destinationPincode,
                $isCod ? 1 : 0,
                max(1, $billableQuantity),
                $totalWeightOverrideKg,
                $lengthOverride,
                $widthOverride,
                $heightOverride
            ),
            'delhivery' => array_merge(
                ['charge' => $this->calculateDelhivery($config, $product, $destinationPincode)],
                $emptyEta
            ),
            default => array_merge(['charge' => $this->shippingFallbackFromSettings($settings)], $emptyEta),
        };
    }

    /**
     * Platform default; never return 0 so checkout does not show "free" when nothing was quoted.
     */
    protected function shippingFallbackFromSettings(array $settings): float
    {
        $v = (float) ($settings['delivery_charges'] ?? 50.0);

        return $v > 0 ? $v : 50.0;
    }

    /**
     * Billable weight for one catalog unit (kg).
     * Missing/zero uses 0.5 kg. Values under 50g are treated as bad data (grams-as-kg, placeholders)
     * and normalized to 0.5 kg so Shiprocket quotes match typical carrier minimums.
     */
    public function billableUnitWeightKg(Product $product): float
    {
        $w = (float) ($product->weight ?? 0);
        if ($w <= 0) {
            return 0.5;
        }
        if ($w < 0.01) {
            return 0.5;
        }

        return $w;
    }

    /**
     * Length/width/height in cm for rate APIs. Missing sides default to 10cm; sides below 10cm are
     * raised to 10cm so tiny placeholder dims (e.g. 1×3×1) do not produce misleading quotes.
     *
     * @return array{0: float, 1: float, 2: float}
     */
    public function billablePackageDimensionsCm(
        Product $product,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): array {
        $min = 0.01;
        $l = $lengthOverride !== null ? $lengthOverride : (float) ($product->length ?? 0);
        $w = $widthOverride !== null ? $widthOverride : (float) ($product->width ?? 0);
        $h = $heightOverride !== null ? $heightOverride : (float) ($product->height ?? 0);

        // Fallback: If individual columns are 0, try to parse 'dimensions' string (e.g. "40x30x20")
        if ($l <= 0 && $w <= 0 && $h <= 0 && !empty($product->dimensions)) {
            $parts = preg_split('/[xX*]/', (string) $product->dimensions);
            if (count($parts) >= 3) {
                $l = (float) trim($parts[0]);
                $w = (float) trim($parts[1]);
                $h = (float) trim($parts[2]);
            }
        }

        return [
            $l > 0 ? max($min, $l) : $min,
            $w > 0 ? max($min, $w) : $min,
            $h > 0 ? max($min, $h) : $min,
        ];
    }

    /**
     * Quote Shiprocket courier serviceability and return the cheapest total charge.
     */
    protected function quoteShiprocketServiceability(
        string $token,
        string $pickupPincode,
        Product $product,
        string $destinationPincode,
        int $cod = 0,
        int $billableQuantity = 1,
        ?float $totalWeightOverrideKg = null,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): ?float {
        $detail = $this->quoteShiprocketServiceabilityDetail(
            $token,
            $pickupPincode,
            $product,
            $destinationPincode,
            $cod,
            $billableQuantity,
            $totalWeightOverrideKg,
            $lengthOverride,
            $widthOverride,
            $heightOverride
        );

        return $detail['shipping_charge'] ?? null;
    }

    /**
     * Same as {@see quoteShiprocketServiceability} but includes ETD from the cheapest courier row.
     *
     * @return array{shipping_charge: float, expected_delivery_by: string|null, expected_delivery_days: int|null}|null
     */
    protected function quoteShiprocketServiceabilityDetail(
        string $token,
        string $pickupPincode,
        Product $product,
        string $destinationPincode,
        int $cod = 0,
        int $billableQuantity = 1,
        ?float $totalWeightOverrideKg = null,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): ?array {
        if ($totalWeightOverrideKg !== null && $totalWeightOverrideKg > 0) {
            $weight = round($totalWeightOverrideKg, 3);
        } else {
            $unitKg = $this->billableUnitWeightKg($product);
            $weight = max(0.05, $unitKg * max(1, $billableQuantity));
        }

        [$length, $width, $height] = $this->billablePackageDimensionsCm($product, $lengthOverride, $widthOverride, $heightOverride);

        $response = Http::withToken($token)->get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', [
            'pickup_postcode' => $pickupPincode,
            'delivery_postcode' => $destinationPincode,
            'cod' => $cod ? 1 : 0,
            'weight' => $weight,
            'length' => $length,
            'width' => $width,
            'height' => $height,
            'declared_value' => 0, // Set to 0 to match basic rate calculator (excludes insurance/shield)
        ]);

        if (!$response->successful()) {
            Log::warning('Shiprocket checkout serviceability HTTP failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'delivery_postcode' => $destinationPincode,
                'pickup_postcode' => $pickupPincode,
                'product_id' => $product->id ?? null,
            ]);
            return null;
        }

        $data = $response->json();
        $companies = $data['data']['available_courier_companies']
            ?? $data['available_courier_companies']
            ?? $data['data']['courier_companies']
            ?? $data['courier_companies']
            ?? [];

        $row = $this->pickShiprocketCheapestCourierRow($companies);
        if ($row === null) {
            Log::warning('Shiprocket checkout: no parsable courier rate', [
                'delivery_postcode' => $destinationPincode,
                'pickup_postcode' => $pickupPincode,
                'product_id' => $product->id ?? null,
                'sample' => is_array($companies[0] ?? null) ? $companies[0] : null,
            ]);

            return null;
        }

        $rate = $this->shiprocketCourierTotalCharge($row);
        if ($rate === null) {
            return null;
        }

        $est = $this->shiprocketCourierDeliveryEstimate($row);

        return [
            'shipping_charge' => $rate,
            'expected_delivery_by' => $est['expected_delivery_by'],
            'expected_delivery_days' => $est['expected_delivery_days'],
            'courier_name' => $row['courier_name'] ?? 'Shiprocket',
        ];
    }

    /**
     * Pick the courier row used for {@see pickShiprocketCheckoutRate} (cheapest; prefers positive rates).
     *
     * @param  array<int, mixed>  $companies
     * @return array<string, mixed>|null
     */
    protected function pickShiprocketCheapestCourierRow(array $companies): ?array
    {
        $parsed = [];
        foreach ($companies as $c) {
            if (!is_array($c)) {
                continue;
            }
            $r = $this->shiprocketCourierTotalCharge($c);
            if ($r === null) {
                continue;
            }
            // Skip India Post by default as it often causes rate discrepancies with private couriers
            $name = strtolower($c['courier_name'] ?? '');
            if (str_contains($name, 'india post')) {
                continue;
            }
            $parsed[] = ['row' => $c, 'rate' => $r];
        }
        if ($parsed === []) {
            return null;
        }
        $positive = array_values(array_filter($parsed, fn($x) => $x['rate'] > 0));
        $pool = $positive !== [] ? $positive : $parsed;
        $minRate = min(array_map(fn($x) => $x['rate'], $pool));
        foreach ($pool as $x) {
            if (abs($x['rate'] - $minRate) < 0.00001) {
                return $x['row'];
            }
        }

        return $pool[0]['row'];
    }

    /**
     * @param  array<string, mixed>  $courierRow
     * @return array{expected_delivery_by: string|null, expected_delivery_days: int|null}
     */
    protected function shiprocketCourierDeliveryEstimate(array $courierRow): array
    {
        $byDate = null;
        $days = null;

        $dateKeys = ['etd', 'estimated_delivery_date', 'edd', 'delivery_date', 'expected_delivery_date', 'estimated_date'];
        foreach ($dateKeys as $k) {
            if (empty($courierRow[$k])) {
                continue;
            }
            $raw = $courierRow[$k];
            if (is_array($raw) && isset($raw['date'])) {
                $raw = $raw['date'];
            }
            if (is_string($raw) || is_numeric($raw)) {
                try {
                    $byDate = Carbon::parse((string) $raw)->format('Y-m-d');
                    break;
                } catch (\Throwable $e) {
                    continue;
                }
            }
        }

        $dayKeys = ['estimated_delivery_days', 'etd_in_days', 'delivery_days', 'tat', 'estimated_tat'];
        foreach ($dayKeys as $k) {
            if (!array_key_exists($k, $courierRow) || $courierRow[$k] === '' || $courierRow[$k] === null) {
                continue;
            }
            if (is_numeric($courierRow[$k])) {
                $days = (int) $courierRow[$k];
                if ($days > 0) {
                    break;
                }
            }
        }

        if ($byDate === null && $days !== null && $days > 0) {
            try {
                $byDate = Carbon::now()->addDays($days)->format('Y-m-d');
            } catch (\Throwable $e) {
            }
        }

        return [
            'expected_delivery_by' => $byDate,
            'expected_delivery_days' => $days,
        ];
    }

    /**
     * @return array{charge: float, expected_delivery_by: string|null, expected_delivery_days: int|null}
     */
    protected function calculateShiprocketQuote(
        $config,
        $product,
        $destinationPincode,
        int $cod = 0,
        int $billableQuantity = 1,
        ?float $totalWeightOverrideKg = null,
        ?float $lengthOverride = null,
        ?float $widthOverride = null,
        ?float $heightOverride = null
    ): array {
        $emptyEta = ['expected_delivery_by' => null, 'expected_delivery_days' => null, 'pickup_pincode' => null];
        $fallbackCharge = $this->shippingFallbackFromSettings($this->getSettings());
        $creds = $config?->credentials ?? [];
        $email = $creds['email'] ?? null;
        $password = $creds['password'] ?? null;

        try {
            $token = $this->getShiprocketToken($email, $password);

            if (!$token) {
                Log::warning('Shiprocket checkout: missing token (fallback)', [
                    'product_id' => $product->id ?? null,
                    'supplier_id' => $product->supplier_id ?? null,
                ]);
                return array_merge(['charge' => $fallbackCharge], $emptyEta);
            }

            $pickupPincode = $this->resolveShiprocketPickupPostcode($config->owner, $creds, $token);

            $deliveryPostcode = preg_replace('/\D/', '', (string) $destinationPincode);
            $detail = $this->quoteShiprocketServiceabilityDetail(
                $token,
                $pickupPincode,
                $product,
                $deliveryPostcode,
                $cod,
                max(1, $billableQuantity),
                $totalWeightOverrideKg,
                $lengthOverride,
                $widthOverride,
                $heightOverride
            );
            if ($detail !== null) {
                return [
                    'charge' => $detail['shipping_charge'],
                    'expected_delivery_by' => $detail['expected_delivery_by'],
                    'expected_delivery_days' => $detail['expected_delivery_days'],
                    'pickup_pincode' => $pickupPincode,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Shiprocket calculation failed: ' . $e->getMessage());
        }

        return array_merge(['charge' => $fallbackCharge], $emptyEta);
    }

    protected function calculateShiprocket($config, $product, $destinationPincode, int $cod = 0, int $billableQuantity = 1, ?float $totalWeightOverrideKg = null)
    {
        return $this->calculateShiprocketQuote($config, $product, $destinationPincode, $cod, $billableQuantity, $totalWeightOverrideKg)['charge'];
    }

    /**
     * @param  array<string, mixed>  $courierRow
     */
    protected function shiprocketCourierQuotedRate(array $courierRow): ?float
    {
        $raw = $courierRow['rate'] ?? $courierRow['freight_charge'] ?? $courierRow['courier_rate'] ?? $courierRow['base_courier_charge'] ?? null;
        if ($raw === null || $raw === '' || !is_numeric($raw)) {
            return null;
        }

        return (float) $raw;
    }

    /**
     * Shiprocket courier "rate" is not always present or may exclude components.
     * Prefer explicit "rate" when numeric, otherwise compute a total from known numeric components.
     *
     * @param  array<string, mixed>  $courierRow
     */
    protected function shiprocketCourierTotalCharge(array $courierRow): ?float
    {
        \Log::debug('Raw Shiprocket Courier Row', ['row' => $courierRow]);
        // Shiprocket 'rate' is often the final inclusive price (Freight + Fuel + Tax + COD).
        // If it's present and numeric, we prioritize it to match the 'Estimated Rate' on their website.
        $rate = $courierRow['rate'] ?? null;
        if ($rate !== null && $rate !== '' && is_numeric($rate) && (float) $rate > 0) {
            return (float) $rate;
        }

        // If 'rate' is missing or zero, we calculate from components, avoiding double-counting aliases.
        $base = (float) ($courierRow['freight_charge'] ?? $courierRow['base_courier_charge'] ?? $courierRow['courier_rate'] ?? 0);
        $cod = (float) ($courierRow['cod_charges'] ?? 0);
        $fuel = (float) ($courierRow['fuel_surcharge'] ?? 0);

        // Use either other_charges or handling_charges, but not both if they are identical
        $other = (float) ($courierRow['other_charges'] ?? $courierRow['handling_charges'] ?? 0);

        // Use either insurance_amount or coverage_charges
        $insurance = (float) ($courierRow['insurance_amount'] ?? $courierRow['coverage_charges'] ?? 0);

        // Use either pickup_charge or pickup_charges
        $pickup = (float) ($courierRow['pickup_charge'] ?? $courierRow['pickup_charges'] ?? 0);

        // Tax components
        $tax = (float) ($courierRow['tax'] ?? $courierRow['entry_tax'] ?? 0);

        $sum = $base + $cod + $fuel + $other + $insurance + $pickup + $tax;
        
        \Log::debug('Shiprocket Courier Row Calculation', [
            'courier' => $courierRow['courier_name'] ?? 'unknown',
            'base' => $base,
            'cod' => $cod,
            'fuel' => $fuel,
            'other' => $other,
            'tax' => $tax,
            'sum' => $sum,
            'final_calc' => ($tax > 0) ? $sum : round($sum * 1.18, 2),
            'raw_rate' => $courierRow['rate'] ?? null
        ]);

        if ($sum > 0) {
            // Apply 18% GST only if no explicit tax was provided in the response.
            // Shiprocket usually returns 'tax' as 0 if inclusive, or a value if exclusive.
            $hasTax = $tax > 0;
            return $hasTax ? $sum : round($sum * 1.18, 2);
        }

        // Fallback to the first available numeric field if everything else failed
        return $this->shiprocketCourierQuotedRate($courierRow);
    }

    /**
     * Use cheapest positive courier rate. Shiprocket often returns the first option with rate 0
     * (e.g. certain surface/promo rows); checkout should not treat that as free shipping.
     *
     * @param  array<int, array<string, mixed>>  $companies
     */
    protected function pickShiprocketCheckoutRate(array $companies): ?float
    {
        $rates = [];
        foreach ($companies as $c) {
            if (!is_array($c)) {
                continue;
            }
            $r = $this->shiprocketCourierTotalCharge($c);
            if ($r === null) {
                continue;
            }
            $rates[] = $r;
        }
        if ($rates === []) {
            return null;
        }
        $positive = array_values(array_filter($rates, fn($r) => $r > 0));
        if ($positive !== []) {
            return min($positive);
        }

        return min($rates);
    }

    /**
     * Sort Shiprocket courier rows by quoted freight (ascending). Unknown rates sort last.
     *
     * @param  array<int, mixed>  $companies
     * @return array<int, array<string, mixed>>
     */
    public function sortShiprocketCouriersByQuotedRate(array $companies): array
    {
        $copy = array_values(array_filter($companies, 'is_array'));
        usort($copy, function (array $a, array $b): int {
            $ra = $this->shiprocketCourierTotalCharge($a);
            $rb = $this->shiprocketCourierTotalCharge($b);
            $na = $ra ?? PHP_FLOAT_MAX;
            $nb = $rb ?? PHP_FLOAT_MAX;
            if ($na === $nb) {
                return 0;
            }

            return $na <=> $nb;
        });

        return $copy;
    }

    /**
     * Pick the cheapest serviceable courier (prefers positive rates; otherwise lowest numeric).
     *
     * @param  array<int, array<string, mixed>>  $companies
     * @return array{courier_company_id: int|string, courier_name: string|null, rate: float}|null
     */
    public function pickCheapestShiprocketCourier(array $companies): ?array
    {
        $bestPositive = null;
        $bestPositiveRate = null;
        foreach ($companies as $c) {
            if (!is_array($c)) {
                continue;
            }
            $rate = $this->shiprocketCourierTotalCharge($c);
            if ($rate === null || $rate <= 0) {
                continue;
            }
            $id = $c['courier_company_id'] ?? $c['courier_id'] ?? $c['id'] ?? null;
            if ($id === null) {
                continue;
            }
            if ($bestPositiveRate === null || $rate < $bestPositiveRate) {
                $bestPositiveRate = $rate;
                $bestPositive = [
                    'courier_company_id' => $id,
                    'courier_name' => $c['courier_name'] ?? $c['name'] ?? null,
                    'rate' => $rate,
                ];
            }
        }
        if ($bestPositive !== null) {
            return $bestPositive;
        }

        $bestAny = null;
        $bestAnyRate = null;
        foreach ($companies as $c) {
            if (!is_array($c)) {
                continue;
            }
            $rate = $this->shiprocketCourierTotalCharge($c);
            if ($rate === null) {
                continue;
            }
            $id = $c['courier_company_id'] ?? $c['courier_id'] ?? $c['id'] ?? null;
            if ($id === null) {
                continue;
            }
            if ($bestAnyRate === null || $rate < $bestAnyRate) {
                $bestAnyRate = $rate;
                $bestAny = [
                    'courier_company_id' => $id,
                    'courier_name' => $c['courier_name'] ?? $c['name'] ?? null,
                    'rate' => $rate,
                ];
            }
        }

        return $bestAny;
    }

    /**
     * Total shipment weight (kg) for Shiprocket: prefer checkout-quoted line weight stored on the item.
     */
    public function resolveShiprocketShipmentWeightKg(OrderItem $orderItem): float
    {
        $data = $orderItem->customization_data;
        if (is_array($data) && isset($data['_shipping']['line_weight_kg']) && is_numeric($data['_shipping']['line_weight_kg']) && (float) $data['_shipping']['line_weight_kg'] > 0) {
            return max(0.05, (float) $data['_shipping']['line_weight_kg']);
        }

        return max(0.05, $this->billableUnitWeightKg($orderItem->product) * max(1, (int) $orderItem->quantity));
    }

    /**
     * Create a shipment for an order item.
     */
    public function createShipment($orderItem): ?array
    {
        $supplier = $orderItem->product->supplier;
        $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
            ->where('owner_type', Supplier::class)
            ->where('is_enabled', true)
            ->first();

        $creds = $config?->credentials ?? [];
        // getShiprocketToken handles fallback to platform settings if $creds is empty
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        if (!$token)
            return null;

        $order = $orderItem->order;
        $address = $order->shipping_address;

        $pincode = preg_replace('/\D/', '', $address['pincode'] ?? '');
        if (strlen($pincode) !== 6) {
            $pincode = '110001';
            Log::warning("Shiprocket createShipment: Invalid pincode for order #{$order->id}, using fallback 110001");
        }

        // Split full name into first and last for Shiprocket validation
        $fullName = trim($address['name'] ?? 'Customer');
        $nameParts = explode(' ', $fullName, 2);
        $firstName = $nameParts[0] ?: 'Customer';
        $lastName = $nameParts[1] ?? '.'; // Shiprocket requires last name

        // Use a list of potential pickup nicknames starting with the most specific
        $pickupNicknames = array_filter([
            $supplier->shiprocket_pickup_nickname,
            $creds['pickup_location'] ?? null,
            'Primary' // Absolute fallback
        ]);

        [$pkgLength, $pkgWidth, $pkgHeight] = $this->billablePackageDimensionsCm($orderItem->product);

        $lastError = null;
        foreach ($pickupNicknames as $nickname) {
            $payload = [
                'order_id' => $order->id . '-' . $orderItem->id . '-' . time(),
                'order_date' => $order->created_at->format('Y-m-d H:i'),
                'pickup_location' => $nickname,

                'billing_customer_name' => $firstName,
                'billing_last_name' => $lastName,
                'billing_address' => $address['address'] ?? 'Address not provided',
                'billing_address_2' => $address['address_2'] ?? '',
                'billing_city' => $address['city'] ?? 'City',
                'billing_pincode' => $pincode,
                'billing_state' => $address['state'] ?? 'State',
                'billing_country' => 'India',
                'billing_email' => $order->customer->email ?? 'guest@example.com',
                'billing_phone' => substr(preg_replace('/\D/', '', $address['phone'] ?? '0000000000'), -10),
                'shipping_is_billing' => true,
                'order_items' => [
                    [
                        'name' => $orderItem->product->name,
                        'sku' => $orderItem->product->sku ?: 'SKU-' . $orderItem->product_id,
                        'units' => $orderItem->quantity,
                        'selling_price' => $orderItem->final_price,
                    ]
                ],
                'payment_method' => ($order->payment_method === 'cod') ? 'COD' : 'Prepaid',
                'sub_total' => $orderItem->final_price * $orderItem->quantity,
                'length' => $pkgLength,
                'breadth' => $pkgWidth,
                'height' => $pkgHeight,
                'weight' => $this->resolveShiprocketShipmentWeightKg($orderItem),
            ];

            try {
                $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    return [
                        'shipment_id' => $data['shipment_id'] ?? null,
                        'order_id' => $data['order_id'] ?? null,
                        'status' => 'order_created'
                    ];
                }

                $lastError = $response->json();
                Log::warning("Shiprocket ad-hoc order creation retry [Nickname: $nickname]:", ['res' => $lastError]);

                // If error is about pickup, continue to next nickname. Otherwise fail (validation error).
                if (isset($lastError['message']) && stripos($lastError['message'], 'pickup') === false) {
                    break;
                }
            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                Log::error("Shiprocket creation exception [Nickname: $nickname]: " . $e->getMessage());
            }
        }

        Log::error("Shiprocket order creation failed after all fallbacks", ['last_error' => $lastError]);
        return null;
    }

    /**
     * Courier list + the weight/qty/postcode inputs used so the supplier UI matches Shiprocket.
     *
     * @return array{couriers: array, quote_inputs: array, shiprocket_last_status: int|null, shiprocket_fallback: string|null}
     */
    public function fetchCourierServiceability($orderItem, $shipmentId): array
    {
        $supplier = $orderItem->product->supplier;
        $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
            ->where('owner_type', Supplier::class)
            ->where('is_enabled', true)
            ->first();
        $creds = $config?->credentials ?? [];
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        if (!$token) {
            Log::error('fetchCourierServiceability: No Shiprocket token for shipment ' . $shipmentId);

            return [
                'couriers' => [],
                'quote_inputs' => [],
                'shiprocket_last_status' => null,
                'shiprocket_fallback' => 'no_token',
            ];
        }

        $order = $orderItem->order;
        $address = $order->shipping_address ?? [];
        $deliveryPincode = preg_replace('/\D/', '', $address['pincode'] ?? '');
        if (strlen($deliveryPincode) !== 6) {
            $deliveryPincode = '110001';
        }

        $pickupPincode = $this->resolveShiprocketPickupPostcode($supplier, $creds, $token);
        $product = $orderItem->product;
        $qty = max(1, (int) $orderItem->quantity);
        $catalogUnitKg = (float) ($product->weight ?? 0);
        $unitKg = $this->billableUnitWeightKg($product);
        $weight = max(0.05, $unitKg * $qty);
        [$length, $width, $height] = $this->billablePackageDimensionsCm($product);
        $cod = ($order->payment_method === 'cod') ? 1 : 0;

        $policyNotes = [];
        if ($catalogUnitKg > 0 && $catalogUnitKg < 0.05) {
            $policyNotes[] = 'Catalog unit weight under 50g is quoted as 0.5kg (typical carrier minimum).';
        }
        if ($catalogUnitKg <= 0) {
            $policyNotes[] = 'No catalog weight; using 0.5kg per unit for quoting.';
        }
        $rawL = (float) ($product->length ?? 0);
        $rawW = (float) ($product->width ?? 0);
        $rawH = (float) ($product->height ?? 0);
        if ($rawL <= 0 || $rawW <= 0 || $rawH <= 0) {
            $policyNotes[] = 'Package dimensions use at least 0.5cm per side when catalog values are missing.';
        }

        // Do not send order_id here: Shiprocket may ignore weight/qty and use the stored order line instead,
        // which previously could be created with wrong total weight.
        $query = [
            'pickup_postcode' => $pickupPincode,
            'delivery_postcode' => $deliveryPincode,
            'cod' => $cod,
            'weight' => $weight,
            'length' => $length,
            'width' => $width,
            'height' => $height,
            'declared_value' => 0,
        ];

        $response = Http::withToken($token)->get(
            'https://apiv2.shiprocket.in/v1/external/courier/serviceability/',
            $query
        );

        $companies = $response->successful()
            ? ($response->json()['data']['available_courier_companies'] ?? [])
            : [];

        $fallback = null;

        // Fallback: shipment-scoped quote only if postcode+weight query returned nothing.
        if ($companies === [] && $shipmentId) {
            $fallback = 'shipment_id';
            $response = Http::withToken($token)->get(
                'https://apiv2.shiprocket.in/v1/external/courier/serviceability/',
                ['shipment_id' => (int) $shipmentId]
            );
            $companies = $response->successful()
                ? ($response->json()['data']['available_courier_companies'] ?? [])
                : [];
        }

        Log::info('Shiprocket courier serviceability', [
            'shipment_id' => $shipmentId,
            'order_item_id' => $orderItem->id,
            'quantity' => $qty,
            'weight_kg' => $weight,
            'status' => $response->status(),
            'body' => $response->body(),
            'fallback' => $fallback,
        ]);

        if ($companies === [] && !$response->successful()) {
            Log::error('Shiprocket serviceability failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        $companies = $this->sortShiprocketCouriersByQuotedRate($companies);
        $cheapest = $this->pickCheapestShiprocketCourier($companies);

        return [
            'couriers' => $companies,
            'cheapest_courier' => $cheapest,
            'quote_inputs' => [
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'quantity' => $qty,
                'catalog_unit_weight_kg' => $catalogUnitKg > 0 ? round($catalogUnitKg, 4) : null,
                'unit_weight_kg' => round($unitKg, 4),
                'total_weight_kg' => round($weight, 4),
                'catalog_length_cm' => $rawL > 0 ? round($rawL, 2) : null,
                'catalog_width_cm' => $rawW > 0 ? round($rawW, 2) : null,
                'catalog_height_cm' => $rawH > 0 ? round($rawH, 2) : null,
                'length_cm' => (float) $length,
                'width_cm' => (float) $width,
                'height_cm' => (float) $height,
                'pickup_postcode' => $pickupPincode,
                'delivery_postcode' => $deliveryPincode,
                'cod' => (bool) $cod,
                'shiprocket_shipment_id' => $shipmentId ? (string) $shipmentId : null,
                'shiprocket_order_id' => $orderItem->shiprocket_order_id,
                'policy_notes' => $policyNotes,
            ],
            'shiprocket_last_status' => $response->status(),
            'shiprocket_fallback' => $fallback,
        ];
    }

    public function assignAWB($orderItem, $shipmentId, $courierId = null)
    {
        $supplier = $orderItem->product->supplier;
        $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
            ->where('owner_type', Supplier::class)
            ->where('is_enabled', true)
            ->first();
        $creds = $config?->credentials ?? [];
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        // Shiprocket expects integer shipment_id for assign/awb.
        $payload = ['shipment_id' => (int) $shipmentId];
        // Omit courier_id to let Shiprocket auto-assign (same behaviour as assigning from their panel).
        if ($courierId !== null && $courierId !== '' && (int) $courierId > 0) {
            $payload['courier_id'] = (int) $courierId;
        }

        $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', $payload);
        return [
            'http_status' => $response->status(),
            'response' => $response->json(),
            'request' => $payload,
        ];
    }

    public function requestPickup($orderItem, $shipmentId)
    {
        $supplier = $orderItem->product->supplier;
        $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
            ->where('owner_type', Supplier::class)
            ->where('is_enabled', true)
            ->first();
        $creds = $config?->credentials ?? [];
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        // Shiprocket expects a single shipment_id per pickup request (integer), not an array.
        $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', [
            'shipment_id' => (int) $shipmentId,
        ]);
        return $response->json();
    }

    /**
     * Cancel a Shiprocket order (which cancels the shipment/AWB as well).
     *
     * Shiprocket endpoint: POST /v1/external/orders/cancel with {"ids":[<shiprocket_order_id>]}.
     */
    public function cancelShiprocketOrder(\App\Models\OrderItem $orderItem): array
    {
        $supplier = $orderItem->product?->supplier;
        $config = null;
        if ($supplier) {
            $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
                ->where('owner_type', Supplier::class)
                ->where('is_enabled', true)
                ->first();
        }
        $creds = $config?->credentials ?? [];
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        if (!$token) {
            return [
                'ok' => false,
                'error' => 'Shiprocket token missing',
                'http_status' => null,
                'response' => null,
            ];
        }

        $srOrderId = (int) ($orderItem->shiprocket_order_id ?? 0);
        if ($srOrderId <= 0) {
            return [
                'ok' => false,
                'error' => 'No Shiprocket order id on this item',
                'http_status' => null,
                'response' => null,
            ];
        }

        $payload = ['ids' => [$srOrderId]];
        $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/orders/cancel', $payload);
        $body = $response->json();

        $msg = is_array($body) ? (string) ($body['message'] ?? $body['msg'] ?? '') : '';
        $looksOkMessage = $msg !== '' && stripos($msg, 'cancel') !== false && stripos($msg, 'success') !== false;
        $ok = $response->successful() && (
            (($body['status'] ?? null) === 1) ||
            (($body['success'] ?? null) === true) ||
            (($body['status_code'] ?? null) === 200) ||
            (($body['is_duplicate_request'] ?? null) === 1 && $looksOkMessage) ||
            $looksOkMessage
        );

        if (!$ok) {
            Log::warning('Shiprocket cancel failed', [
                'order_item_id' => $orderItem->id,
                'shiprocket_order_id' => $srOrderId,
                'http_status' => $response->status(),
                'response' => $body,
            ]);
        }

        return [
            'ok' => $ok,
            'http_status' => $response->status(),
            'response' => $body,
            'request' => $payload,
        ];
    }

    protected function getShiprocketToken($email = null, $password = null)
    {
        if (!$email || !$password) {
            $settings = $this->getSettings();
            $email = $settings['shiprocket_email'] ?? null;
            $password = $settings['shiprocket_password'] ?? null;
        }

        if (!$email || !$password) {
            return null;
        }

        $cacheKey = 'shiprocket_token_' . md5($email);
        return Cache::remember($cacheKey, 3600 * 20, function () use ($email, $password) { // 20h to avoid stale Shiprocket tokens
            $response = Http::post('https://apiv2.shiprocket.in/v1/external/auth/login', [
                'email' => $email,
                'password' => $password,
            ]);

            if ($response->successful()) {
                return $response->json()['token'];
            }
            Log::error("Shiprocket Login Failed", [
                'status' => $response->status(),
                'response' => $response->body(),
                'email_attempted' => $email,
            ]);
            return null;
        });
    }

    /**
     * Get tracking details for a shipment.
     */
    public function trackShipment($awbCode): ?array
    {
        $token = $this->getShiprocketToken();
        if (!$token)
            return null;

        try {
            $response = Http::withToken($token)->get("https://apiv2.shiprocket.in/v1/external/courier/track/awb/{$awbCode}");
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Exception $e) {
            Log::error("Shiprocket tracking failed: " . $e->getMessage());
        }
        return null;
    }

    /**
     * Get available pickup locations.
     */
    public function getPickupLocations(): array
    {
        $token = $this->getShiprocketToken();
        if (!$token)
            return [];

        try {
            $response = Http::withToken($token)->get('https://apiv2.shiprocket.in/v1/external/settings/company/pickup');
            if ($response->successful()) {
                return $response->json()['data']['shipping_address'] ?? [];
            }
        } catch (\Exception $e) {
            Log::error("Shiprocket pickup locations fetch failed: " . $e->getMessage());
        }
        return [];
    }

    /**
     * Generate shipping label.
     */
    public function generateLabel($shipmentId): ?string
    {
        $token = $this->getShiprocketToken();
        if (!$token)
            return null;

        try {
            $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/courier/generate/label', [
                'shipment_id' => [$shipmentId],
            ]);
            if ($response->successful()) {
                return $response->json()['label_url'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error("Shiprocket label generation failed: " . $e->getMessage());
        }
        return null;
    }

    protected function getSupplierPincode($supplier)
    {
        if (!$supplier) {
            return '110001'; // Default
        }

        $contact = is_string($supplier->contact_info) ? json_decode($supplier->contact_info, true) : $supplier->contact_info;
        $raw = $contact['pincode'] ?? '110001';
        $digits = preg_replace('/\D/', '', (string) $raw);

        return strlen($digits) === 6 ? $digits : '110001';
    }

    /**
     * Pickup postcode for Shiprocket serviceability must match the warehouse used in Shiprocket.
     * Suppliers often store the real pickup pincode on shipping credentials, while contact_info is only an office address.
     * When possible, reads registered pickups from Shiprocket (same source as fulfillment).
     *
     * @param  array<string, mixed>  $creds
     */
    protected function resolveShiprocketPickupPostcode(?Supplier $supplier, array $creds, ?string $shiprocketToken = null): string
    {
        foreach (['pickup_pincode', 'pickup_postcode', 'warehouse_pincode', 'pincode'] as $key) {
            if (empty($creds[$key])) {
                continue;
            }
            $digits = preg_replace('/\D/', '', (string) $creds[$key]);
            if (strlen($digits) === 6) {
                return $digits;
            }
        }

        if ($shiprocketToken && $supplier) {
            $fromApi = $this->pickupPostcodeFromShiprocketCompanyPickups($shiprocketToken, $supplier, $creds);
            if ($fromApi) {
                return $fromApi;
            }
        }

        return $this->getSupplierPincode($supplier);
    }

    /**
     * Resolve warehouse pin from GET /settings/company/pickup (supplier's Shiprocket account).
     *
     * @param  array<string, mixed>  $creds
     */
    protected function pickupPostcodeFromShiprocketCompanyPickups(string $token, Supplier $supplier, array $creds): ?string
    {
        try {
            $response = Http::withToken($token)->get('https://apiv2.shiprocket.in/v1/external/settings/company/pickup');
            if (!$response->successful()) {
                return null;
            }

            $payload = $response->json();
            $addresses = $payload['data']['shipping_address'] ?? $payload['data'] ?? [];
            if (!is_array($addresses)) {
                return null;
            }

            $list = array_is_list($addresses) ? $addresses : [$addresses];

            $preferNick = $supplier->shiprocket_pickup_nickname
                ?: ($creds['pickup_location'] ?? null);

            foreach ($list as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $pin = $this->extractPincodeFromShiprocketAddressRow($row);
                if ($pin === null) {
                    continue;
                }
                $nick = $row['pickup_location'] ?? $row['nickname'] ?? $row['name'] ?? null;
                if ($preferNick && $nick && strcasecmp((string) $nick, (string) $preferNick) === 0) {
                    return $pin;
                }
            }

            foreach ($list as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $pin = $this->extractPincodeFromShiprocketAddressRow($row);
                if ($pin !== null) {
                    return $pin;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Shiprocket pickup list pin resolve failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function extractPincodeFromShiprocketAddressRow(array $row): ?string
    {
        foreach (['pin_code', 'pincode', 'post_code', 'postcode', 'pickup_pin_code', 'zip'] as $key) {
            if (empty($row[$key])) {
                continue;
            }
            $digits = preg_replace('/\D/', '', (string) $row[$key]);
            if (strlen($digits) === 6) {
                return $digits;
            }
        }

        return null;
    }

    /**
     * Add a new pickup location to Shiprocket for a supplier.
     */
    public function addPickupLocation(Supplier $supplier, array $data): ?array
    {
        $config = AuthorityShippingConfig::where('owner_id', $supplier->id)
            ->where('owner_type', Supplier::class)
            ->where('is_enabled', true)
            ->first();

        $creds = $config?->credentials ?? [];
        $token = $this->getShiprocketToken($creds['email'] ?? null, $creds['password'] ?? null);

        if (!$token) {
            throw new \Exception("Shiprocket credentials not configured or invalid for this supplier.");
        }

        try {
            $response = Http::withToken($token)->post('https://apiv2.shiprocket.in/v1/external/settings/company/addpickup', $data);

            if ($response->successful()) {
                $resData = $response->json();
                $snapshot = [
                    'pickup_location' => $data['pickup_location'],
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'city' => $data['city'],
                    'state' => $data['state'],
                    'country' => $data['country'],
                    'pin_code' => $data['pin_code'],
                    'saved_at' => now()->toIso8601String(),
                ];
                if (!empty($data['address_2'])) {
                    $snapshot['address_2'] = $data['address_2'];
                }
                $supplier->update([
                    'shiprocket_pickup_nickname' => $data['pickup_location'],
                    'shiprocket_pickup_snapshot' => $snapshot,
                ]);
                return $resData;
            }

            $errBody = $response->json();
            $msg = $errBody['message'] ?? "Failed to add pickup location to Shiprocket.";
            if (isset($errBody['errors']) && is_array($errBody['errors'])) {
                $validationErrors = collect($errBody['errors'])->flatten()->implode(' ');
                $msg = $validationErrors ?: $msg;
            }
            throw new \Exception(is_array($msg) ? json_encode($msg) : $msg);

        } catch (\Exception $e) {
            Log::error("Shiprocket API exception: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update/Patch pickup address for existing orders or global settings.
     */
    public function updatePickupLocation(Supplier $supplier, array $data): ?array
    {
        return $this->addPickupLocation($supplier, $data);
    }

    protected function calculateDelhivery($config, $product, $destinationPincode)
    {
        // Placeholder for Delhivery
        return $this->shippingFallbackFromSettings($this->getSettings());
    }
}
