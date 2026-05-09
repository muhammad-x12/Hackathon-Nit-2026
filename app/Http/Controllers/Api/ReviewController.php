<?php

namespace App\Http\Controllers\Api;

use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'school_id' => 'nullable|exists:schools,id',
            'user_id' => 'nullable|exists:users,id',
            'guest_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        if (isset($data['user_id']) && !$user->hasRole('super_admin')) {
            unset($data['user_id']);
        }

        $data['user_id'] = $data['user_id'] ?? $user->id;
        $data['guest_name'] = $data['guest_name'] ?? null;
        $data['is_approved'] = true;

        $review = Review::create($data);

        return response()->json([
            'message' => 'Review submitted successfully',
            'review' => $review
        ], 201);
    }

    public function index()
    {
        $reviews = Review::with(['product', 'user', 'school'])->orderBy('created_at', 'desc')->paginate(20);
        return \App\Http\Resources\ReviewResource::collection($reviews);
    }

    public function updateStatus(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->update(['is_approved' => $request->is_approved]);
        return response()->json(['message' => 'Review status updated']);
    }

    public function destroy($id)
    {
        Review::findOrFail($id)->delete();
        return response()->json(['message' => 'Review deleted']);
    }
}