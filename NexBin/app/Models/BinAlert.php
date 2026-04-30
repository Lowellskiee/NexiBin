<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class BinAlert extends Model
{
    protected $fillable = ['bin_type', 'level_at_alert', 'resolved', 'resolved_at'];

    protected $casts = [
        'level_at_alert' => 'integer',
        'resolved'       => 'boolean',
        'resolved_at'    => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeUnresolved(Builder $query): Builder
    {
        return $query->where('resolved', false);
    }

    public function scopeForBin(Builder $query, string $bin): Builder
    {
        return $query->where('bin_type', $bin);
    }

    /*
    |--------------------------------------------------------------------------
    | INSTANCE METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Mark this alert as resolved with a timestamp.
     */
    public function resolve(): void
    {
        $this->update([
            'resolved'    => true,
            'resolved_at' => now(),
        ]);
    }

    /**
     * True if this alert has been open longer than the given minutes.
     * Useful for escalation logic later.
     */
    public function isStale(int $minutes = 30): bool
    {
        return $this->created_at->diffInMinutes(now()) > $minutes;
    }

    /*
    |--------------------------------------------------------------------------
    | STATIC HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get the active (unresolved) alert for a specific bin type.
     * e.g. BinAlert::unresolvedForBin('metallic')
     */
    public static function unresolvedForBin(string $bin): ?self
    {
        return static::unresolved()->forBin($bin)->first();
    }

    /**
     * Resolve ALL active alerts at once — used when a bin is collected.
     */
    public static function resolveAll(): void
    {
        static::unresolved()->each->resolve();
    }

    /**
     * Create a new alert for a bin that just crossed the threshold.
     */
    public static function raise(string $bin, int $level): self
    {
        return static::create([
            'bin_type'       => $bin,
            'level_at_alert' => $level,
            'resolved'       => false,
        ]);
    }
}