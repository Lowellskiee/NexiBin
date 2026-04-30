<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'bin',
        'location',
        'bin_type',
        'staff_id',
        'collected_at'
    ];
    
    protected $casts = [
    'collected_at' => 'datetime',
    ];

    public function staff()
    {
        return $this->belongsTo(User::class,'staff_id');
    }
}