<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use App\Models\RewardRedemption;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RewardController extends Controller
{
    public function redeem(Reward $reward)
    {
        $user = Auth::user();

        if ($reward->stock <= 0) {
            return redirect()->route('dashboard')
                ->with('error', 'Reward out of stock.');
        }

        if ($user->points < $reward->points_required) {
            return redirect()->route('dashboard')
                ->with('error', 'Not enough points.');
        }

        // Deduct user points
        $user->points -= $reward->points_required;
        $user->save();

        // Reduce reward stock
        $reward->stock -= 1;
        $reward->save();

        // Generate transaction ID
        $transactionId = 'TXN-' . strtoupper(Str::random(8));

        // Save redemption record
        RewardRedemption::create([
            'transaction_id' => $transactionId,
            'user_id' => $user->id,
            'reward_id' => $reward->id,
            'points_used' => $reward->points_required
        ]);

        return redirect()->route('dashboard')->with([
            'success' => 'Reward redeemed successfully!',
            'reward_name' => $reward->name,
            'points_used' => $reward->points_required,
            'transaction_id' => $transactionId
        ]);
    }
}