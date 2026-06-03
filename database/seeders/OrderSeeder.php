<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $buyer = User::where('email', 'vio@gmail.com')->first();
        $seller = User::where('email', 'abc@gmail.com')->first();

        if ($buyer && $seller) {
            $product = Product::where('seller_id', $seller->id)
                ->where('nama_product', 'Nasi Goreng')
                ->first();

            if ($product) {
                $order = Order::create([
                    'buyer_id' => $buyer->id,
                    'seller_id' => $seller->id,
                    'total_price' => 15000,
                    'status' => 'selesai',
                    'dine_option' => 'dine-in',
                    'payment' => 'qris',
                    'estimated_ready_at' => '2026-06-02 11:13:00',
                    'created_at' => '2026-06-02 11:13:00',
                    'updated_at' => '2026-06-02 11:13:00',
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => 15000,
                    'notes' => null,
                    'created_at' => '2026-06-02 11:13:00',
                    'updated_at' => '2026-06-02 11:13:00',
                ]);
            }
        }
    }
}
