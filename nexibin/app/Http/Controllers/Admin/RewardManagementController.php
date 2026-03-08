<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RewardManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ManageRewards', [
            'rewards' => Reward::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points_required' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        Reward::create($request->only([
            'name',
            'description',
            'points_required',
            'stock',
            'is_active'
        ]));

        return redirect()->back();
    }

    public function update(Request $request, Reward $reward)
    {
        $reward->update($request->all());
        return redirect()->back();
    }

    public function destroy(Reward $reward)
    {
        $reward->delete();
        return redirect()->back();
    }
}