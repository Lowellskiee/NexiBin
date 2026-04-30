<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class BinLevel extends Model
{
    /* ── Constants ─────────────────────────────────────────────────── */

    const BIN_TYPES = ['metallic', 'wet', 'dry'];

    const ALERT_THRESHOLD          = 80;  // % → critical
    const WARN_THRESHOLD           = 50;  // % → warning
    const COOLDOWN_SECONDS         = 60;  // global cooldown (legacy collect)
    const PER_BIN_COOLDOWN_SECONDS = 60;  // per-bin cooldown after collectBin()

    /* ── Mass-assignable ────────────────────────────────────────────── */

    protected $fillable = [
        'metallic', 'wet', 'dry',
        'collected_at',
        'metallic_collected_at', 'wet_collected_at', 'dry_collected_at',
        'metallic_peak', 'wet_peak', 'dry_peak',
    ];

    protected $casts = [
        'collected_at'          => 'datetime',
        'metallic_collected_at' => 'datetime',
        'wet_collected_at'      => 'datetime',
        'dry_collected_at'      => 'datetime',
    ];

    /* ── Helpers ────────────────────────────────────────────────────── */

    public function isCollectionEvent(): bool
    {
        return !is_null($this->collected_at);
    }

    public function isAlert(): bool
    {
        return $this->metallic >= self::ALERT_THRESHOLD
            || $this->wet      >= self::ALERT_THRESHOLD
            || $this->dry      >= self::ALERT_THRESHOLD;
    }

    /* ── Global cooldown (legacy) ───────────────────────────────────── */

    public static function isInCooldown(): bool
    {
        $last = static::whereNotNull('collected_at')->latest('collected_at')->first();
        if (!$last) return false;
        return $last->collected_at->diffInSeconds(now()) < self::COOLDOWN_SECONDS;
    }

    public static function lastCollection(): ?self
    {
        return static::whereNotNull('collected_at')->latest('collected_at')->first();
    }

    /* ── Per-bin cooldown ───────────────────────────────────────────── */

    public static function binInCooldown(string $bin): bool
    {
        $col  = "{$bin}_collected_at";
        $last = static::whereNotNull($col)->latest($col)->first();
        if (!$last || !$last->$col) return false;
        return $last->$col->diffInSeconds(now()) < self::PER_BIN_COOLDOWN_SECONDS;
    }

    public static function lastBinCollection(string $bin): ?Carbon
    {
        $col  = "{$bin}_collected_at";
        $last = static::whereNotNull($col)->latest($col)->first();
        return $last?->$col;
    }

    public static function binState(string $bin): string
    {
        $col  = "{$bin}_collected_at";
        $last = static::whereNotNull($col)->latest($col)->first();
        if (!$last || !$last->$col) return 'normal';

        $elapsed = $last->$col->diffInSeconds(now());
        if ($elapsed >= self::PER_BIN_COOLDOWN_SECONDS) return 'normal';
        if ($elapsed < 10) return 'collecting';
        return 'cooldown';
    }

    /* ── Per-bin collection ─────────────────────────────────────────── */

    public static function collectBin(string $bin): self
    {
        $latest = static::latest()->first();

        $data = [
            'metallic'              => $latest?->metallic ?? 0,
            'wet'                   => $latest?->wet      ?? 0,
            'dry'                   => $latest?->dry      ?? 0,
            'metallic_peak'         => $latest?->metallic_peak ?? 0,
            'wet_peak'              => $latest?->wet_peak      ?? 0,
            'dry_peak'              => $latest?->dry_peak      ?? 0,
            "{$bin}"                => 0,
            "{$bin}_collected_at"   => now(),
            "{$bin}_peak"           => 0,
        ];

        return static::create($data);
    }

    /* ── Non-decreasing store helper ────────────────────────────────── */

    /**
     * Called from BinController::store() on every Arduino POST.
     *
     * FIX: Removed backend max(peak, incoming) enforcement.
     *
     * BEFORE (broken):
     *   $newPeak = max($peak, $incoming);   // ← caused values to get stuck
     *   $row[$bin] = $newPeak;              //   e.g. 100% never goes down
     *
     * AFTER (correct):
     *   $row[$bin] = $incoming;             // ← Arduino is source of truth
     *   $row["{$bin}_peak"] = $incoming;    //   peak mirrors incoming for
     *                                       //   collectBin() reference only
     *
     * WHY this is safe:
     *   The Arduino already runs a non-decreasing filter (peakValue[]).
     *   Values only increase on the device until a server-triggered reset.
     *   Duplicating that logic in Laravel caused the stuck-value bug because
     *   old DB peaks survived collection resets and overrode fresh readings.
     *
     * COOLDOWN behaviour is unchanged:
     *   Bins in cooldown are forced to 0 and their peak is zeroed so that
     *   when the Arduino resumes sending after cooldown, it starts fresh.
     */
    public static function storeReading(array $data): self
    {
        $row = [];

        foreach (self::BIN_TYPES as $bin) {
            if (static::binInCooldown($bin)) {
                // Bin was just collected — hold at 0 until cooldown expires.
                // Peak is also zeroed so the next real reading isn't
                // compared against the old high-water mark.
                $row[$bin]          = 0;
                $row["{$bin}_peak"] = 0;
            } else {
                // Trust the Arduino value directly.
                // Arduino already applies the non-decreasing filter on-device,
                // so we never need max(peak, incoming) here.
                $incoming           = $data[$bin] ?? 0;
                $row[$bin]          = $incoming;
                $row["{$bin}_peak"] = $incoming; // kept for collectBin() reference
            }
        }

        return static::create($row);
    }

    /* ── History ────────────────────────────────────────────────────── */

    public static function recentHistory(int $hours = 24)
    {
        return static::where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at')
            ->get();
    }
}
