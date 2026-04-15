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
        'claimed_by',
        'claimed_at',
        'expires_at',
    ];

    protected $casts = [
        'claimed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function claimedBy()
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function isClaimed(): bool
    {
        return !is_null($this->claimed_at);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && now()->isAfter($this->expires_at);
    }
}