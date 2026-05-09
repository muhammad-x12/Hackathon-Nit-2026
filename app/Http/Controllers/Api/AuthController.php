<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        return DB::transaction(function () use ($request) {
            // Resolve referrer
            $referrerId = null;
            if ($request->filled('referral_code')) {
                $referrer = User::where('referral_code', $request->referral_code)->first();
                if ($referrer) {
                    $referrerId = $referrer->id;
                }
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'referral_code' => User::generateReferralCode(),
                'referred_by' => $referrerId,
                'school_id' => $request->school_id,
            ]);

            if ($request->role === 'school') {
                $school = \App\Models\School::create([
                    'name' => $request->school_name,
                    'abbreviation' => $request->abbreviation,
                    'subdomain' => $request->subdomain,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'commission_percentage' => 5.0,
                    'status' => 'active',
                ]);
                $user->update(['school_id' => $school->id]);
                $user->assignRole('school');
            } elseif ($request->role === 'supplier') {
                $supplier = \App\Models\Supplier::create([
                    'name' => $request->school_name, // organization / business name from register form
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'status' => 'active',
                ]);
                $user->update(['supplier_id' => $supplier->id]);
                $user->assignRole('supplier');
            } else {
                $user->assignRole('customer');
            }

            return response()->json([
                'message' => 'User registered successfully',
                'token' => $user->createToken('auth_token')->plainTextToken,
                'role' => $user->getRoleNames(),
            ]);
        });
    }

    public function registerSchool(\App\Http\Requests\Auth\RegisterSchoolRequest $request)
    {
        // 1. Create School
        $school = \App\Models\School::create([
            'name' => $request->school_name,
            'abbreviation' => $request->abbreviation,
            'subdomain' => $request->subdomain,
            'email' => $request->admin_email,
            'password' => Hash::make($request->password),
            'commission_percentage' => 5.0,
            'status' => 'active',
        ]);

        // 2. Create Admin User
        $user = User::create([
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => $request->password,
            'school_id' => $school->id,
            'referral_code' => User::generateReferralCode(),
        ]);

        $user->assignRole('school');

        return response()->json([
            'message' => 'School registered successfully',
            'school' => new \App\Http\Resources\SchoolResource($school),
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials'],
            ]);
        }

        // Ensure existing users have a referral code
        if (!$user->referral_code) {
            $user->update(['referral_code' => User::generateReferralCode()]);
        }

        return response()->json([
            'message' => 'Login successful',
            'token' => $user->createToken('auth_token')->plainTextToken,
            'role' => $user->getRoleNames(),
            'user' => $user->load(['school', 'supplier']),
]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Current user (for refreshing session after profile / saved-address updates).
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['school', 'supplier']);

        return response()->json([
            'user' => $user,
            'role' => $user->getRoleNames(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'default_shipping_address' => 'sometimes|array',
            'default_shipping_address.name' => 'nullable|string|max:255',
            'default_shipping_address.phone' => 'nullable|string|max:30',
            'default_shipping_address.address' => 'nullable|string|max:500',
            'default_shipping_address.city' => 'nullable|string|max:120',
            'default_shipping_address.pincode' => ['nullable', 'regex:/^\d{6}$/'],
        ]);

        if (isset($validated['name']))
            $user->name = $validated['name'];
        if (isset($validated['email']))
            $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            // User model has 'password' => 'hashed' cast, so pass RAW password
            $user->password = $validated['password'];
        }
        if (array_key_exists('default_shipping_address', $validated)) {
            $user->default_shipping_address = $validated['default_shipping_address'];
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->load(['school', 'supplier']),
        ]);
    }

    // ── Referral: Validate a code & return discount info ─────────────────
    public function validateReferralCode(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $settings = PlatformSetting::pluck('value', 'key');

        if (!($settings['referral_enabled'] ?? '1')) {
            return response()->json(['valid' => false, 'message' => 'Referral program is currently disabled.'], 422);
        }

        $referrer = User::where('referral_code', strtoupper($request->code))->first();

        if (!$referrer) {
            return response()->json(['valid' => false, 'message' => 'Invalid referral code.'], 422);
        }

        // Prevent self-referral (only relevant after registration, but guard here too)
        if ($referrer->id === $request->user()?->id) {
            return response()->json(['valid' => false, 'message' => 'You cannot use your own referral code.'], 422);
        }

        return response()->json([
            'valid' => true,
            'discount_type' => $settings['referral_discount_type'] ?? 'percentage',
            'discount_value' => $settings['referral_discount_value'] ?? '10',
            'discount_max' => $settings['referral_discount_max'] ?? '500',
            'referrer_name' => $referrer->name,
            'message' => 'Code applied! You\'ll get a discount on checkout.',
        ]);
    }

    // ── My referral stats (for profile page) ─────────────────────────────
    public function myReferrals(Request $request)
    {
        $user = $request->user();

        // Ensure they have a code
        if (!$user->referral_code) {
            $user->update(['referral_code' => User::generateReferralCode()]);
        }

        $settings = PlatformSetting::pluck('value', 'key');

        return response()->json([
            'referral_code' => $user->referral_code,
            'referral_count' => $user->referrals()->count(),
            'discount_type' => $settings['referral_discount_type'] ?? 'percentage',
            'discount_value' => $settings['referral_discount_value'] ?? '10',
            'discount_max' => $settings['referral_discount_max'] ?? '500',
            'referral_enabled' => $settings['referral_enabled'] ?? '1',
        ]);
    }
}
