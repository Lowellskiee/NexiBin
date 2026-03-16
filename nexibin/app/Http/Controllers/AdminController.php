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

        /* -----------------------------
        BASIC ANALYTICS
        ----------------------------- */

        $totalUsers = User::where('role', 'user')->count();
        $totalStaff = User::where('role', 'staff')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        $totalRedemptions = RewardRedemption::count();


        /* -----------------------------
        RECENT REDEMPTIONS (PAGINATED)
        ----------------------------- */

        $redemptions = RewardRedemption::with(['user', 'reward'])
            ->latest()
            ->paginate(5)
            ->withQueryString();


        /* -----------------------------
        MOST REDEEMED REWARDS
        ----------------------------- */

        $topRewards = RewardRedemption::selectRaw('reward_id, COUNT(*) as total')
            ->groupBy('reward_id')
            ->with('reward')
            ->orderByDesc('total')
            ->take(5)
            ->get();


        /* -----------------------------
        MOST ACTIVE USER
        ----------------------------- */

        $topUser = RewardRedemption::selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->with('user')
            ->orderByDesc('total')
            ->first();


        /* -----------------------------
        TOP USERS LEADERBOARD
        ----------------------------- */

        $topUsers = RewardRedemption::selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->with('user')
            ->orderByDesc('total')
            ->take(5)
            ->get();


        /* -----------------------------
        REDEMPTION ACTIVITY (LAST 7 DAYS)
        ----------------------------- */

        $activity = RewardRedemption::selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->take(7)
            ->get();


        /* -----------------------------
        WASTE COLLECTION LOGS
        Used for Admin Waste Analytics
        ----------------------------- */

        $logs = CollectionLog::latest()->get();


        /* -----------------------------
        RETURN ADMIN DASHBOARD
        ----------------------------- */

        return Inertia::render('Admin/AdminDashboard', [

            'totalUsers' => $totalUsers,
            'totalStaff' => $totalStaff,
            'totalAdmins' => $totalAdmins,

            'totalRedemptions' => $totalRedemptions,

            'redemptions' => $redemptions,
            'topRewards' => $topRewards,

            'topUser' => $topUser,
            'topUsers' => $topUsers,

            'activity' => $activity,

            // Waste analytics
            'logs' => $logs

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE STAFF
    |--------------------------------------------------------------------------
    */

    public function storeStaff(Request $request)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'staff',
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
            'users' => $users
        ]);

    }


    /*
    |--------------------------------------------------------------------------
    | CREATE USER (FULL CRUD)
    |--------------------------------------------------------------------------
    */

    public function storeUser(Request $request)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => 'required|in:user,staff,admin'
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role
        ]);

        return back();

    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */

    public function updateUser(Request $request, User $user)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:user,staff,admin'
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role
        ]);

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
                'error' => 'You cannot delete yourself.'
            ]);

        }

        $user->delete();

        return back();

    }

}