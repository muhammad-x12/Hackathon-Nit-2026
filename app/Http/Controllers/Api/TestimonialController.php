<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TestimonialController extends Controller
{
    /**
     * Public listing for homepage.
     */
    public function index()
    {
        $testimonials = Testimonial::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                $t->author_image = $t->author_image_path ? asset('storage/' . $t->author_image_path) : null;
                return $t;
            });

        return response()->json($testimonials);
    }

    /**
     * Admin listing.
     */
    public function adminIndex()
    {
        $testimonials = Testimonial::orderBy('created_at', 'desc')->get()->map(function ($t) {
            $t->author_image = $t->author_image_path ? asset('storage/' . $t->author_image_path) : null;
            return $t;
        });
        return response()->json($testimonials);
    }

    public function store(Request $request)
    {
        $request->validate([
            'author_name' => 'required|string|max:255',
            'author_role' => 'nullable|string|max:255',
            'content' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'author_image' => 'nullable|image|max:2048',
            'is_active' => 'boolean'
        ]);

        $data = $request->only(['author_name', 'author_role', 'content', 'rating', 'is_active']);

        if ($request->hasFile('author_image')) {
            $data['author_image_path'] = $request->file('author_image')->store('testimonials', 'public');
        }

        $testimonial = Testimonial::create($data);

        return response()->json([
            'message' => 'Testimonial created successfully',
            'data' => $testimonial
        ], 201);
    }

    public function show($id)
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->author_image = $testimonial->author_image_path ? asset('storage/' . $testimonial->author_image_path) : null;
        return response()->json($testimonial);
    }

    public function update(Request $request, $id)
    {
        $testimonial = Testimonial::findOrFail($id);

        $request->validate([
            'author_name' => 'required|string|max:255',
            'author_role' => 'nullable|string|max:255',
            'content' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'author_image' => 'nullable|image|max:2048',
            'is_active' => 'boolean'
        ]);

        $data = $request->only(['author_name', 'author_role', 'content', 'rating', 'is_active']);

        if ($request->hasFile('author_image')) {
            // Delete old image if exists
            if ($testimonial->author_image_path) {
                Storage::disk('public')->delete($testimonial->author_image_path);
            }
            $data['author_image_path'] = $request->file('author_image')->store('testimonials', 'public');
        }

        $testimonial->update($data);

        return response()->json([
            'message' => 'Testimonial updated successfully',
            'data' => $testimonial
        ]);
    }

    public function destroy($id)
    {
        $testimonial = Testimonial::findOrFail($id);

        if ($testimonial->author_image_path) {
            Storage::disk('public')->delete($testimonial->author_image_path);
        }

        $testimonial->delete();

        return response()->json(['message' => 'Testimonial deleted successfully']);
    }
}
