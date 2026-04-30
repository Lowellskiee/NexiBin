<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\TrashToken;

class TrashController extends Controller
{
    // =========================================================
    // POST /api/iot/trash  (Arduino)
    // =========================================================
    public function store(Request $request): JsonResponse
    {
        // ✅ Generate UNIQUE secure token
        do {
            $token = strtoupper(Str::random(10));
        } while (TrashToken::where('token', $token)->exists());

        // ✅ Determine type
        $type = $request->input('type', 'metal');

        // ✅ Dynamic points
        $points = match ($type) {
            'metal' => 20,
            'wet'   => 10,
            'dry'   => 5,
            default => 10,
        };

        // ✅ Save to DB
        $trashToken = TrashToken::create([
            'token'      => $token,
            'type'       => $type,
            'points'     => $points,
            'claimed'    => false,
            'expires_at' => now()->addMinutes(30),
        ]);

        // ✅ Arduino response (LIGHTWEIGHT)
        return response()->json([
            'token' => $trashToken->token,
        ], 201);
    }

    // =========================================================
    // GET /trash/{token}  (QR redirect)
    // =========================================================
    public function show(string $token)
    {
        $trashToken = TrashToken::where('token', $token)->first();

        if (!$trashToken) {
            return response()->json([
                'message' => 'Token not found.'
            ], 404);
        }

        return response()->json([
            'token'      => $trashToken->token,
            'type'       => $trashToken->type,
            'points'     => $trashToken->points,
            'claimed'    => $trashToken->isClaimed(),
            'expired'    => $trashToken->isExpired(),
            'expires_at' => $trashToken->expires_at,
        ]);
    }
    // =========================================================
    // GET /api/trash/{token}  (Frontend preview)
    // =========================================================
    public function apiShow(string $token): JsonResponse
    {
        $token = strtoupper($token);

        $trashToken = TrashToken::where('token', $token)->first();

        if (!$trashToken) {
            return response()->json([
                'message' => 'Token not found.',
            ], 404);
        }

        if ($trashToken->isExpired()) {
            return response()->json([
                'message'    => 'This token has expired.',
                'expires_at' => $trashToken->expires_at,
            ], 410);
        }

        if ($trashToken->isClaimed()) {
            return response()->json([
                'message'    => 'This token has already been claimed.',
                'claimed_at' => $trashToken->claimed_at,
            ], 400);
        }

        // ✅ Full response (what you wanted)
        return response()->json([
            'token'      => $trashToken->token,
            'type'       => $trashToken->type,
            'points'     => $trashToken->points,
            'claimed'    => $trashToken->isClaimed(),
            'expired'    => $trashToken->isExpired(),
            'expires_at' => $trashToken->expires_at,
            'qr_url'     => url('/trash/' . $trashToken->token),
        ]);
    }

    // =========================================================
    // POST /api/trash/{token}/claim
    // =========================================================
    public function claim(Request $request, string $token): JsonResponse
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'You must be logged in.',
            ], 401);
        }

        $token = strtoupper($token);

        $trashToken = TrashToken::where('token', $token)->first();

        if (!$trashToken) {
            return response()->json([
                'message' => 'Invalid token.',
            ], 404);
        }

        if ($trashToken->isExpired()) {
            return response()->json([
                'message' => 'Token expired.',
            ], 410);
        }

        // ✅ Atomic claim (CRITICAL)
        $updated = DB::table('trash_tokens')
            ->where('token', $token)
            ->where('claimed', false)
            ->update([
                'claimed'    => true,
                'claimed_by' => $request->user()->id,
                'claimed_at' => now(),
            ]);

        if ($updated === 0) {
            return response()->json([
                'message' => 'Already claimed.',
            ], 409);
        }

        // ✅ Award points
        $request->user()->increment('points', $trashToken->points);

        return response()->json([
            'message'      => 'Points awarded!',
            'points'       => $trashToken->points,
            'type'         => $trashToken->type,
            'total_points' => $request->user()->fresh()->points,
        ]);
    }

    // =========================================================
    // GET /api/bins/latest  (Dashboard)
    // =========================================================
    public function latest(): JsonResponse
    {
        $record = TrashToken::latest()->first();

        if (!$record) {
            return response()->json([
                'message' => 'No records yet.',
            ], 404);
        }

        return response()->json([
            'token'      => $record->token,
            'type'       => $record->type,
            'points'     => $record->points,
            'claimed'    => $record->isClaimed(),
            'expired'    => $record->isExpired(),
            'expires_at' => $record->expires_at,
            'created_at' => $record->created_at,
            'qr_url'     => url('/trash/' . $record->token),
        ]);
    }
}