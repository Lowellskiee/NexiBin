<?php

namespace App\Http\Controllers;

use App\Models\User;
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
        return Inertia::render('Admin/AdminDashboard', [
            'totalUsers' => User::where('role', 'user')->count(),
            'totalStaff' => User::where('role', 'staff')->count(),
            'totalAdmins' => User::where('role', 'admin')->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW CREATE STAFF PAGE
    |--------------------------------------------------------------------------
    */
    public function createStaff()
    {
        return Inertia::render('Admin/CreateStaff');
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
    | READ USERS
    |--------------------------------------------------------------------------
    */
    public function manageUsers()
    {
        return Inertia::render('Admin/ManageUsers', [
            'users' => User::orderBy('id', 'desc')->get()
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
    | UPDATE USER (FULL UPDATE)
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
            return back()->withErrors(['error' => 'You cannot delete yourself.']);
        }

        $user->delete();

        return back();
    }
}