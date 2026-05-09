<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\TestimonialController;

// Auth Routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('register-school', [AuthController::class, 'registerSchool']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    Route::post('profile', [AuthController::class, 'updateProfile'])->middleware('auth:sanctum');
    Route::post('validate-referral', [AuthController::class, 'validateReferralCode']);
    Route::get('my-referrals', [AuthController::class, 'myReferrals'])->middleware('auth:sanctum');
});

// Payment Webhook (Public, No CSRF)
Route::post('payment/webhook/{provider}', [PaymentWebhookController::class, 'handle']);

Route::get('categories', function () {
    return \Illuminate\Support\Facades\Cache::remember('categories_tree_res', 3600, function() {
        $cats = \App\Models\Category::with(['children' => function($q) {
                $q->orderBy('sort_order')->orderBy('name');
            }])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
        return \App\Http\Resources\CategoryResource::collection($cats);
    });
});

Route::get('categories/all', function () {
    return \Illuminate\Support\Facades\Cache::remember('categories_all_res', 3600, function() {
        $cats = \App\Models\Category::orderBy('sort_order')->orderBy('name')->get();
        return \App\Http\Resources\CategoryResource::collection($cats);
    });
});

Route::get('settings', function () {
    $settings = \Illuminate\Support\Facades\Cache::remember('platform_settings', 3600, function() {
        return \App\Models\PlatformSetting::pluck('value', 'key')->all();
    });
    $settings['active_payment_gateway'] = config('app.active_payment_gateway', 'razorpay');
    return $settings;
});

Route::get('static-pages', [\App\Http\Controllers\StaticPageController::class, 'index']);
Route::get('static-pages/{slug}', [\App\Http\Controllers\StaticPageController::class, 'show']);

Route::post('reviews/store', [ReviewController::class, 'store'])->middleware('auth:sanctum');

// Public Storefront Routes (Resolvable by Domain)
Route::middleware(['school.resolve'])->group(function () {
    Route::get('school/info', [App\Http\Controllers\Api\SchoolController::class, 'getPublicInfo']);
    Route::get('products', [App\Http\Controllers\Api\ProductController::class, 'index']);
    Route::get('products/{id}', [App\Http\Controllers\Api\ProductController::class, 'show']);

    // Authenticated Customer/Parent Routes (Require School Scope)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('order/create', [App\Http\Controllers\Api\OrderController::class, 'create']);
        Route::post('order/preview', [App\Http\Controllers\Api\OrderController::class, 'previewOrder']);
        Route::post('order/verify', [App\Http\Controllers\Api\OrderController::class, 'verify']);
        Route::post('order/abandon-payment', [App\Http\Controllers\Api\OrderController::class, 'abandonPayment']);
        Route::post('order/calculate-shipping', [App\Http\Controllers\Api\OrderController::class, 'calculateShipping']);
        Route::get('my-orders', [App\Http\Controllers\Api\OrderController::class, 'index']);
        Route::get('order/{id}', [App\Http\Controllers\Api\OrderController::class, 'show']);
        Route::get('order/{id}/track', [App\Http\Controllers\Api\OrderController::class, 'trackOrder']);

        // Shipping Configuration (Only for Owners/Providers)
        Route::get('shipping/providers', [ShippingController::class, 'getProviders']);
        Route::get('shipping/my-configs', [ShippingController::class, 'getMyConfigs']);
        Route::post('shipping/my-configs', [ShippingController::class, 'saveConfig']);
    });
});


// School Admin Routes
Route::middleware(['auth:sanctum', 'role:school', 'school.resolve'])->prefix('school')->group(function () {
    Route::get('master-catalog', [SchoolController::class, 'getMasterCatalog']);
    Route::post('select-product', [SchoolController::class, 'selectProduct']);
    Route::delete('remove-product/{id}', [SchoolController::class, 'removeProduct']);
    Route::get('orders', [SchoolController::class, 'orders']);
    Route::get('reports', [SchoolController::class, 'reports']);
    Route::get('settlements', [SchoolController::class, 'settlements']);
    Route::post('profile', [SchoolController::class, 'updateProfile']);
    Route::post('import-students', [SchoolController::class, 'importStudents']);
    Route::get('notifications', [SchoolController::class, 'getNotifications']);
    Route::post('notifications/read', [SchoolController::class, 'markNotificationsRead']);
});

// Supplier Routes
Route::middleware(['auth:sanctum', 'role:supplier'])->prefix('supplier')->group(function () {
    Route::get('products', [SupplierController::class, 'indexProducts']);
    Route::post('product', [SupplierController::class, 'createProduct']);
    Route::get('product/{id}', [SupplierController::class, 'showProduct']);
    Route::patch('product/{id}/stock', [SupplierController::class, 'updateProductStock']);
    Route::match(['post', 'put'], 'product/{id}', [SupplierController::class, 'updateProduct']);
    Route::delete('product/{id}', [SupplierController::class, 'deleteProduct']);
    Route::get('orders', [SupplierController::class, 'orders']);
    Route::get('reports', [SupplierController::class, 'reports']);
    Route::patch('order/{id}/dispatch', [SupplierController::class, 'dispatchOrder']);
    Route::get('shipment/track/{awb}', [SupplierController::class, 'trackShipment']);
    Route::get('shipment/label/{shipmentId}', [SupplierController::class, 'getShipmentLabel']);

    // Shiprocket fulfillment (auto-courier matches Shiprocket panel; couriers/{id} is optional diagnostics only)
    Route::post('shiprocket/ship-and-dispatch/{id}', [SupplierController::class, 'shiprocketShipAndDispatch']);
    Route::post('shiprocket/create-order/{id}', [SupplierController::class, 'shiprocketCreateOrder']);
    Route::get('shiprocket/couriers/{id}', [SupplierController::class, 'shiprocketServiceability']);
    Route::post('shiprocket/fulfill/{id}', [SupplierController::class, 'shiprocketFulfill']);
    Route::post('shiprocket/cancel/{id}', [SupplierController::class, 'shiprocketCancel']);

    // Supplier cancellation (local only)
    Route::post('order-item/cancel/{id}', [SupplierController::class, 'cancelOrderItem']);

    // School Setups for Supplier
    Route::get('school-setups', [SupplierController::class, 'schoolSetups']);
    Route::get('school-catalog/{schoolId}', [SupplierController::class, 'schoolCatalog']);
    Route::get('school-setup-details/{schoolProductId}', [SupplierController::class, 'schoolSetupDetails']);
    Route::post('save-pickup-location', [SupplierController::class, 'savePickupLocation']);
    Route::get('notifications', [SupplierController::class, 'getNotifications']);
    Route::post('notifications/read', [SupplierController::class, 'markNotificationsRead']);
});

// Super Admin Routes
Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')->group(function () {
    Route::get('schools', [AdminController::class, 'indexSchools']);
    Route::get('schools/{id}', [AdminController::class, 'showSchool']);
    Route::post('create-school', [AdminController::class, 'createSchool']);
    Route::patch('school/{id}/status', [AdminController::class, 'toggleSchoolStatus']);
    Route::delete('school/{id}', [AdminController::class, 'deleteSchool']);
    Route::match(['post', 'put'], 'school/{id}', [AdminController::class, 'updateSchool']);

    Route::get('suppliers', [AdminController::class, 'indexSuppliers']);
    Route::get('suppliers/{id}', [AdminController::class, 'showSupplier']);
    Route::post('create-supplier', [AdminController::class, 'createSupplier']);
    Route::patch('supplier/{id}/status', [AdminController::class, 'toggleSupplierStatus']);
    Route::delete('supplier/{id}', [AdminController::class, 'deleteSupplier']);
    Route::match(['post', 'put'], 'supplier/{id}', [AdminController::class, 'updateSupplier']);
    Route::get('suppliers/all', [AdminController::class, 'allSuppliers']);

    Route::get('products', [AdminController::class, 'indexProducts']);
    Route::get('products/{id}', [AdminController::class, 'showProduct']);
    Route::post('create-product', [AdminController::class, 'createProduct']);
    Route::patch('product/{id}/status', [AdminController::class, 'toggleProductStatus']);
    Route::delete('product/{id}', [AdminController::class, 'deleteProduct']);

    Route::match(['post', 'put'], 'product/{id}', [AdminController::class, 'updateProduct']);
    Route::get('categories', [AdminController::class, 'indexCategories']);
    Route::post('create-category', [AdminController::class, 'createCategory']);
    Route::match(['post', 'put'], 'category/{id}', [AdminController::class, 'updateCategory']);
    Route::delete('category/{id}', [AdminController::class, 'deleteCategory']);
    Route::get('categories/all', [AdminController::class, 'allCategories']);
    Route::get('analytics', [AdminController::class, 'analytics']);
    Route::get('settlements/summary', [AdminController::class, 'settlementsSummary']);
    Route::get('settlements/export', [AdminController::class, 'exportSettlements']);
    Route::post('settlements/bulk-school', [AdminController::class, 'bulkSettleSchool']);
    Route::post('settlements/bulk-supplier', [AdminController::class, 'bulkSettleSupplier']);
    Route::get('settlements', [AdminController::class, 'settlements']);
    Route::post('settlements', [AdminController::class, 'storeSettlement']);
    Route::patch('settlements/{id}/status', [AdminController::class, 'updateSettlementStatus']);
    Route::delete('settlements/{id}', [AdminController::class, 'deleteSettlement']);
    Route::get('orders', [AdminController::class, 'indexOrders']);
    Route::get('order/{id}', [AdminController::class, 'showOrder']);
    Route::post('settings', [AdminController::class, 'updateSettings']);

    // Shiprocket Settings
    Route::get('shipping/shiprocket/pickups', [AdminController::class, 'getShiprocketPickups']);
    Route::post('supplier/{id}/shiprocket-config', [AdminController::class, 'updateSupplierShiprocketConfig']);

    // Banner Management
    Route::get('banners', [AdminController::class, 'indexBanners']);
    Route::post('banners', [AdminController::class, 'storeBanner']);
    Route::delete('banners/{id}', [AdminController::class, 'deleteBanner']);

    Route::post('static-pages', [\App\Http\Controllers\StaticPageController::class, 'updateOrCreate']);

    // Review Management
    Route::get('reviews', [ReviewController::class, 'index']);
    Route::patch('review/{id}/status', [ReviewController::class, 'updateStatus']);
    Route::delete('review/{id}', [ReviewController::class, 'destroy']);
    // Testimonial Management
    Route::get('testimonials', [TestimonialController::class, 'adminIndex']);
    Route::post('testimonials', [TestimonialController::class, 'store']);
    Route::get('testimonials/{id}', [TestimonialController::class, 'show']);
    Route::match(['post', 'put'], 'testimonials/{id}', [TestimonialController::class, 'update']);
    Route::delete('testimonials/{id}', [TestimonialController::class, 'destroy']);

    // Wallet & Payouts
    Route::get('/wallets', [AdminController::class, 'walletsIndex']);
    Route::get('/wallets/{id}/transactions', [AdminController::class, 'walletTransactions']);
    Route::post('/wallets/{id}/payout', [AdminController::class, 'releasePayout']);
    Route::get('notifications', [AdminController::class, 'getNotifications']);
    Route::post('notifications/read', [AdminController::class, 'markNotificationsRead']);
});

// Global Public Routes
Route::get('homepage/banners', function () {
    $banners = \App\Models\HomepageBanner::where('is_active', true)->orderBy('order')->get();
    return \App\Http\Resources\HomepageBannerResource::collection($banners);
});

Route::get('homepage/partners', function () {
    $schools = \App\Models\School::where('status', 'active')->orderBy('name')->get();
    return \App\Http\Resources\SchoolResource::collection($schools);
});

Route::get('testimonials', [TestimonialController::class, 'index']);