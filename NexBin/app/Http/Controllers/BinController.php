<?php

namespace App\Http\Controllers;

use App\Models\BinLevel;
use App\Models\BinAlert;
use App\Models\CollectionLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BinController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | POST /api/iot/bins  — Arduino sensor push
    |--------------------------------------------------------------------------
    */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'metallic' => 'required|integer|min:0|max:100',
            'wet'      => 'required|integer|min:0|max:100',
            'dry'      => 'required|integer|min:0|max:100',
        ]);

        $reading = BinLevel::storeReading($data);
        $this->handleAlerts($reading);

        return response()->json(['success' => true, 'data' => $reading], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | GET /api/bins/latest  — React dashboard polling
    |--------------------------------------------------------------------------
    */
    public function latest(): JsonResponse
    {
        $latest    = BinLevel::latest()->first();
        $binStates = $this->buildBinStates();

        if (!$latest) {
            return response()->json([
                'metallic'     => 0,
                'wet'          => 0,
                'dry'          => 0,
                'status'       => 'offline',
                'updated_at'   => null,
                'collected_at' => null,
                'alert'        => false,
                'bins'         => $binStates,
            ]);
        }

        $payload = [
            'metallic'     => $latest->metallic,
            'wet'          => $latest->wet,
            'dry'          => $latest->dry,
            'status'       => 'active',
            'collected_at' => $latest->collected_at?->toISOString(),
            'updated_at'   => $latest->updated_at?->toISOString(),
            'alert'        => $latest->isAlert(),
            'bins'         => $binStates,
        ];

        foreach (BinLevel::BIN_TYPES as $bin) {
            if ($binStates[$bin]['state'] !== 'normal') {
                $payload[$bin] = 0;
            }
        }

        return response()->json($payload);
    }

    /*
    |--------------------------------------------------------------------------
    | GET /api/bins/history
    |--------------------------------------------------------------------------
    */
    public function history(Request $request): JsonResponse
    {
        $hours = min((int) $request->query('hours', 24), 168);
        $data  = BinLevel::recentHistory($hours)->map(fn($r) => [
            'metallic'     => $r->metallic,
            'wet'          => $r->wet,
            'dry'          => $r->dry,
            'time'         => $r->created_at->format('H:i'),
            'date'         => $r->created_at->toISOString(),
            'collected_at' => $r->collected_at?->toISOString(),
        ]);

        return response()->json($data);
    }

    /*
    |--------------------------------------------------------------------------
    | GET /api/bins/alerts
    |--------------------------------------------------------------------------
    */
    public function alerts(): JsonResponse
    {
        return response()->json(
            BinAlert::where('resolved', false)->latest()->get()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | POST /api/bins/alerts/{id}/resolve
    |--------------------------------------------------------------------------
    */
    public function resolveAlert($id): JsonResponse
    {
        BinAlert::findOrFail($id)->resolve();
        return response()->json(['success' => true]);
    }

    /*
    |--------------------------------------------------------------------------
    | POST /bins/collect/{binType}  — per-bin collection (Inertia web route)
    |
    | FIX: Was returning response()->json() which Inertia rejected with:
    |      "All Inertia requests must receive a valid Inertia response,
    |       however a plain JSON response was received."
    |
    | FIX: Now uses redirect()->back() with flash data so Inertia handles
    |      the response correctly. Flash data is read in React via
    |      usePage().props.flash.
    |
    | FIX: Cooldown check also redirects back with an error flash instead
    |      of returning JSON.
    |--------------------------------------------------------------------------
    */
    public function collectBin(Request $request, string $binType)
    {
        // Validate bin type
        if (!in_array($binType, BinLevel::BIN_TYPES, true)) {
            return redirect()->back()->withErrors([
                'collect' => "Unknown bin type: {$binType}",
            ]);
        }

        // Cooldown guard — redirect back with flash error instead of JSON 429
        if (BinLevel::binInCooldown($binType)) {
            return redirect()->back()->with('flash', [
                'success' => false,
                'reason'  => 'cooldown',
                'message' => "The {$binType} bin was already collected recently.",
            ]);
        }

        // 1. Zero out the bin and stamp its collected_at
        $collection = BinLevel::collectBin($binType);

        // 2. Write to collection_logs
        CollectionLog::create([
            'bin'          => ucfirst($binType) . ' Bin',
            'location'     => 'CCIS',
            'bin_type'     => $binType,
            'staff_id'     => $request->user()->id,
            'collected_at' => now(),
        ]);

        // 3. Resolve active alerts for this bin
        BinAlert::where('bin_type', $binType)
            ->where('resolved', false)
            ->update(['resolved' => true, 'resolved_at' => now()]);

        // 4. Redirect back with flash so Inertia re-renders the page cleanly
        return redirect()->back()->with('flash', [
            'success'          => true,
            'bin_type'         => $binType,
            'collected_at'     => $collection->{"{$binType}_collected_at"}->toISOString(),
            'cooldown_seconds' => BinLevel::PER_BIN_COOLDOWN_SECONDS,
            'bins'             => $this->buildBinStates(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | POST /api/bins/collect  — legacy global collection (API route, JSON ok)
    |--------------------------------------------------------------------------
    */
    public function collect(): JsonResponse
    {
        if (BinLevel::isInCooldown()) {
            return response()->json([
                'success' => false,
                'reason'  => 'cooldown',
                'message' => 'A collection was already performed recently.',
            ], 429);
        }

        $collection = BinLevel::create([
            'metallic'              => 0,
            'wet'                   => 0,
            'dry'                   => 0,
            'collected_at'          => now(),
            'metallic_collected_at' => now(),
            'wet_collected_at'      => now(),
            'dry_collected_at'      => now(),
            'metallic_peak'         => 0,
            'wet_peak'              => 0,
            'dry_peak'              => 0,
        ]);

        BinAlert::where('resolved', false)
            ->update(['resolved' => true, 'resolved_at' => now()]);

        return response()->json([
            'success'          => true,
            'collected_at'     => $collection->collected_at->toISOString(),
            'cooldown_seconds' => BinLevel::COOLDOWN_SECONDS,
            'bins'             => $this->buildBinStates(),
        ]);
    }
    
    public function status($type)
    {
        $column = $type . '_collected_at';

        $bin = BinLevel::whereNotNull($column)
            ->latest()
            ->first();

        if (!$bin) {
            return response()->json([
                $column => null
            ]);
        }

        return response()->json([
            $column => $bin->$column
        ]);
    }

    /* ── Private helpers ─────────────────────────────────────────────── */

    private function buildBinStates(): array
    {
        $states = [];
        foreach (BinLevel::BIN_TYPES as $bin) {
            $states[$bin] = [
                'state'        => BinLevel::binState($bin),
                'collected_at' => BinLevel::lastBinCollection($bin)?->toISOString(),
            ];
        }
        return $states;
    }

    private function handleAlerts(BinLevel $reading): void
    {
        foreach (BinLevel::BIN_TYPES as $bin) {
            if (BinLevel::binInCooldown($bin)) continue;

            $level    = $reading->$bin;
            $existing = BinAlert::where('bin_type', $bin)->where('resolved', false)->first();

            if ($level >= BinLevel::ALERT_THRESHOLD && !$existing) {
                BinAlert::raise($bin, $level);
            }
            if ($level < BinLevel::ALERT_THRESHOLD && $existing) {
                $existing->resolve();
            }
        }
    }
}
