<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use Illuminate\Support\Facades\Auth;

class RewardController extends Controller
{

    public function redeem(Reward $reward)
    {

        $user = Auth::user();

        if ($reward->stock <= 0) {
            return redirect()->route('dashboard')
                ->with('error','Reward out of stock.');
        }

        if ($user->points < $reward->points_required) {
            return redirect()->route('dashboard')
                ->with('error','Not enough points.');
        }

        // deduct points
        $user->points = $user->points - $reward->points_required;
        $user->save();

        // reduce reward stock
        $reward->stock = $reward->stock - 1;
        $reward->save();

        return redirect()->route('dashboard')
            ->with('success','Reward redeemed successfully!');
    }

}