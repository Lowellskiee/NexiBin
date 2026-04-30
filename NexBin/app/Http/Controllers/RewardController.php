<?php

namespace App\Http\Controllers;

use App\Models\Reward;
use App\Models\RewardRedemption;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class RewardController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SHOW ALL REWARDS
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $user = Auth::user();

        $rewards = Reward::where('is_active', true)->get();

        $redemptions = RewardRedemption::with('reward')
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(10);

        return Inertia::render('Rewards/Index', [
            'rewards'            => $rewards,
            'redemptions'        => $redemptions,
            'latestRedemptionId' => session('latestRedemptionId'),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REDEEM REWARD
    |--------------------------------------------------------------------------
    */

    public function redeem(Reward $reward)
    {
        $user = Auth::user();

        if ($reward->stock <= 0) {
            return redirect()->route('rewards.index')
                ->with('error', 'Reward out of stock.');
        }

        if ($user->points < $reward->points_required) {
            return redirect()->route('rewards.index')
                ->with('error', 'Not enough points.');
        }

        /* Deduct user points */
        $user->points -= $reward->points_required;
        $user->save();

        /* Reduce reward stock */
        $reward->stock -= 1;
        $reward->save();

        /* Save redemption record */
        $redemption = RewardRedemption::create([
            'user_id'    => $user->id,
            'reward_id'  => $reward->id,
            'points_used' => $reward->points_required,
            'status'     => 'Pending',
            'transaction_id' => Str::uuid(),
        ]);

        return redirect()->route('rewards.index')->with([
            'latestRedemptionId' => $redemption->id,
        ]);
    }
}