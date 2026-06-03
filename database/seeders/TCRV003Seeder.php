<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;

class TCRV003Seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Jalankan TCRV001Seeder terlebih dahulu untuk memastikan order terbuat tanpa review
        $this->call(TCRV001Seeder::class);

        $buyer = User::where('email', 'vio@gmail.com')->first();
        $seller = User::where('email', 'abc@gmail.com')->first();

        if (!$buyer || !$seller) {
            return;
        }

        $product = Product::where('seller_id', $seller->id)
            ->where('nama_product', 'Nasi Goreng')
            ->first();

        if (!$product) {
            return;
        }

        $order = Order::where('buyer_id', $buyer->id)
            ->where('seller_id', $seller->id)
            ->latest()
            ->first();

        if (!$order) {
            return;
        }

        $orderItem = OrderItem::where('order_id', $order->id)
            ->where('product_id', $product->id)
            ->first();

        if (!$orderItem) {
            return;
        }

        // Buat data review (ulasan)
        Review::create([
            'buyer_id' => $buyer->id,
            'product_id' => $product->id,
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'comment' => 'Makanan enak dan cepat sampai!',
            'rating' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
