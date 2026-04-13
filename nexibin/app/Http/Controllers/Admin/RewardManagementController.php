<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RewardManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ManageRewards', [
            'rewards' => Reward::latest()->get()->map(function ($r) {
                return [
                    'id' => $r->id,
                    'name' => $r->name,
                    'description' => $r->description,
                    'points_required' => $r->points_required,
                    'stock' => $r->stock,
                    'image' => $r->image,
                    'image_url' => $r->image_url,
                ];
            })
        ]);
    }

    /* ================= STORE ================= */

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points_required' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        $path = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('rewards', 'public');
        }

        Reward::create([
            'name' => $request->name,
            'description' => $request->description,
            'points_required' => $request->points_required,
            'stock' => $request->stock,
            'image' => $path,
            'is_active' => true,
        ]);

        return back();
    }

    /* ================= UPDATE ================= */

    public function update(Request $request, Reward $reward)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'points_required' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        $path = $reward->image;

        if ($request->hasFile('image')) {

            // delete old image
            if ($reward->image) {
                Storage::disk('public')->delete($reward->image);
            }

            $path = $request->file('image')->store('rewards', 'public');
        }

        $reward->update([
            'name' => $request->name,
            'description' => $request->description,
            'points_required' => $request->points_required,
            'stock' => $request->stock,
            'image' => $path,
        ]);

        return back();
    }

    /* ================= DELETE ================= */

    public function destroy(Reward $reward)
    {
        if ($reward->image) {
            Storage::disk('public')->delete($reward->image);
        }

        $reward->delete();

        return back();
    }
}