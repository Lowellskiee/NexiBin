<?php
// app/Http/Controllers/TrashController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\TrashToken;

class TrashController extends Controller
{
    /**
     * Arduino calls this — generates and saves token.
     */
    public function store(Request $request)
    {
        $token = TrashToken::create([
            'token'      => Str::random(10),
            'type'       => $request->input('type', 'general'),
            'points'     => 20,
            'expires_at' => now()->addMinutes(5),
        ]);

        return response()->json([
            'message'    => 'Trash event created',
            'token'      => $token->token,
            'type'       => $token->type,
            'points'     => $token->points,
            'expires_at' => $token->expires_at,
        ], 201);
    }

    /**
     * Web app calls this to preview token before claiming.
     */
    public function show(string $token)
    {
        $trashToken = TrashToken::where('token', $token)->first();

        if (!$trashToken) {
            return response()->json([
                'message' => 'Token not found.',
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

    /**
     * Web app calls this after QR scan — awards points to user.
     */
    public function claim(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:10',
        ]);

        $trashToken = TrashToken::where('token', $request->token)->first();

        if (!$trashToken) {
            return response()->json([
                'message' => 'Invalid token.',
            ], 404);
        }

        if ($trashToken->isClaimed()) {
            return response()->json([
                'message' => 'This token has already been used.',
            ], 409);
        }

        if ($trashToken->isExpired()) {
            return response()->json([
                'message' => 'This token has expired.',
            ], 410);
        }

        $user = $request->user();

        // Award points to user
        $user->increment('points', $trashToken->points);

        // Lock token as claimed
        $trashToken->update([
            'claimed_by' => $user->id,
            'claimed_at' => now(),
        ]);

        return response()->json([
            'message'        => 'Points awarded successfully!',
            'points_earned'  => $trashToken->points,
            'total_points'   => $user->fresh()->points,
        ], 200);
    }
}