<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query();

        // Search by name or email
        if ($request->filled('search')) {
            $users->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $users->where('role', $request->role);
        }

        // Filter by verification status
        if ($request->has('verified')) {
            if ($request->verified == '1') {
                $users->whereNotNull('email_verified_at');
            } elseif ($request->verified == '0') {
                $users->whereNull('email_verified_at');
            }
        }

        $users = $users->orderBy('created_at', 'desc')->get();

        return view('admin.kelola_akun.index', compact('users'));
    }


    public function create()
    {
        return view('admin.kelola_akun.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'role' => 'required|in:admin,seller,buyer',
            'password' => 'required|min:5',
            'email_verified_at' => now()
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = bcrypt($validated['password']);
        $user->role = $validated['role'];
        $user->email_verified_at = now();
        $user->is_open = false;
        $user->save();

        return redirect()->route('admin.kelola_akun.index')->with('success', 'User berhasil ditambahkan.');
    }

    public function edit(User $user)
    {
        return view('admin.kelola_akun.edit', compact('user'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,seller,buyer',
            'password' => 'nullable|min:6',
            'verified' => 'nullable|boolean',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }

        if ($request->has('verified') && $validated['verified']) {
            $user->email_verified_at = now();
        } else {
            $user->email_verified_at = null;
        }

        $user->save();

        return redirect()->route('admin.kelola_akun.index')->with('success', 'User berhasil diupdate.');
    }


    public function destroy(User $user)
    {
        // Cek punya pesanan yang sedang diproses atau tidaks
        $hasProcessingOrderAsBuyer = DB::table('orders')
            ->where('buyer_id', $user->id)
            ->where('status', 'diproses')
            ->exists();

        // Cek user == seller dan ada produk miliknya yang masuk dalam order yang belum selesai?????
        $hasProcessingOrderAsSeller = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.seller_id', $user->id)
            ->whereIn('orders.status', ['pending', 'diproses'])
            ->exists();

        if ($hasProcessingOrderAsBuyer || $hasProcessingOrderAsSeller) {
            return redirect()
                ->route('admin.kelola_akun.index')
                ->with('error', 'User tidak dapat dihapus karena masih memiliki pesanan.');
        }


        if ($user->email_verified_at) {
            $user->is_open = false;
            $user->email = null;
            $user->save();

            $user->products()->update(['is_available' => false]);
            $user->delete();

            $message = 'User verified berhasil dihapus, produk dinonaktifkan.';

        } else {
            $user->products()->delete();
            $user->forceDelete();
            $message = 'User not verified telah dihapus permanen.';
        }

        return redirect()->route('admin.kelola_akun.index')->with('success', $message);
    }
}
