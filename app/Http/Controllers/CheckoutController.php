<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\Auth;




use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'dine_option' => 'required|in:dine-in,takeaway',
            'payment' => 'required|in:qris,cash',
        ]);

        $user = Auth::user();
        $cart = Cart::where('buyer_id', $user->id)->with('cart_items.product')->first();

        if (!$cart || $cart->cart_items->isEmpty()) {
            return back()->with('error', 'Cart kosong.');
        }


        $grouped = $cart->cart_items->groupBy(function ($item) {
            return $item->product->seller_id;
        });

        foreach ($grouped as $sellerId => $items) {
            $totalHarga = 0;


            foreach ($items as $item) {
                $totalHarga += $item->product->price * $item->quantity;
            }


            $order = Order::create([
                'buyer_id' => $user->id,
                'seller_id' => $sellerId,
                'total_price' => $totalHarga,
                'status' => 'pending',
                'dine_option' => $request->dine_option,
                'payment' => $request->payment,
            ]);


            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                ]);
            }
        }

        // Hapus cart dan isinya
        $cart->cart_items()->delete();
        $cart->delete();

        return redirect()->route('buyer.pesanan.index')->with('success', 'Pesanan berhasil dibuat!');
    }
}
