<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;
use Illuminate\Http\Request;

/* Controllers */
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Admin\RewardManagementController;
use App\Http\Controllers\Admin\RedemptionController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\BinController;
use App\Http\Controllers\TrashController;

/* Models */
use App\Models\Reward;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| QR CODE ROUTES
|--------------------------------------------------------------------------
*/

Route::get('/trash/{token}', [TrashController::class, 'show']);

Route::get('/scan/{token}', function (string $token) {
    return Inertia::render('ScanPage', [
        'token' => $token,
    ]);
})->name('scan.page');

Route::post('/api/trash/{token}/claim', [TrashController::class, 'claim'])
    ->middleware(['web', 'auth']);

/*
|--------------------------------------------------------------------------
| AUTHENTICATED USER ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | USER DASHBOARD
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard', function () {
        $user = auth()->user();

        $recentScans = \App\Models\TrashToken::where('claimed_by', $user->id)
            ->latest('claimed_at')
            ->take(20)
            ->get()
            ->map(fn ($t) => [
                'id'         => $t->id,
                'created_at' => $t->claimed_at,
                'trash_event' => [
                    'name'   => ucfirst($t->type) . ' Trash',
                    'points' => $t->points,
                ],
            ]);

        return Inertia::render('Dashboard', [
            'rewards'     => Reward::where('stock', '>', 0)
                                ->orderBy('points_required')
                                ->get(),
            'recentScans' => $recentScans,
        ]);
    })->middleware('verified')->name('dashboard');


    /*
    |--------------------------------------------------------------------------
    | STAFF ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('staff')->group(function () {

        Route::get('/staff-dashboard', function () {
            $logs = \App\Models\CollectionLog::latest()->get();

            return Inertia::render('Staff/StaffDashboard', [
                'logs' => $logs,
            ]);
        })->name('staff.dashboard');

        Route::get('/staff-report', function (Request $request) {

            $query = \App\Models\CollectionLog::with('staff')->latest();

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('bin', 'like', '%' . $request->search . '%')
                      ->orWhere('location', 'like', '%' . $request->search . '%')
                      ->orWhereHas('staff', function ($q2) use ($request) {
                          $q2->where('name', 'like', '%' . $request->search . '%');
                      });
                });
            }

            if ($request->filled('fromDate')) {
                $query->whereDate('collected_at', '>=', $request->fromDate);
            }

            if ($request->filled('toDate')) {
                $query->whereDate('collected_at', '<=', $request->toDate);
            }

            return Inertia::render('Staff/Report', [
                'logs'    => $query->get(),
                'filters' => $request->only(['search', 'fromDate', 'toDate']),
            ]);
        })->name('staff.report');

        // Staff-only collection actions
        Route::post('/bins/collect/{binType}', [BinController::class, 'collectBin'])
            ->name('bins.collect')
            ->where('binType', 'metallic|wet|dry');

        Route::post('/bins/collect', [BinController::class, 'collect']);

        Route::post('/bins/alerts/{id}/resolve', [BinController::class, 'resolveAlert']);
    });


    /*
    |--------------------------------------------------------------------------
    | ADMIN ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {

        Route::get('/admin-dashboard', [AdminController::class, 'dashboard'])
            ->name('admin.dashboard');

        Route::get('/admin/users', [AdminController::class, 'manageUsers'])
            ->name('admin.users');

        Route::post('/admin/users', [AdminController::class, 'storeUser'])
            ->name('admin.users.store');

        Route::put('/admin/users/{user}', [AdminController::class, 'updateUser'])
            ->name('admin.users.update');

        Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser'])
            ->name('admin.users.delete');

        Route::get('/admin/staff/create', [AdminController::class, 'createStaff'])
            ->name('admin.staff.create');

        Route::post('/admin/staff/store', [AdminController::class, 'storeStaff'])
            ->name('admin.staff.store');

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
    Route::get('/rewards', [RewardController::class, 'index'])
        ->name('rewards.index');

    Route::post('/rewards/{reward}/redeem', [RewardController::class, 'redeem'])
        ->name('rewards.redeem');


    /*
    |--------------------------------------------------------------------------
    | PROFILE ROUTES
    |--------------------------------------------------------------------------
    */
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');
});


/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

require __DIR__ . '/auth.php';