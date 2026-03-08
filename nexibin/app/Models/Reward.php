<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'points_required',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'points_required' => 'integer',
        'stock' => 'integer',
    ];
}