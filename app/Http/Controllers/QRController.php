<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TrashEvent;
use App\Models\TrashScan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QRController extends Controller
{
    public function scan(Request $request)
    {

        /* =========================================
        VALIDATE REQUEST
        ========================================= */

        $request->validate([
            'code' => 'required|string'
        ]);

        $user = Auth::user();
        $token = $request->code;

        /* =========================================
        FIND TRASH EVENT USING TOKEN
        ========================================= */

        $event = TrashEvent::where('token', $token)->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code.'
            ], 404);
        }

        /* =========================================
        PREVENT RAPID SPAM SCANNING
        ========================================= */

        $lastScan = TrashScan::where('user_id', $user->id)
            ->latest()
            ->first();

        if ($lastScan && now()->diffInSeconds($lastScan->created_at) < 3) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before scanning again.'
            ], 429);
        }

        /* =========================================
        PROCESS SCAN USING DATABASE TRANSACTION
        ========================================= */

        try {

            DB::beginTransaction();

            /* Lock the event row to prevent race conditions */

            $event = TrashEvent::where('id', $event->id)
                ->lockForUpdate()
                ->first();

            /* =========================================
            CHECK IF QR ALREADY CLAIMED BY ANY USER
            ========================================= */

            if ($event->is_claimed) {

                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'This QR code has already been used.'
                ], 409);
            }

            /* =========================================
            SAVE SCAN RECORD
            ========================================= */

            TrashScan::create([
                'user_id' => $user->id,
                'trash_event_id' => $event->id
            ]);

            /* =========================================
            ADD POINTS TO USER
            ========================================= */

            $user->increment('points', $event->points);

            /* =========================================
            MARK QR AS CLAIMED (GLOBAL LOCK)
            ========================================= */

            $event->is_claimed = 1;
            $event->save();

            DB::commit();

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Scan failed. Please try again.'
            ], 500);
        }

        /* =========================================
        SUCCESS RESPONSE
        ========================================= */

        return response()->json([
            'success' => true,
            'points' => $event->points,
            'event' => $event->type ?? 'Trash Event'
        ]);
    }
}