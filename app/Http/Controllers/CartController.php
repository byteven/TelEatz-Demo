<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use App\Models\CartItem;
use Illuminate\Support\Facades\Auth;


use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $cartItems = CartItem::with(['product.user'])
            ->whereHas('cart', function ($query) use ($userId) {
                $query->where('buyer_id', $userId);
            })
            ->get();

        // Hitung total harga
        $total = $cartItems->sum(function ($cartItem) {
            return $cartItem->quantity * $cartItem->product->price;
        });

        // Group cartItems berdasarkan seller_id
        $grouped = $cartItems->groupBy(function ($item) {
            return $item->product->user->id ?? null;
        });


        $hasUnavailableProduct = $cartItems->contains(function ($item) {
            $seller = $item->product->user;
            return !$item->product->is_available || !$seller->is_open || $seller->deleted_at !== null;
        });

        return view('buyer.keranjang.index', [
            'groupedCartItems' => $grouped,
            'totalPrice' => $total,
            'title' => 'keranjang',
            'hasUnavailableProduct' => $hasUnavailableProduct,
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $userId = Auth::id();
        $productId = $request->product_id;
        $quantity = $request->quantity;

        // Cari cart-nya user
        $cart = Cart::firstOrCreate(
            ['buyer_id' => $userId],
            ['buyer_id' => $userId]
        );

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $quantity;
            $cartItem->save();
        } else {

            $product = Product::findOrFail($productId);
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'harga' => $product->harga,
            ]);
        }

        return redirect()->back()->with('success', 'Produk berhasil ditambahkan ke cart!');
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'quantity' => 'required|integer|min:1',
                'notes' => 'nullable|string|max:255',
            ]);

            $item = CartItem::where('id', $id)
                ->whereHas('cart', function ($query) {
                    $query->where('buyer_id', auth()->id());
                })
                ->firstOrFail();

            $item->quantity = $request->quantity;
            $item->notes = $request->notes; 
            $item->harga = $item->product->harga * $request->quantity;
            $item->save();

            return redirect()->back()->with('justsuccess', 'Keranjang diperbarui!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }




    public function destroy($id)
    {
        $item = CartItem::findOrFail($id);
        $item->delete();

        return redirect()->back()->with('success', 'Item berhasil dihapus dari keranjang.');
    }
}
