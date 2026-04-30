<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CollectionLog;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = CollectionLog::with('staff');

        /* Search */
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('bin', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%")
                  ->orWhereHas('staff', function ($q2) use ($request) {
                      $q2->where('name', 'like', "%{$request->search}%");
                  });
            });
        }

        /* Date Filters */
        if ($request->fromDate) {
            $query->whereDate('collected_at', '>=', $request->fromDate);
        }

        if ($request->toDate) {
            $query->whereDate('collected_at', '<=', $request->toDate);
        }

        $logs = $query->latest()->get();

        return Inertia::render('Report', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'fromDate', 'toDate']),
        ]);
    }
}