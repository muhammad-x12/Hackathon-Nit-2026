<?php

namespace App\Http\Controllers;

use App\Models\StaticPage;
use Illuminate\Http\Request;

class StaticPageController extends Controller
{
    /**
     * Get all static pages or a specific one by slug.
     */
    public function index()
    {
        return response()->json(StaticPage::all());
    }

    /**
     * Get a single static page by its slug.
     */
    public function show($slug)
    {
        $page = StaticPage::where('slug', $slug)->first();
        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }
        return response()->json($page);
    }

    /**
     * Update or create a static page.
     */
    public function updateOrCreate(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string'
        ]);

        $page = StaticPage::updateOrCreate(
            ['slug' => $validated['slug']],
            [
                'title' => $validated['title'],
                'content' => $validated['content']
            ]
        );

        return response()->json([
            'message' => 'Page updated successfully',
            'data' => $page
        ]);
    }
}
