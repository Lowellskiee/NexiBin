<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Root template loaded on first page visit
     */
    protected $rootView = 'app';

    /**
     * Asset versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Shared data available to all Inertia pages
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [

            /*
            |--------------------------------------------------------------------------
            | Authenticated User
            |--------------------------------------------------------------------------
            */

            'auth' => [
                'user' => $request->user(),
            ],

            /*
            |--------------------------------------------------------------------------
            | Flash Messages
            |--------------------------------------------------------------------------
            */

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),

                /* reward redemption info */

                'reward_name' => fn () => $request->session()->get('reward_name'),
                'points_used' => fn () => $request->session()->get('points_used'),
                'transaction_id' => fn () => $request->session()->get('transaction_id'),
            ],

        ]);
    }
}