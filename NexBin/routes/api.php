<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BinController;
use App\Http\Controllers\TrashController;

// Arduino sensor push (no auth — Arduino can't do sessions)
Route::post('/iot/bins', [BinController::class, 'store']);

// Dashboard polling (no auth needed for reads)
Route::get('/bins/latest',  [BinController::class, 'latest']);
Route::get('/bins/history', [BinController::class, 'history']);
Route::get('/bins/alerts',  [BinController::class, 'alerts']);
Route::get('/bins/status/{type}', [BinController::class, 'status']);

Route::post('/iot/trash', [TrashController::class, 'store']);
// Route::post('/trash/{token}/claim', [TrashController::class, 'claim']);

// All write actions require an authenticated staff/admin session
Route::middleware('auth')->group(function () {
    Route::post('/bins/collect/{binType}', [BinController::class, 'collectBin'])
        ->where('binType', 'metallic|wet|dry');

    Route::post('/bins/collect', [BinController::class, 'collect']);

    Route::post('/bins/alerts/{id}/resolve', [BinController::class, 'resolveAlert']);
});

