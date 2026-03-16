<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrashEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'points',
        'token'
    ];
}