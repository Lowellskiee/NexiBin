<?php
// app/Models/TrashToken.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrashToken extends Model
{
    protected $fillable = [
        'token',
        'type',
        'points',
        'claimed',
        'claimed_by',
        'claimed_at',
        'expires_at',
    ];

    protected $casts = [
        'claimed'    => 'boolean',
        'claimed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Whether this token has already been claimed by a user.
     */
    public function isClaimed(): bool
    {
        return $this->claimed === true;
    }

    /**
     * Whether this token has passed its expiry time.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * The user who claimed this token.
     */
    public function claimedBy()
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }
}
