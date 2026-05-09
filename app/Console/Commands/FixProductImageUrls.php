<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class FixProductImageUrls extends Command
{
    protected $signature = 'fix:product-image-urls';
    protected $description = 'Normalize product image URLs in the database to store only relative paths (strips hardcoded domain prefixes like http://127.0.0.1:8000)';

    public function handle()
    {
        $products = Product::all();
        $updated = 0;

        foreach ($products as $product) {
            $changed = false;

            // Fix gallery images
            if (!empty($product->images)) {
                $imgs = is_string($product->images) ? json_decode($product->images, true) : $product->images;
                if (is_array($imgs)) {
                    $cleaned = array_map(fn($p) => $this->stripDomain($p), $imgs);
                    if ($cleaned !== $imgs) {
                        $product->images = $cleaned;
                        $changed = true;
                    }
                }
            }

            // Fix individual file fields
            foreach (['logo_placement_image', 'size_chart', 'demo_image'] as $field) {
                if (!empty($product->$field)) {
                    $cleaned = $this->stripDomain($product->$field);
                    if ($cleaned !== $product->$field) {
                        $product->$field = $cleaned;
                        $changed = true;
                    }
                }
            }

            if ($changed) {
                $product->save();
                $updated++;
            }
        }

        $this->info("Fixed image URLs for {$updated} products.");
    }

    private function stripDomain(string $path): string
    {
        if (str_starts_with($path, 'http')) {
            $parsed = parse_url($path, PHP_URL_PATH);
            $path = $parsed ? ltrim($parsed, '/') : $path;
        }

        $path = ltrim($path, '/');

        // Remove 'storage/' prefix to store only the relative path
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return $path;
    }
}
