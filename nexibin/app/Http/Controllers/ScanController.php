<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ScanController extends Controller
{
    public function store(Request $request)
    {
        $user = auth()->user();

        // Example: every scan = 10 points
        $pointsToAdd = 10;

        $user->points += $pointsToAdd;
        $user->save();

        return response()->json([
            'success' => true,
            'new_points' => $user->points
        ]);
    }
}
