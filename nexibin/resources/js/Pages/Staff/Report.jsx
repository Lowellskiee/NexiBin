import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import StaffLayout from "@/Layouts/StaffLayout";

export default function Report() {
  const { logs, filters } = usePage().props;

  const [search,   setSearch]   = useState(filters?.search   || "");
  const [fromDate, setFromDate] = useState(filters?.fromDate || "");
  const [toDate,   setToDate]   = useState(filters?.toDate   || "");

  /* ── Filter actions ── */

  const applyFilters = () =>
    router.get(route("reports.index"), { search, fromDate, toDate }, {
      preserveState: true, replace: true,
    });

  const clearFilters = () => {
    setSearch(""); setFromDate(""); setToDate("");
    router.get(route("reports.index"), {}, { preserveState: true, replace: true });
  };

  /* ── Quick filters ── */

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today); setToDate(today);
  };

  const setThisWeek = () => {
    const now   = new Date();
    const first = new Date(now.setDate(now.getDate() - now.getDay()));
    const last  = new Date(first); last.setDate(first.getDate() + 6);
    setFromDate(first.toISOString().split("T")[0]);
    setToDate(last.toISOString().split("T")[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    setFromDate(new Date(now.getFullYear(), now.getMonth(),     1).toISOString().split("T")[0]);
    setToDate(  new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]);
  };

  /* ── Export CSV ── */

  const exportCSV = () => {
    const rows = logs.map((log) => [
      log.bin,
      log.location,
      log.staff?.name || "Unknown",
      new Date(log.collected_at).toLocaleString(),
    ]);
    const csv  = [["Bin","Location","Staff","Time"], ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob), download: "collection-report.csv",
    });
    a.click();
  };

  /* ── Analytics ── */

  const collectionsToday = logs.filter(
    (l) => new Date(l.collected_at).toDateString() === new Date().toDateString()
  ).length;

  /* ── UI ── */

  return (
    <StaffLayout>
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 md:px-8 py-5 md:py-8 overflow-x-hidden space-y-5 md:space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Collection Reports
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {logs.length} record{logs.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* ── Analytics Cards ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide font-semibold">Total</p>
            <p className="text-2xl md:text-3xl font-bold text-[#1B1F5E] tabular-nums mt-1">{logs.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide font-semibold leading-tight">Today</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600 tabular-nums mt-1">{collectionsToday}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wide font-semibold leading-tight">Filtered</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600 tabular-nums mt-1">{logs.length}</p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-3">

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search bin, location, or staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-[#1B1F5E] hover:bg-[#14185a] active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 text-sm font-semibold py-2.5 rounded-xl transition-all duration-150"
            >
              Clear
            </button>
          </div>

          {/* Quick filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              { label: "Today",      action: setToday },
              { label: "This Week",  action: setThisWeek },
              { label: "This Month", action: setThisMonth },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all duration-150"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ── */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <svg className="w-12 h-12 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium">No collection logs found</p>
            <p className="text-xs">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Bin","Location","Staff","Time"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{log.bin}</td>
                      <td className="px-5 py-3.5 text-slate-500">{log.location}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#1B1F5E]">
                        {log.staff?.name || "Unknown"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.collected_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-800">{log.bin}</span>
                    <span className="text-[10px] font-semibold text-[#1B1F5E] bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      {log.staff?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0v8m-4-4a4 4 0 108 0" />
                      </svg>
                      {log.location}
                    </span>
                    <span className="text-slate-400 whitespace-nowrap">
                      {new Date(log.collected_at).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </StaffLayout>
  );
}
