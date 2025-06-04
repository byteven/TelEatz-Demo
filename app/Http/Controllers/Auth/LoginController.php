<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Models\User;


class LoginController extends Controller
{
    public function showLogin()
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

        return view('auth.login');
    }



    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->has('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();

            $user = Auth::user();

            if (is_null($user->email_verified_at)) {
                Auth::logout();
                return back()->with('error', 'Email kamu belum terverifikasi!');
            }

            // Redirect by role
            switch ($user->role) {
                case 'buyer':
                    return redirect()->route('buyer.dashboard')->with('justsuccess', 'Kamu berhasil login!');
                case 'seller':
                    return redirect()->route('seller.dashboard')->with('justsuccess', 'Kamu berhasil login!');
                case 'admin':
                    return redirect()->route('admin.dashboard')->with('justsuccess', 'Selamat datang, Admin!');
                default:
                    Auth::logout();
                    return back()->with('error', 'Akun kamu tidak memiliki akses.');
            }
        }

        return back()->with('error', 'Email atau password salah!');
    }


    public function logout(Request $request)
    {

        $user = User::find(Auth::id());

        if ($user) {
            $user->last_logout_at = now(); 
            $user->save();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('justsuccess', 'Anda telah berhasil logout!');
    }
}
