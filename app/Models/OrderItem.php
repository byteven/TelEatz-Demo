<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// OrderItem.php
class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'quantity', 'price', 'notes'];

    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class, 'order_item_id');
    }
}
