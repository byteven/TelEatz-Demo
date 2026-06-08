<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, \Illuminate\Http\Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'CSRF token mismatch. Please reload the page.'], 419);
            }

            if (auth()->check()) {
                $role = auth()->user()->role;
                if ($role === 'admin') {
                    return redirect()->route('admin.dashboard')->with('justsuccess', 'Kamu sudah login!');
                } elseif ($role === 'seller') {
                    return redirect()->route('seller.dashboard')->with('justsuccess', 'Kamu sudah login!');
                } elseif ($role === 'buyer') {
                    return redirect()->route('buyer.dashboard')->with('justsuccess', 'Kamu sudah login!');
                }
            }

            return redirect()->back()
                ->withInput($request->except('password', '_token'))
                ->with('error', 'Sesi Anda telah berakhir (Page Expired). Silakan coba lagi.');
        });
    })->create();
