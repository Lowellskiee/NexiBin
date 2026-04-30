<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\RewardRedemption;
use App\Models\CollectionLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | ADMIN DASHBOARD
    |--------------------------------------------------------------------------
    */
    public function dashboard()
    {
        /* ── User counts ─────────────────────────────────────── */
        $totalUsers  = User::where('role', 'user')->count();
        $totalStaff  = User::where('role', 'staff')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        /* ── Redemption count ────────────────────────────────── */
        $totalRedemptions = RewardRedemption::count();

        /* ── Recent redemptions (paginated) ──────────────────── */
        $redemptions = RewardRedemption::with(['user', 'reward'])
            ->latest()
            ->paginate(5)
            ->withQueryString();

        /* ── Most redeemed rewards (top 5) ───────────────────── */
        $topRewards = RewardRedemption::selectRaw('reward_id, COUNT(*) as total')
            ->groupBy('reward_id')
            ->with('reward')
            ->orderByDesc('total')
            ->take(5)
            ->get();

        /* ── Top redeemer
        |    FIX: single ->with() call so student fields are
        |    included — the old code had two ->with() calls
        |    and the second one silently overwrote the first.
        ─────────────────────────────────────────────────────── */
        $topUser = RewardRedemption::selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->orderByDesc('total')
            ->with(['user:id,name,student_number,course,year_level,section'])
            ->first();

        /* ── Top users leaderboard (top 5) ───────────────────── */
        $topUsers = RewardRedemption::selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->orderByDesc('total')
            ->with(['user:id,name,student_number,course,year_level,section'])
            ->take(5)
            ->get();

        /* ── Redemption activity (last 7 days) ───────────────── */
        $activity = RewardRedemption::selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->take(7)
            ->get();

        /* ── Waste collection logs ────────────────────────────── */
        $logs = CollectionLog::latest()->get();

        /* ── Return view
        |    NOTE: bins are fetched live via /api/bins/latest
        |    in the frontend — no need to pass them here.
        ─────────────────────────────────────────────────────── */
        return Inertia::render('Admin/AdminDashboard', [
            'totalUsers'       => $totalUsers,
            'totalStaff'       => $totalStaff,
            'totalAdmins'      => $totalAdmins,
            'totalRedemptions' => $totalRedemptions,
            'redemptions'      => $redemptions,
            'topRewards'       => $topRewards,
            'topUser'          => $topUser,
            'topUsers'         => $topUsers,
            'activity'         => $activity,
            'logs'             => $logs,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE STAFF (legacy — kept for compatibility)
    |--------------------------------------------------------------------------
    */
    public function storeStaff(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:8',
        ]);

        User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'staff',
        ]);

        return redirect()->route('admin.dashboard');
    }

    /*
    |--------------------------------------------------------------------------
    | MANAGE USERS PAGE
    |--------------------------------------------------------------------------
    */
    public function manageUsers()
    {
        $users = User::orderBy('id', 'desc')->get();

        return Inertia::render('Admin/ManageUsers', [
            'users' => $users,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |    FIX: now validates and saves student_number, course,
    |    year_level, section — these were silently dropped before.
    |--------------------------------------------------------------------------
    */
    public function storeUser(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:8',
            'role'           => 'required|in:user,staff,admin',
            'student_number' => 'nullable|string|max:50',
            'course'         => 'nullable|string|max:100',
            'year_level'     => 'nullable|string|max:50',
            'section'        => 'nullable|string|max:50',
        ]);

        User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'role'           => $request->role,
            'student_number' => $request->student_number,
            'course'         => $request->course,
            'year_level'     => $request->year_level,
            'section'        => $request->section,
        ]);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |    FIX: now validates and saves student_number, course,
    |    year_level, section — these were silently dropped before.
    |    Password update is optional (leave blank to keep existing).
    |--------------------------------------------------------------------------
    */
    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email,' . $user->id,
            'role'           => 'required|in:user,staff,admin',
            'student_number' => 'nullable|string|max:50',
            'course'         => 'nullable|string|max:100',
            'year_level'     => 'nullable|string|max:50',
            'section'        => 'nullable|string|max:50',
            'password'       => 'nullable|min:8',
        ]);

        $data = [
            'name'           => $request->name,
            'email'          => $request->email,
            'role'           => $request->role,
            'student_number' => $request->student_number,
            'course'         => $request->course,
            'year_level'     => $request->year_level,
            'section'        => $request->section,
        ];

        // Only update password if a new one was provided
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE USER
    |--------------------------------------------------------------------------
    */
    public function deleteUser(User $user)
    {
        if (auth()->id() === $user->id) {
            return back()->withErrors([
                'error' => 'You cannot delete yourself.',
            ]);
        }

        try {
            $user->delete();
            return back();

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return back()->withErrors([
                    'error' => 'Cannot delete this user — they have existing collection logs.',
                ]);
            }
            throw $e;
        }
    }
}
