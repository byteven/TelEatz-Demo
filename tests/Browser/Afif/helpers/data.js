import { execFileSync } from 'node:child_process';

function artisan(args) {
  return execFileSync('php', ['artisan', ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function resetDatabase() {
  artisan(['migrate:fresh', '--seed', '--force']);
}

export function tinker(code) {
  return artisan(['tinker', '--execute', code]);
}

export function ensureUnverifiedBuyer() {
  tinker(`
    App\\Models\\User::updateOrCreate(
      ['email' => 'unverified.buyer@teleatz.test'],
      [
        'name' => 'Unverified Buyer',
        'password' => Illuminate\\Support\\Facades\\Hash::make('12345'),
        'role' => 'buyer',
        'email_verified_at' => null
      ]
    );
  `);
}

export function seedSingleOrder({ withReview = false } = {}) {
  tinker(`
    Illuminate\\Support\\Facades\\DB::table('reviews')->delete();
    Illuminate\\Support\\Facades\\DB::table('order_items')->delete();
    Illuminate\\Support\\Facades\\DB::table('orders')->delete();
    $buyer = App\\Models\\User::where('email', 'vio@gmail.com')->firstOrFail();
    $seller = App\\Models\\User::where('email', 'abc@gmail.com')->firstOrFail();
    $product = App\\Models\\Product::withTrashed()->where('nama_product', 'Nasi Goreng')->firstOrFail();
    if ($product->trashed()) { $product->restore(); }
    $order = App\\Models\\Order::create([
      'buyer_id' => $buyer->id,
      'seller_id' => $seller->id,
      'total_price' => 30000,
      'status' => 'selesai',
      'dine_option' => 'dine-in',
      'payment' => 'cash',
      'estimated_ready_at' => now()->addMinutes(15)
    ]);
    $item = App\\Models\\OrderItem::create([
      'order_id' => $order->id,
      'product_id' => $product->id,
      'quantity' => 2,
      'price' => 15000,
      'notes' => 'tanpa acar'
    ]);
    if (${withReview ? 'true' : 'false'}) {
      App\\Models\\Review::create([
        'buyer_id' => $buyer->id,
        'product_id' => $product->id,
        'order_id' => $order->id,
        'order_item_id' => $item->id,
        'rating' => 5,
        'comment' => 'Rasa enak dan pesanan sesuai.'
      ]);
    }
  `);
}

export function seedMultiItemOrder() {
  tinker(`
    Illuminate\\Support\\Facades\\DB::table('reviews')->delete();
    Illuminate\\Support\\Facades\\DB::table('order_items')->delete();
    Illuminate\\Support\\Facades\\DB::table('orders')->delete();
    $buyer = App\\Models\\User::where('email', 'vio@gmail.com')->firstOrFail();
    $seller = App\\Models\\User::where('email', 'abc@gmail.com')->firstOrFail();
    $p1 = App\\Models\\Product::withTrashed()->where('nama_product', 'Nasi Goreng')->firstOrFail();
    $p2 = App\\Models\\Product::withTrashed()->where('nama_product', 'Mie Ayam')->firstOrFail();
    if ($p1->trashed()) { $p1->restore(); }
    if ($p2->trashed()) { $p2->restore(); }
    $order = App\\Models\\Order::create([
      'buyer_id' => $buyer->id,
      'seller_id' => $seller->id,
      'total_price' => 28000,
      'status' => 'pending',
      'dine_option' => 'takeaway',
      'payment' => 'qris',
      'estimated_ready_at' => now()->addMinutes(20)
    ]);
    App\\Models\\OrderItem::create(['order_id' => $order->id, 'product_id' => $p1->id, 'quantity' => 1, 'price' => 15000]);
    App\\Models\\OrderItem::create(['order_id' => $order->id, 'product_id' => $p2->id, 'quantity' => 1, 'price' => 13000]);
  `);
}

export function clearOrders() {
  tinker(`
    Illuminate\\Support\\Facades\\DB::table('reviews')->delete();
    Illuminate\\Support\\Facades\\DB::table('order_items')->delete();
    Illuminate\\Support\\Facades\\DB::table('orders')->delete();
  `);
}

export function restoreProducts() {
  tinker(`App\\Models\\Product::withTrashed()->restore();`);
}

export function removeVisibleProducts() {
  tinker(`App\\Models\\Product::query()->delete();`);
}
