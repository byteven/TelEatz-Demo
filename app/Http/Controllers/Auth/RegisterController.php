<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Rules\Recaptcha;
use Illuminate\Support\Facades\Auth;


class RegisterController extends Controller
{
    public function showRegister()
    {
        if (Auth::check()) {
            switch (Auth::user()->role) {
                case 'admin':
                    return redirect()->route('admin.dashboard');
                case 'seller':
                    return redirect()->route('seller.dashboard');
                case 'buyer':
                    return redirect()->route('buyer.dashboard');
                default:
                    return redirect()->route('login')->with('error', 'Role tidak dikenali.');
            }
        }

        return view('auth.register');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:5|confirmed',
            'role' => 'required|in:buyer,seller',
            'g-recaptcha-response' => [new Recaptcha],
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = Hash::make($validated['password']);
        $user->role = $validated['role'];


        // Atur email_verified_at kalau buyer
        if ($validated['role'] === 'buyer') {
            $user->email_verified_at = now();
        }

        $user->save();

        return redirect('/login')->with('success', 'Registrasi berhasil, silakan login!');
    }
}
