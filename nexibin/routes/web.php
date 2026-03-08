<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Admin\RewardManagementController;
use App\Http\Controllers\RewardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Models\Reward;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| USER DASHBOARD
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::middleware(['auth','verified'])->get('/dashboard', function () {

    $rewards = Reward::where('is_active', true)->get();

    return Inertia::render('Dashboard', [
        'rewards' => $rewards
    ]);

})->name('dashboard');

/*
|--------------------------------------------------------------------------
| STAFF DASHBOARD
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'staff'])->group(function () {

    Route::get('/staff-dashboard', function () {
        return Inertia::render('Staff/StaffDashboard');
    })->name('staff.dashboard');

    Route::middleware(['auth','staff'])->get('/staff-report', function () {
        return Inertia::render('Staff/Report');
    })->name('staff.report');

});

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'admin'])->group(function () {

    /* Dashboard */
    Route::get('/admin-dashboard', [AdminController::class, 'dashboard'])
        ->name('admin.dashboard');

    /* Staff Creation */
    Route::get('/admin/staff/create', [AdminController::class, 'createStaff'])
        ->name('admin.staff.create');

    Route::post('/admin/staff/store', [AdminController::class, 'storeStaff'])
        ->name('admin.staff.store');

    /* Manage Users - CRUD */
    Route::get('/admin/users', [AdminController::class, 'manageUsers'])
        ->name('admin.users');

    Route::post('/admin/users', [AdminController::class, 'storeUser'])
        ->name('admin.users.store');

    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser'])
        ->name('admin.users.update');

    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])
        ->name('admin.users.delete');

    /* Manage Rewards - CRUD */
    Route::get('/admin/rewards', [RewardManagementController::class, 'index'])
        ->name('admin.rewards');

    Route::post('/admin/rewards', [RewardManagementController::class, 'store'])
        ->name('admin.rewards.store');

    Route::put('/admin/rewards/{reward}', [RewardManagementController::class, 'update'])
        ->name('admin.rewards.update');

    Route::delete('/admin/rewards/{reward}', [RewardManagementController::class, 'destroy'])
        ->name('admin.rewards.delete');

});

/*
|--------------------------------------------------------------------------
| PROFILE ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {

    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');

});

/*
|--------------------------------------------------------------------------
| REWARD USER ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {

    Route::get('/rewards', [RewardController::class, 'index'])
        ->name('rewards.index');

    Route::post('/rewards/{reward}/redeem', [RewardController::class, 'redeem'])
        ->name('rewards.redeem');

});

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/
Route::get('/test-route', function () {
    return 'working';
});

require __DIR__.'/auth.php';