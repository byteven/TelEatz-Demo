<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Makanan;
use App\Models\User;

use Carbon\Carbon;

use Exception;
use Hash;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\Fluent\Concerns\Has;

class ProfileBuyerController extends Controller
{
    public function index()
    {
        $profile = User::where('id', auth::id())->first();

        return view('buyer.profile.menu', compact('profile'), ['title' => 'Profile Saya']);
    }

    public function update(Request $request, $id)
    {


        try {

            $request->validate([
                'name' => 'string|max:255',
                'email' => 'nullable|email|max:255',
                'img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $profile = User::findOrFail($id);
            $profile->name = $request->name;
            $profile->email = $request->email;
            $profile->updated_at = now();


            if ($request->hasFile('img')) {
                $file = $request->file('img');
                $filename = time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('images'), $filename);
                $profile->img = $filename;
            }


            $profile->save();

            return redirect()->route('buyer.profile.menu', ['id' => $profile->id])->with('success', 'Profil berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi Kesalahan: ' . $e->getMessage());
        }
    }
    public function changePasswordIndex()
    {
        $profile = User::where('id', auth::id())->first();
        return view('buyer.profile.changePassword', compact('profile'), ['title' => 'Change Password']);
    }

    public function changePassword(Request $request, $id)
    {
        try {

            if (!auth()->check()) {
                return redirect()->route('login')->with('error', 'Anda harus login terlebih dahulu.');
            }


            $request->validate([
                'oldPassword' => 'required',
                'newPassword' => 'required|min:5|confirmed',
            ]);


            $profile = User::findOrFail($id);

            if (!Hash::check($request->oldPassword, $profile->password)) {
                return redirect()->route('buyer.profile.changePassword')->with('error', 'Password lama tidak sesuai');
            }

            if ($request->oldPassword == $request->newPassword) {
                return redirect()->route('buyer.profile.changePassword')->with('error', 'Password baru tidak boleh sama dengan password lama');
            }

            $profile->password = Hash::make($request->newPassword);
            $profile->save();
            return redirect()->route('buyer.profile.changePassword')->with('success', 'Password berhasil diperbarui');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function changeEmailIndex()
    {
        $profile = User::where('id', auth::id())->first();
        return view('buyer.profile.changeEmail', compact('profile'), ['title' => 'Change Email']);
    }

    public function changeEmail(Request $request, $id)
    {
        $profile = User::findOrFail($id);
        try {
            $request->validate([
                'newEmail' => 'required|email|max:255',
                'password' => 'required'
            ]);

            $profile = User::findOrFail($id);


            if (!Hash::check($request->password, $profile->password)) {
                return redirect()->route('buyer.profile.changeEmail')->with('error', 'Password lama tidak sesuai');
            }


            $profile->email = $request->newEmail;
            $profile->save();

            return redirect()->route('buyer.profile.changeEmail')->with('success', 'Email berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Terjadi Kesalahan: ' . $e->getMessage());
        }
    }
}
