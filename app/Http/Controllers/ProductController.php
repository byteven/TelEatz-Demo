<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{

    public function index(Request $request)
    {
        $query = Product::with(['user', 'category'])
            ->withCount('orderItems')
            ->withAvg('reviews', 'rating')
            ->where('is_available', true);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_product', 'like', "%$search%")
                    ->orWhereHas('user', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%$search%");
                    });
            });
        }


        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('nama_kategori', $request->category);
            });
        }

        if ($request->filled('sort') && $request->sort == 'rating') {
            $query->orderByDesc('reviews_avg_rating');
        } else {
            $query->orderByDesc('order_items_count');
        }



        $products = $query->get();
        $categories = Category::all();

        return view('buyer.daftarmenu.index', compact('products', 'categories'), ['title' => 'Daftar Menu']);
    }




    public function show($id)
    {
        $product = Product::with('user', 'category')->findOrFail($id);
        $product = Product::with(['reviews.buyer', 'reviews.order'])->findOrFail($id);
        return view('buyer.daftarmenu.show', compact('product'), ['title' => 'Detail Menu']);
    }
}
