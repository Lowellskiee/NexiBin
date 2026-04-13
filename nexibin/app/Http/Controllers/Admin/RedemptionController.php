<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RewardRedemption;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RedemptionController extends Controller
{
    public function index(Request $request)
    {
        $query = RewardRedemption::with(['user', 'reward']);

        // Search by user or reward name
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('reward', function ($r) use ($search) {
                    $r->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Date range filter
        if ($from = $request->input('fromDate')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->input('toDate')) {
            $query->whereDate('created_at', '<=', $to);
        }

        // Sorting
        switch ($request->input('sort', 'latest')) {
            case 'oldest':
                $query->oldest();
                break;
            case 'points':
                $query->orderByDesc('points_used');
                break;
            default:
                $query->latest();
        }

        // Pagination
        $redemptions = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Redemptions', [
            'redemptions' => $redemptions,
            'filters' => $request->only(['search', 'sort', 'fromDate', 'toDate']),
        ]);
    }
}