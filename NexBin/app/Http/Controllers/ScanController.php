<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TrashScan;
use App\Models\Reward;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ScanController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DASHBOARD PAGE
    |--------------------------------------------------------------------------
    | Loads rewards + recent activity for the logged in user
    */

    public function index()
    {
        $user = Auth::user();

        /* Get recent scans of this user */

        $recentScans = TrashScan::with('trashEvent')
            ->where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'rewards' => Reward::all(),
            'recentScans' => $recentScans
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE SCAN (example endpoint)
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $user = auth()->user();

        $pointsToAdd = 10;

        $user->points += $pointsToAdd;
        $user->save();

        return response()->json([
            'success' => true,
            'new_points' => $user->points
        ]);
    }
}
