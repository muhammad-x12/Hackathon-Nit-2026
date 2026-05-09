<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\SelectProductRequest;
use App\Models\SchoolProduct;
use App\Models\Product;
use App\Models\Order;
use App\Models\Settlement;
use App\Http\Resources\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    /**
     * School dashboard: resolve target school from subdomain/header or the admin's own school, and ensure the user belongs to it.
     */
    private function resolveAuthorizedSchool(Request $request): ?\App\Models\School
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $school = $request->get('school') ?? $user->school;
        if (! $school) {
            return null;
        }

        if ((int) ($user->school_id ?? 0) !== (int) $school->id) {
            return null;
        }

        return $school;
    }

    public function getPublicInfo(Request $request)
    {
        $school = $request->get('school');

        if (!$school) {
            return response()->json(null);
        }

        return response()->json(new \App\Http\Resources\SchoolResource($school));
    }

    public function selectProduct(SelectProductRequest $request)
    {
        $school = $request->get('school');

        $product = Product::findOrFail($request->product_id);

        if ($product->status !== 'active') {
            return response()->json(['error' => 'Cannot list inactive product.'], 400);
        }

        // Prepare data for updateOrCreate
        $data = [
            'school_margin' => $request->school_margin,
            'is_active' => true,
        ];

        if ($request->has('required_qty')) {
            $data['required_qty'] = $request->required_qty;
        }

        if ($request->hasFile('custom_logo')) {
            $path = $request->file('custom_logo')->store('schools/custom_logos', 'public');
            $data['custom_logo_path'] = $path;
        }

        if ($request->has('custom_logo_position')) {
            $data['custom_logo_position'] = $request->custom_logo_position;
        }

        if ($request->has('custom_text')) {
            $data['custom_text'] = $request->custom_text;
        }

        if ($request->has('custom_text_position')) {
            $data['custom_text_position'] = $request->custom_text_position;
        }

        if ($request->hasFile('rendered_images')) {
            $paths = [];
            foreach ($request->file('rendered_images') as $file) {
                $path = $file->store('schools/rendered_products', 'public');
                $paths[] = $path;
            }
            $data['rendered_images'] = $paths;
        }

        // Add or update SchoolProduct
        $schoolProduct = SchoolProduct::updateOrCreate(
            ['school_id' => $school->id, 'product_id' => $product->id],
            $data
        );

        return response()->json(['message' => 'Product added to school catalog', 'data' => $schoolProduct]);
    }
    public function getMasterCatalog(Request $request)
    {
        $school = $request->get('school');

        $products = Product::where('status', 'active')
            ->with([
                'schoolProducts' => function ($query) use ($school) {
                    $query->where('school_id', $school->id);
                },
                'category',
                'subcategory'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return \App\Http\Resources\ProductResource::collection($products);
    }

    public function removeProduct(Request $request, $id)
    {
        $school = $request->get('school');
        SchoolProduct::where('school_id', $school->id)->where('product_id', $id)->delete();
        return response()->json(['message' => 'Product removed from catalog']);
    }

    public function orders(Request $request)
    {
        $school = $this->resolveAuthorizedSchool($request);
        if (! $school) {
            return response()->json(['error' => 'Unauthorized or school not found.'], 403);
        }

        $sid = (int) $school->id;

        // Storefront school on the order OR customer (student/parent) belonging to this school — covers subdomain vs main-domain checkout edge cases.
        $orders = Order::query()
            ->where(function ($q) use ($sid) {
                $q->where('school_id', $sid)
                    ->orWhereHas('customer', function ($cq) use ($sid) {
                        $cq->where('school_id', $sid);
                    });
            })
            ->with(['items.product', 'customer'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function reports(Request $request)
    {
        $school = $this->resolveAuthorizedSchool($request);
        if (! $school) {
            return response()->json(['error' => 'Unauthorized or school not found.'], 403);
        }

        // Aggregated reports: Total Orders, Total Revenue (School Margin share?), etc.
        // Revenue logic: sum(order_items.quantity * final_price) but how much is school's share?
        // Settlement calculates commission.
        // Actually, report logic:
        // Total orders count
        // Total settled commission? Or total sales value?
        // "School metrics: Total Orders, Earnings, Pending Commissions, Top Products"

        $totalOrders = Order::where('school_id', $school->id)->where('payment_status', 'paid')->count();

        $earnings = Settlement::where('school_id', $school->id)
            ->where('status', 'settled')
            ->sum('commission_amount');

        $pendingCommissions = Settlement::where('school_id', $school->id)
            ->where('status', 'pending')
            ->sum('commission_amount');

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.school_id', $school->id)
            ->where('orders.payment_status', 'paid')
            ->select('products.name', DB::raw('sum(order_items.quantity) as total_sold'))
            ->groupBy('products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'total_orders' => $totalOrders,
            'earnings' => $earnings,
            'pending_commissions' => $pendingCommissions,
            'top_products' => $topProducts,
        ]);
    }
    public function settlements(Request $request)
    {
        $school = $this->resolveAuthorizedSchool($request);
        if (! $school) {
            return response()->json(['error' => 'Unauthorized or school not found.'], 403);
        }

        $settlements = Settlement::where('school_id', $school->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($settlements);
    }

    public function updateProfile(\App\Http\Requests\School\UpdateSchoolProfileRequest $request)
    {
        $school = $request->user()->school;

        if (!$school) {
            return response()->json(['error' => 'School not found'], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('schools/logos', 'public');
            $data['logo'] = $path;
        }

        if ($request->hasFile('school_banner')) {
            $path = $request->file('school_banner')->store('schools/banners', 'public');
            $data['school_banner'] = $path;
        }

        $school->update($data);

        return response()->json([
            'message' => 'School profile updated',
            'school' => new \App\Http\Resources\SchoolResource($school)
        ]);
    }

    public function importStudents(Request $request)
    {
        $school = $this->resolveAuthorizedSchool($request);
        if (! $school) {
            return response()->json(['error' => 'Unauthorized or school not found.'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $successCount = 0;
        $row = 1;

        if (($handle = fopen($path, "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                // Skip header row
                if ($row === 1 && in_array(strtolower($data[0]), ['name', 'full name', 'first name'])) {
                    $row++;
                    continue;
                }

                // Assuming format: Name, Email, Password
                if (count($data) >= 3) {
                    $name = trim($data[0]);
                    $email = trim($data[1]);
                    $password = trim($data[2]);

                    if ($name && $email && filter_var($email, FILTER_VALIDATE_EMAIL) && $password) {
                        $existing = \App\Models\User::where('email', $email)->first();

                        if (!$existing) {
                            $student = \App\Models\User::create([
                                'name' => $name,
                                'email' => $email,
                                'password' => \Illuminate\Support\Facades\Hash::make($password),
                                'school_id' => $school->id,
                            ]);
                            $student->assignRole('customer');
                            $successCount++;
                        }
                    }
                }
                $row++;
            }
            fclose($handle);
        }

        return response()->json([
            'message' => "Successfully imported $successCount students."
        ]);
    }
    public function getNotifications(Request $request)
    {
        $school = $this->resolveAuthorizedSchool($request);
        if (! $school) {
            return response()->json([]);
        }

        $sid = (int) $school->id;

        $latestOrders = Order::query()
            ->where(function ($q) use ($sid) {
                $q->where('school_id', $sid)
                    ->orWhereHas('customer', function ($cq) use ($sid) {
                        $cq->where('school_id', $sid);
                    });
            })
            ->where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $notifications = [];

        foreach ($latestOrders as $order) {
            $notifications[] = [
                'id' => 'order_' . $order->id,
                'type' => 'order',
                'title' => 'New Enrollment/Order',
                'message' => 'Order #' . $order->order_number . ' received for ₹' . number_format($order->total_amount, 2),
                'link' => '/school/orders',
                'created_at' => $order->created_at->diffForHumans()
            ];
        }

        return response()->json($notifications);
    }
    public function markNotificationsRead(Request $request)
    {
        return response()->json(['message' => 'All marked as read']);
    }
}
