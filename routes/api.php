<?php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TrashController;

// Arduino — no auth required
Route::post('/trash', [TrashController::class, 'store']);

// Web app — token preview, no auth required
Route::get('/trash/{token}', [TrashController::class, 'show']);

// Web app — claiming requires authenticated user
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/trash/claim', [TrashController::class, 'claim']);
    Route::get('/user', fn(Request $request) => $request->user());
});