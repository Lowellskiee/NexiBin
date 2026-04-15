<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CollectionLog;
use Illuminate\Support\Facades\Auth;

class CollectionController extends Controller
{

public function store(Request $request)
{

$request->validate([
'bin'=>'required',
'location'=>'required',
'bin_type'=>'required'
]);

CollectionLog::create([
'bin'=>$request->bin,
'location'=>$request->location,
'bin_type'=>$request->bin_type,
'staff_id'=>Auth::id(),
'collected_at'=>now()
]);

return back();

}

}
