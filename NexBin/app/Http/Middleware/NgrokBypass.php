<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NgrokBypass
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    
    public function handle(Request $request, Closure $next)
    {
        if ($request->hasHeader('X-Forwarded-Proto')) {
            $request->server->set('HTTPS', 'on');
        }

        return $next($request)->header('ngrok-skip-browser-warning', 'true');
    }
}
