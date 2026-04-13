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
        'image',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'points_required' => 'integer',
        'stock' => 'integer',
    ];

    /* ================= IMAGE URL ACCESSOR ================= */

    public function getImageUrlAttribute()
    {
        return $this->image
            ? asset('storage/' . $this->image)
            : null;
    }
}