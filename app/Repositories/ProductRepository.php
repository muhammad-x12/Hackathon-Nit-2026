<?php

namespace App\Repositories;

use App\Models\Product;
use App\Models\SchoolProduct;

class ProductRepository
{
    public function getProductsBySchool($schoolId, array $filters = [])
    {
        $query = Product::query()
            ->join('school_products', 'products.id', '=', 'school_products.product_id')
            ->where('school_products.school_id', $schoolId)
            ->where('school_products.is_active', true)
            ->where('products.status', 'active')
            ->select('products.*', 'school_products.school_margin');

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        return $query->with('category')->paginate(20);
    }
}
