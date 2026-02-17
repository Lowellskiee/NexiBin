<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScanController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Normal User Dashboard
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Staff Dashboard
Route::get('/admin/dashboard', function () {

    if (auth()->user()->role !== 'staff') {
        abort(403);
    }

    return view('admin.admin');

})->middleware(['auth', 'verified'])->name('admin.dashboard');

// Scan Route
Route::post('/scan', [ScanController::class, 'store'])
    ->middleware('auth')
    ->name('scan.store');

Route::middleware('auth')->group(function () {

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

});

require __DIR__.'/auth.php';
