<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateSchoolRequest;
use App\Http\Requests\Admin\CreateSupplierRequest;
use App\Http\Requests\Product\CreateProductRequest;
use App\Models\School;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Order;
use App\Models\Wallet;
use App\Http\Resources\OrderResource;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\Settlement;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AdminController extends Controller
{
    public function createSchool(CreateSchoolRequest $request)
    {
        // Only Super Admin
        $data = $request->validated();
        $rawPassword = $data['password'];
        // Hash for the School model (no auto-hash cast)
        $data['password'] = \Illuminate\Support\Facades\Hash::make($rawPassword);

        if (isset($data['contact_info']) && is_string($data['contact_info'])) {
            $data['contact_info'] = json_decode($data['contact_info'], true);
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('schools/logos', 'public');
        }

        if ($request->hasFile('school_banner')) {
            $data['school_banner'] = $request->file('school_banner')->store('schools/banners', 'public');
        }

        DB::beginTransaction();
        try {
            $school = School::create($data);

            // User model has 'password' => 'hashed' cast, so pass RAW password
            $user = \App\Models\User::create([
                'name' => $school->name,
                'email' => $school->email,
                'password' => $rawPassword,
                'school_id' => $school->id,
                'referral_code' => \App\Models\User::generateReferralCode(),
            ]);
            $user->assignRole('school');

            DB::commit();
            return response()->json(['message' => 'School created', 'school' => new \App\Http\Resources\SchoolResource($school)], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create school', 'details' => $e->getMessage()], 500);
        }
    }

    public function indexSchools(Request $request)
    {
        $perPage = min(500, max(1, (int) $request->query('per_page', 20)));

        $schools = School::orderBy('created_at', 'desc')->paginate($perPage);

        return \App\Http\Resources\SchoolResource::collection($schools);
    }

    public function toggleSchoolStatus($id)
    {
        $school = School::findOrFail($id);
        $school->status = $school->status === 'active' ? 'inactive' : 'active';
        $school->save();
        return response()->json(['message' => 'School status updated', 'school' => $school]);
    }

    public function deleteSchool($id)
    {
        $school = School::findOrFail($id);
        $school->delete();
        return response()->json(['message' => 'School removed']);
    }

    public function updateSchool(Request $request, $id)
    {
        $school = School::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'abbreviation' => 'nullable|string|max:50',
            'email' => 'required|email|unique:schools,email,' . $id,
            'password' => 'nullable|string|min:8',
            'subdomain' => 'required|string|max:255|unique:schools,subdomain,' . $id,
            'contact_info' => 'nullable', // Allow array or JSON
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'theme_color' => 'nullable|string|max:7',
            'academic_year' => 'nullable|string|max:255',
            'announcements' => 'nullable|string',
            'address' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'school_banner' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        // If contact_info is a string (JSON), decode it to array for the model
        if (isset($data['contact_info']) && is_string($data['contact_info'])) {
            $data['contact_info'] = json_decode($data['contact_info'], true);
        }

        $passwordChanged = false;
        $rawPassword = null;

        if (!empty($data['password']) && trim($data['password'])) {
            $rawPassword = $data['password'];
            // Hash for School model (no auto-hash cast)
            $data['password'] = \Illuminate\Support\Facades\Hash::make($rawPassword);
            $passwordChanged = true;
        } else {
            unset($data['password']);
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('schools/logos', 'public');
        }

        if ($request->hasFile('school_banner')) {
            $data['school_banner'] = $request->file('school_banner')->store('schools/banners', 'public');
        }

        DB::beginTransaction();
        try {
            $adminUser = \App\Models\User::where('school_id', $school->id)
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'school');
                })->first();

            if (!$adminUser) {
                $adminUser = \App\Models\User::where('email', $school->email)->first();
            }

            if ($adminUser) {
                $adminUser->email = $data['email'];
                $adminUser->name = $data['name'];
                if ($passwordChanged) {
                    // User model has 'hashed' cast, pass RAW password
                    $adminUser->password = $rawPassword;
                }
                $adminUser->save();
            } else {
                // User was never created for this school, create it now!
                $adminUser = \App\Models\User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $passwordChanged ? $rawPassword : 'password123',
                    'school_id' => $school->id,
                    'referral_code' => \App\Models\User::generateReferralCode(),
                ]);
                $adminUser->assignRole('school');
            }

            $school->update($data);
            DB::commit();

            return response()->json(['message' => 'School updated', 'school' => new \App\Http\Resources\SchoolResource($school)]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function showSchool($id)
    {
        return new \App\Http\Resources\SchoolResource(School::findOrFail($id));
    }

    public function createSupplier(CreateSupplierRequest $request)
    {
        $data = $request->validated();
        $rawPassword = $data['password'];
        // Hash for Supplier model (no auto-hash cast)
        $data['password'] = \Illuminate\Support\Facades\Hash::make($rawPassword);

        if (isset($data['contact_info']) && is_string($data['contact_info'])) {
            $data['contact_info'] = json_decode($data['contact_info'], true);
        }

        if ($request->has('shiprocket_pickup_nickname')) {
            $data['shiprocket_pickup_nickname'] = $request->shiprocket_pickup_nickname;
        }

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        DB::beginTransaction();
        try {
            $supplier = Supplier::create($data);

            // User model has 'password' => 'hashed' cast, so pass RAW password
            $user = \App\Models\User::create([
                'name' => $supplier->name,
                'email' => $supplier->email,
                'password' => $rawPassword,
                'supplier_id' => $supplier->id,
                'referral_code' => \App\Models\User::generateReferralCode(),
            ]);
            $user->assignRole('supplier');

            DB::commit();
            return response()->json(['message' => 'Supplier created', 'supplier' => $supplier], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create supplier', 'details' => $e->getMessage()], 500);
        }
    }

    public function updateSupplier(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:suppliers,email,' . $id,
            'password' => 'nullable|string|min:8',
            'contact_info' => 'required|json',
            'priority' => 'nullable|integer|min:0',
        ]);

        $passwordChanged = false;
        $rawPassword = null;

        if (!empty($data['password']) && trim($data['password'])) {
            $rawPassword = $data['password'];
            // Hash for Supplier model (no auto-hash cast)
            $data['password'] = \Illuminate\Support\Facades\Hash::make($rawPassword);
            $passwordChanged = true;
        } else {
            unset($data['password']);
        }

        DB::beginTransaction();
        try {
            $adminUser = \App\Models\User::where('supplier_id', $supplier->id)
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'supplier');
                })->first();

            if (!$adminUser) {
                $adminUser = \App\Models\User::where('email', $supplier->email)->first();
            }

            if ($adminUser) {
                $adminUser->email = $data['email'];
                $adminUser->name = $data['name'];
                if ($passwordChanged) {
                    // User model has 'hashed' cast, pass RAW password
                    $adminUser->password = $rawPassword;
                }
                $adminUser->save();
            } else {
                // User was never created for this supplier, create it now!
                $adminUser = \App\Models\User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $passwordChanged ? $rawPassword : 'password123',
                    'supplier_id' => $supplier->id,
                    'referral_code' => \App\Models\User::generateReferralCode(),
                ]);
                $adminUser->assignRole('supplier');
            }

            $supplier->update($data);
            DB::commit();

            return response()->json(['message' => 'Supplier updated', 'supplier' => $supplier]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function showSupplier($id)
    {
        return response()->json(Supplier::findOrFail($id));
    }

    public function indexSuppliers(Request $request)
    {
        $query = Supplier::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('priority', 'asc')->orderBy('created_at', 'desc')->paginate(20));
    }

    public function allSuppliers()
    {
        return response()->json(Supplier::orderBy('name')->get());
    }

    public function deleteSupplier($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();
        return response()->json(['message' => 'Supplier removed']);
    }

    public function toggleSupplierStatus($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->status = $supplier->status === 'active' ? 'inactive' : 'active';
        $supplier->save();
        return response()->json(['message' => 'Supplier status updated', 'supplier' => $supplier]);
    }

    public function createProduct(CreateProductRequest $request)
    {
        $data = $request->validated();

        if (!$request->has('status')) {
            $data['status'] = 'active';
        }

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
            'product' => new \App\Http\Resources\ProductResource($product)
        ], 201);
    }

    public function indexProducts(Request $request)
    {
        $limit = $request->get('limit', 20);
        $query = Product::with(['supplier', 'category', 'subcategory']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where(function($q) use ($request) {
                $q->where('category_id', $request->category_id)
                  ->orWhere('subcategory_id', $request->category_id);
            });
        }

        if ($request->filled('supplier_id') && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        $products = $query->orderBy('created_at', 'desc')->paginate($limit);
        return \App\Http\Resources\ProductResource::collection($products);
    }

    public function showProduct($id)
    {
        $product = Product::with(['supplier', 'category', 'subcategory'])->findOrFail($id);
        return new \App\Http\Resources\ProductResource($product);
    }

    public function deleteProduct($id)
    {
        $product = Product::findOrFail($id);

        // Remove constrained order items to prevent SQL 1451
        \App\Models\OrderItem::where('product_id', $product->id)->delete();
        \App\Models\SchoolProduct::where('product_id', $product->id)->delete();

        // Optional: Remove product images from storage if needed
        if (is_array($product->images)) {
            foreach ($product->images as $img) {
                if (!str_starts_with($img, 'http')) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($img);
                }
            }
        }

        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $dummyReq = new \App\Http\Requests\Product\CreateProductRequest();
        $dummyReq->setUserResolver($request->getUserResolver());
        $rules = $dummyReq->rules();
        $rules['sku'] = 'nullable|string|max:100|unique:products,sku,' . $id;
        $rules['category_id'] = 'nullable|exists:categories,id';
        $rules['subcategory_id'] = 'nullable|exists:categories,id';
        $rules['supplier_id'] = 'nullable|exists:suppliers,id';
        $rules['name'] = 'nullable|string|max:255';
        $rules['base_price'] = 'nullable|numeric|min:0';
        $rules['stock_quantity'] = 'nullable|integer|min:0';

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
            'message' => 'Product updated successfully',
            'product' => new \App\Http\Resources\ProductResource($product)
        ]);
    }

    public function toggleProductStatus($id)
    {
        $product = Product::findOrFail($id);
        $product->status = $product->status === 'active' ? 'inactive' : 'active';
        $product->save();
        return response()->json(['message' => 'Product status updated', 'product' => $product]);
    }

    public function analytics()
    {
        // Admin metrics: Total Sales, School-wise Revenue, etc.
        $totalSales = \App\Models\Order::whereIn('payment_status', ['paid', 'pending'])->sum('total_amount');
        $totalOrders = \App\Models\Order::whereIn('payment_status', ['paid', 'pending'])->count();

        $schoolRevenue = DB::table('orders')
            ->join('schools', 'schools.id', '=', 'orders.school_id')
            ->whereIn('orders.payment_status', ['paid', 'pending'])
            ->select('schools.name', DB::raw('sum(orders.total_amount) as total_revenue'))
            ->groupBy('schools.name')
            ->get();

        $totalSchools = \App\Models\School::count();
        $activeSchools = \App\Models\School::where('status', 'active')->count();
        $totalSuppliers = \App\Models\Supplier::count();
        $totalProducts = \App\Models\Product::count();

        $lowStockProducts = \App\Models\Product::whereRaw('stock_quantity <= low_stock_threshold')->count();
        $pendingSettlementsCount = \App\Models\Settlement::where('status', 'pending')->count();
        $pendingSettlementsAmount = \App\Models\Settlement::where('status', 'pending')->sum('commission_amount');

        $recentOrders = \App\Models\Order::whereIn('payment_status', ['paid', 'pending'])
            ->with(['school', 'customer'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'total_sales' => $totalSales,
            'total_orders' => $totalOrders,
            'school_revenue' => $schoolRevenue,
            'total_schools' => $totalSchools,
            'active_schools' => $activeSchools,
            'total_suppliers' => $totalSuppliers,
            'total_products' => $totalProducts,
            'low_stock_products' => $lowStockProducts,
            'pending_settlements_count' => $pendingSettlementsCount,
            'pending_settlements_amount' => $pendingSettlementsAmount,
            'recent_orders' => $recentOrders,
        ]);
    }

    public function settlements(Request $request)
    {
        return response()->json(
            Settlement::with(['school', 'supplier', 'order'])
                ->orderBy('created_at', 'desc')
                ->paginate((int) $request->query('per_page', 20))
        );
    }

    /**
     * @return array{schools: \Illuminate\Support\Collection, suppliers: \Illuminate\Support\Collection}
     */
    protected function settlementsSummaryPayload(): array
    {
        $schools = School::query()
            ->orderBy('name')
            ->get()
            ->map(function (School $school) {
                $unsettled = (float) Settlement::query()
                    ->where('school_id', $school->id)
                    ->whereNull('supplier_id')
                    ->where('status', 'pending')
                    ->sum('commission_amount');
                $pendingCount = (int) Settlement::query()
                    ->where('school_id', $school->id)
                    ->whereNull('supplier_id')
                    ->where('status', 'pending')
                    ->count();

                return [
                    'id' => $school->id,
                    'name' => $school->name,
                    'subdomain' => $school->subdomain,
                    'unsettled' => $unsettled,
                    'pending_settlement_count' => $pendingCount,
                ];
            })
            ->values();

        $suppliers = Supplier::query()
            ->orderBy('name')
            ->get()
            ->map(function (Supplier $supplier) {
                $wallet = Wallet::resolveFor($supplier);
                // Backfill for legacy orders (created before wallet crediting existed or when order_items.base_price was missing).
                // Only do this once per wallet to avoid double crediting.
                $hasAnyTx = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)->exists();
                if (! $hasAnyTx && (float) $wallet->balance <= 0) {
                    $computed = (float) DB::table('order_items')
                        ->join('orders', 'orders.id', '=', 'order_items.order_id')
                        ->join('products', 'products.id', '=', 'order_items.product_id')
                        ->where('products.supplier_id', $supplier->id)
                        ->where('orders.payment_status', 'paid')
                        ->sum(DB::raw('COALESCE(order_items.base_price, products.base_price) * order_items.quantity'));

                    $computed = round($computed, 2);
                    if ($computed > 0) {
                        $wallet->credit($computed, 'Backfill credits from paid orders', 'BACKFILL');
                    }
                }

                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'unsettled' => (float) $wallet->fresh()->balance,
                    'wallet_id' => $wallet->id,
                ];
            })
            ->values();

        return [
            'schools' => $schools,
            'suppliers' => $suppliers,
        ];
    }

    /**
     * Cards for Schools / Suppliers tabs: pending commission per school; wallet balance per supplier.
     */
    public function settlementsSummary()
    {
        $payload = $this->settlementsSummaryPayload();

        return response()->json([
            'schools' => $payload['schools'],
            'suppliers' => $payload['suppliers'],
        ]);
    }

    /**
     * Mark every pending school commission row (per-order) as settled in one lump payment.
     */
    public function bulkSettleSchool(Request $request)
    {
        $data = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'payment_mode' => 'nullable|string|max:255',
            'reference_id' => 'nullable|string|max:255',
            'payment_notes' => 'nullable|string',
        ]);

        $updated = Settlement::query()
            ->where('school_id', $data['school_id'])
            ->whereNull('supplier_id')
            ->where('status', 'pending')
            ->update([
                'status' => 'settled',
                'settled_date' => now(),
                'payment_mode' => $data['payment_mode'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'payment_notes' => $data['payment_notes'] ?? null,
            ]);

        return response()->json([
            'message' => 'Pending school settlements marked as settled.',
            'rows_updated' => $updated,
        ]);
    }

    /**
     * Record a lump payout to a supplier: optional wallet debit + one settlement row (supplier).
     */
    public function bulkSettleSupplier(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_mode' => 'nullable|string|max:255',
            'reference_id' => 'nullable|string|max:255',
            'payment_notes' => 'nullable|string',
            'debit_wallet' => 'nullable|boolean',
        ]);

        $supplier = Supplier::findOrFail($data['supplier_id']);
        $wallet = Wallet::resolveFor($supplier);
        $amount = round((float) $data['amount'], 2);
        $debit = $data['debit_wallet'] ?? true;

        if ($debit && $amount > (float) $wallet->balance) {
            return response()->json(['error' => 'Amount exceeds supplier wallet balance.'], 422);
        }

        $settlement = null;

        DB::transaction(function () use ($data, $wallet, $amount, $supplier, $debit, &$settlement) {
            if ($debit) {
                $wallet->debit(
                    $amount,
                    'Lump settlement payout (admin)',
                    $data['reference_id'] ?? null
                );
            }

            $settlement = Settlement::create([
                'school_id' => null,
                'supplier_id' => $supplier->id,
                'order_id' => null,
                'commission_amount' => $amount,
                'status' => 'settled',
                'settled_date' => now(),
                'payment_mode' => $data['payment_mode'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'payment_notes' => $data['payment_notes'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Supplier payout recorded.',
            'settlement' => $settlement?->load('supplier'),
            'wallet_balance' => $wallet->fresh()->balance,
        ]);
    }

    /**
     * Export tab data as an Excel-friendly table (.xls HTML).
     */
    public function exportSettlements(Request $request)
    {
        $request->validate(['tab' => 'required|in:all,schools,suppliers']);

        $tab = $request->query('tab');
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('settlements_' . $tab);

            if ($tab === 'all') {
                $sheet->fromArray([
                    ['ID', 'Type', 'School', 'Supplier', 'Order', 'Amount', 'Status', 'Created', 'Payment mode', 'Reference'],
                ], null, 'A1');

                $rows = Settlement::with(['school', 'supplier', 'order'])->orderByDesc('created_at')->get();
                $r = 2;
                foreach ($rows as $s) {
                    $type = $s->supplier_id ? 'Supplier' : 'School';
                    $school = $s->school?->name ?? '';
                    $supplier = $s->supplier?->name ?? '';
                    $order = $s->order_id ? (string) $s->order_id : '';
                    $sheet->fromArray([[
                        (int) $s->id,
                        $type,
                        $school,
                        $supplier,
                        $order,
                        (float) $s->commission_amount,
                        (string) $s->status,
                        (string) $s->created_at,
                        (string) ($s->payment_mode ?? ''),
                        (string) ($s->reference_id ?? ''),
                    ]], null, 'A' . $r);
                    $r++;
                }
            } elseif ($tab === 'schools') {
                $sheet->fromArray([
                    ['School ID', 'Name', 'Subdomain', 'Unsettled (₹)', 'Pending rows'],
                ], null, 'A1');

                $summary = collect($this->settlementsSummaryPayload()['schools']);
                $r = 2;
                foreach ($summary as $row) {
                    if ((float) ($row['unsettled'] ?? 0) <= 0 && (int) ($row['pending_settlement_count'] ?? 0) <= 0) {
                        continue;
                    }
                    $sheet->fromArray([[
                        (int) $row['id'],
                        (string) $row['name'],
                        (string) ($row['subdomain'] ?? ''),
                        (float) ($row['unsettled'] ?? 0),
                        (int) ($row['pending_settlement_count'] ?? 0),
                    ]], null, 'A' . $r);
                    $r++;
                }
            } else {
                $sheet->fromArray([
                    ['Supplier ID', 'Name', 'Email', 'Wallet unsettled (₹)', 'Wallet ID'],
                ], null, 'A1');

                $summary = collect($this->settlementsSummaryPayload()['suppliers']);
                $r = 2;
                foreach ($summary as $row) {
                    if ((float) ($row['unsettled'] ?? 0) <= 0) {
                        continue;
                    }
                    $sheet->fromArray([[
                        (int) $row['id'],
                        (string) $row['name'],
                        (string) ($row['email'] ?? ''),
                        (float) ($row['unsettled'] ?? 0),
                        (int) ($row['wallet_id'] ?? 0),
                    ]], null, 'A' . $r);
                    $r++;
                }
            }

            foreach (range('A', $sheet->getHighestColumn()) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $filename = 'settlements-' . $tab . '-' . now()->format('Y-m-d_His') . '.xlsx';
            $writer = new Xlsx($spreadsheet);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Export failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function updateSettlementStatus(Request $request, $id)
    {
        $settlement = Settlement::findOrFail($id);
        $request->validate(['status' => 'required|in:pending,settled']);

        $settlement->update([
            'status' => $request->status,
            'settled_date' => $request->status === 'settled' ? now() : null,
        ]);

        return response()->json(['message' => 'Settlement status updated successfully', 'settlement' => $settlement]);
    }

    public function deleteSettlement($id)
    {
        $settlement = Settlement::findOrFail($id);
        $settlement->delete();

        return response()->json(['message' => 'Settlement record deleted']);
    }

    public function storeSettlement(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'order_id' => 'nullable|exists:orders,id',
            'commission_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,settled',
            'payment_mode' => 'nullable|string|max:255',
            'reference_id' => 'nullable|string|max:255',
            'payment_notes' => 'nullable|string',
            'debit_wallet' => 'nullable|boolean',
        ]);

        if (empty($validated['school_id']) && empty($validated['supplier_id'])) {
            throw ValidationException::withMessages([
                'school_id' => 'Provide either school_id or supplier_id.',
            ]);
        }
        if (! empty($validated['school_id']) && ! empty($validated['supplier_id'])) {
            throw ValidationException::withMessages([
                'school_id' => 'Cannot set both school_id and supplier_id on one settlement.',
            ]);
        }

        $debitWallet = array_key_exists('debit_wallet', $validated)
            ? (bool) $validated['debit_wallet']
            : (! empty($validated['supplier_id']) && $validated['status'] === 'settled');

        $settlement = null;

        DB::transaction(function () use ($validated, $debitWallet, &$settlement) {
            if (! empty($validated['supplier_id']) && $debitWallet && $validated['status'] === 'settled') {
                $supplier = Supplier::findOrFail($validated['supplier_id']);
                $wallet = Wallet::resolveFor($supplier);
                $amount = round((float) $validated['commission_amount'], 2);
                if ($amount > (float) $wallet->balance) {
                    throw ValidationException::withMessages([
                        'commission_amount' => 'Amount exceeds supplier wallet balance.',
                    ]);
                }
                $wallet->debit(
                    $amount,
                    'Manual lump settlement (admin)',
                    $validated['reference_id'] ?? null
                );
            }

            $settlement = Settlement::create([
                'school_id' => $validated['school_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'order_id' => $validated['order_id'] ?? null,
                'commission_amount' => $validated['commission_amount'],
                'status' => $validated['status'],
                'settled_date' => $validated['status'] === 'settled' ? now() : null,
                'payment_mode' => $validated['payment_mode'] ?? null,
                'reference_id' => $validated['reference_id'] ?? null,
                'payment_notes' => $validated['payment_notes'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Settlement created successfully',
            'settlement' => $settlement->load(['school', 'supplier']),
        ], 201);
    }

    public function indexCategories()
    {
        $categories = \App\Models\Category::with(['children' => function($q) {
                $q->orderBy('sort_order')->orderBy('name');
            }])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return \App\Http\Resources\CategoryResource::collection($categories);
    }

    public function allCategories()
    {
        $categories = \App\Models\Category::with('children')->orderBy('sort_order')->orderBy('name')->get();
        return \App\Http\Resources\CategoryResource::collection($categories);
    }

    public function createCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'icon_svg' => 'nullable|string',
            'gst_percentage' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
        ]);

        $categoryData = [
            'name' => $validated['name'],
            'slug' => \Illuminate\Support\Str::slug($validated['name']),
            'parent_id' => $validated['parent_id'] ?? null,
            'icon_svg' => $request->input('icon_svg'),
            'gst_percentage' => $validated['gst_percentage'] ?? 0,
            'sort_order' => $validated['sort_order'] ?? 0,
        ];

        if ($request->hasFile('image')) {
            $categoryData['image'] = $request->file('image')->store('categories', 'public');
        }

        $category = \App\Models\Category::create($categoryData);

        return response()->json([
            'message' => 'Category created', 
            'category' => new \App\Http\Resources\CategoryResource($category->load('children'))
        ], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = \App\Models\Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'icon_svg' => 'nullable|string',
            'gst_percentage' => 'nullable|numeric|min:0|max:100',
            'sort_order' => 'nullable|integer',
        ]);

        // Prevent setting parent to self or own child
        if (isset($validated['parent_id']) && $validated['parent_id'] == $id) {
            return response()->json(['error' => 'A category cannot be its own parent'], 400);
        }

        $category->name = $validated['name'];
        $category->parent_id = $request->input('parent_id') ?: null;
        $category->icon_svg = $request->input('icon_svg', $category->icon_svg);
        $category->gst_percentage = $request->input('gst_percentage', 0);
        $category->sort_order = $request->input('sort_order', 0);

        if ($request->hasFile('image')) {
            if ($category->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($category->image);
            }
            $category->image = $request->file('image')->store('categories', 'public');
        }

        $category->save();

        return response()->json([
            'message' => 'Category updated', 
            'category' => new \App\Http\Resources\CategoryResource($category->fresh()->load('children'))
        ]);
    }

    public function deleteCategory($id)
    {
        $category = \App\Models\Category::findOrFail($id);

        // Check if category or its children have products
        $categoryIds = collect([$id]);
        $childIds = \App\Models\Category::where('parent_id', $id)->pluck('id');
        $categoryIds = $categoryIds->merge($childIds);

        $hasProducts = \App\Models\Product::whereIn('category_id', $categoryIds)->exists();
        if ($hasProducts) {
            return response()->json(['error' => 'Cannot delete category with associated products'], 400);
        }

        $category->delete(); // cascade will delete children
        return response()->json(['message' => 'Category removed']);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $setting) {
            \App\Models\PlatformSetting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => (string)($setting['value'] ?? '')]
            );
        }

        // Clear settings cache
        \Illuminate\Support\Facades\Cache::forget('platform_settings');

        \Illuminate\Support\Facades\Cache::forget('platform_settings');

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function indexOrders()
    {
        $orders = Order::whereIn('payment_status', ['paid', 'pending', 'failed'])
            ->with(['customer', 'school', 'items.product.supplier', 'items.product.subcategory'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return OrderResource::collection($orders);
    }

    public function showOrder($id)
    {
        $order = Order::with(['customer', 'school', 'items.product.supplier', 'items.product.subcategory'])->findOrFail($id);
        return new OrderResource($order);
    }

    // 🚩 Homepage Banner Management
    public function indexBanners()
    {
        return \App\Http\Resources\HomepageBannerResource::collection(
            \App\Models\HomepageBanner::orderBy('order')->get()
        );
    }

    public function storeBanner(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'button_text' => 'nullable|string|max:50',
            'button_link' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $validated['image_path'] = $path;
        }

        $validated['is_active'] = true;

        $banner = \App\Models\HomepageBanner::create($validated);
        return response()->json(['message' => 'Banner created', 'banner' => $banner], 201);
    }

    public function deleteBanner($id)
    {
        $banner = \App\Models\HomepageBanner::findOrFail($id);
        if ($banner->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();
        return response()->json(['message' => 'Banner deleted']);
    }

    // Shiprocket Management
    public function getShiprocketPickups()
    {
        $logistics = app(\App\Services\LogisticsService::class);
        $pickups = $logistics->getPickupLocations();
        return response()->json($pickups);
    }

    public function updateSupplierShiprocketConfig(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $data = $request->validate([
            'shiprocket_pickup_nickname' => 'required|string|max:255',
        ]);

        $supplier->update($data);
        return response()->json(['message' => 'Supplier Shiprocket nickname updated', 'supplier' => $supplier]);
    }

    // ── Wallet & Payments ──────────────────────────────────────────────
    public function walletsIndex(Request $request)
    {
        $type = $request->query('type'); // school or supplier
        $query = \App\Models\Wallet::with('owner');

        if ($type === 'school') {
            $query->where('owner_type', \App\Models\School::class);
        } elseif ($type === 'supplier') {
            $query->where('owner_type', \App\Models\Supplier::class);
        }

        return response()->json($query->paginate(20));
    }

    public function walletTransactions($id)
    {
        $wallet = \App\Models\Wallet::with(['transactions' => function ($q) {
            $q->latest();
        }])->findOrFail($id);

        return response()->json($wallet);
    }

    public function releasePayout(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string',
            'reference_id' => 'nullable|string'
        ]);

        $wallet = \App\Models\Wallet::findOrFail($id);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            $transaction = $wallet->debit(
                $request->amount,
                "Payout Released: " . $request->description,
                $request->reference_id
            );

            $transaction->update(['type' => 'payout']);
            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'message' => 'Payout released successfully',
                'balance' => $wallet->balance
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
    public function getNotifications(Request $request)
    {
        $latestOrders = Order::where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $lowStockProducts = Product::where('status', 'active')
            ->where(function($query) {
                $query->whereRaw('stock_quantity <= low_stock_threshold')
                      ->orWhere('stock_quantity', '<', 5);
            })
            ->orderBy('stock_quantity', 'asc')
            ->limit(5)
            ->get();

        $notifications = [];

        foreach ($latestOrders as $order) {
            $notifications[] = [
                'id' => 'order_' . $order->id,
                'type' => 'order',
                'title' => 'New Order #' . $order->order_number,
                'message' => 'Total: ₹' . number_format($order->total_amount, 2),
                'link' => '/admin/orders',
                'created_at' => $order->created_at->diffForHumans()
            ];
        }

        foreach ($lowStockProducts as $product) {
            $notifications[] = [
                'id' => 'stock_' . $product->id,
                'type' => 'stock',
                'title' => 'Low Stock: ' . $product->name,
                'message' => 'Only ' . $product->stock_quantity . ' left in stock.',
                'link' => '/admin/products',
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
