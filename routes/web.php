<?php

use App\Http\Controllers\ProfileController;
use App\Models\TrashEvent;
use App\Models\CollectionLog;
use App\Http\Controllers\QRController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Admin\RewardManagementController;
use App\Http\Controllers\Admin\RedemptionController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\ScanController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Models\Reward;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

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

Route::post('/scan-qr', [QRController::class, 'scan'])->name('qr.scan');


/*
|--------------------------------------------------------------------------
| USER DASHBOARD
|--------------------------------------------------------------------------
*/

Route::middleware(['auth','verified'])->get(
    '/dashboard',
    [ScanController::class, 'index']
)->name('dashboard');


Route::middleware(['auth','staff'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | STAFF DASHBOARD
    |--------------------------------------------------------------------------
    */
    Route::get('/staff-dashboard', function () {

        $logs = \App\Models\CollectionLog::latest()->get();

        return Inertia::render('Staff/StaffDashboard', [
            'logs' => $logs
        ]);

    })->name('staff.dashboard');


    /*
    |--------------------------------------------------------------------------
    | STAFF REPORT (WITH FILTERS)
    |--------------------------------------------------------------------------
    */
    Route::get('/staff-report', function (Request $request) {

        $query = \App\Models\CollectionLog::with('staff')->latest();

        /* 🔍 SEARCH FILTER */
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('bin', 'like', '%' . $request->search . '%')
                  ->orWhere('location', 'like', '%' . $request->search . '%')
                  ->orWhereHas('staff', function ($q2) use ($request) {
                      $q2->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        /* 📅 DATE RANGE FILTER */
        if ($request->filled('fromDate')) {
            $query->whereDate('collected_at', '>=', $request->fromDate);
        }

        if ($request->filled('toDate')) {
            $query->whereDate('collected_at', '<=', $request->toDate);
        }

        $logs = $query->get();

        return Inertia::render('Staff/Report', [
            'logs' => $logs,

            // ✅ VERY IMPORTANT: keeps input values after filtering
            'filters' => $request->only(['search', 'fromDate', 'toDate']),
        ]);

    })->name('staff.report'); // ✅ KEEP THIS (no breaking changes)


    /*
    |--------------------------------------------------------------------------
    | COLLECT BIN
    |--------------------------------------------------------------------------
    */
    Route::post('/collect-bin', [CollectionController::class, 'store'])
        ->name('collect.bin');

});

/*
|--------------------------------------------------------------------------
| ADMIN ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(['auth','admin'])->group(function () {

    /* Admin Dashboard */

    Route::get('/admin-dashboard', [AdminController::class, 'dashboard'])
        ->name('admin.dashboard');


    /* Create Staff */

    Route::get('/admin/staff/create', [AdminController::class, 'createStaff'])
        ->name('admin.staff.create');

    Route::post('/admin/staff/store', [AdminController::class, 'storeStaff'])
        ->name('admin.staff.store');


    /* Manage Users */

    Route::get('/admin/users', [AdminController::class, 'manageUsers'])
        ->name('admin.users');

    Route::post('/admin/users', [AdminController::class, 'storeUser'])
        ->name('admin.users.store');

    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser'])
        ->name('admin.users.update');

    Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])
        ->name('admin.users.delete');


    /* Manage Rewards */

    Route::get('/admin/rewards', [RewardManagementController::class, 'index'])
        ->name('admin.rewards');

    Route::post('/admin/rewards', [RewardManagementController::class, 'store'])
        ->name('admin.rewards.store');

    Route::post('/admin/rewards/{reward}', [RewardManagementController::class, 'update'])
        ->name('admin.rewards.update');

    Route::delete('/admin/rewards/{reward}', [RewardManagementController::class, 'destroy'])
        ->name('admin.rewards.delete');

    Route::get('/admin/redemptions', [RedemptionController::class, 'index'])
        ->name('admin.redemptions.index');

});


/*
|--------------------------------------------------------------------------
| USER REWARD ROUTES
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
| TEST ROUTE
|--------------------------------------------------------------------------
*/

Route::get('/test-route', function () {
    return 'working';
});

/*
|--------------------------------------------------------------------------
| SIMULATE IOT TRASH EVENT
|--------------------------------------------------------------------------
*/

Route::get('/simulate-trash/{type}', function ($type) {

    $points = [
        'wet' => 5,
        'dry' => 10,
        'metallic' => 20
    ];

    if (!isset($points[$type])) {

        return response()->json([
            'error' => 'Invalid trash type'
        ], 400);

    }

    $token = Str::random(10);

    $event = TrashEvent::create([
        'type' => $type,
        'points' => $points[$type],
        'token' => $token,
        'is_claimed' => 0
    ]);

    return response()->json([
        'message' => 'Trash event created',
        'id' => $event->id,
        'type' => $type,
        'points' => $points[$type],
        'token' => $token
    ]);

});

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

require __DIR__.'/auth.php';