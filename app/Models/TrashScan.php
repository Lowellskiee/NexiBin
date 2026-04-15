<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrashScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'trash_event_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function trashEvent()
    {
        return $this->belongsTo(TrashEvent::class);
    }
}