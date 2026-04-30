import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";
import { Link } from "@inertiajs/react";

/* ── TXN ID format ── */
function formatTxnId(id, date) {
  const d = new Date(date);
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `TXN-${yyyymmdd}-${String(id).padStart(4, "0")}`;
}

export default function Redemptions({ redemptions }) {
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState("latest");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  /* ── Filter + Sort ── */
  let filtered = redemptions.data.filter((r) =>
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.reward?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (fromDate) filtered = filtered.filter((r) => new Date(r.created_at) >= new Date(fromDate));
  if (toDate)   filtered = filtered.filter((r) => new Date(r.created_at) <= new Date(toDate));

  if (sort === "latest")  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sort === "oldest")  filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (sort === "points")  filtered.sort((a, b) => b.points_used - a.points_used);

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = filtered.map((r) => [
      formatTxnId(r.id, r.created_at),
      r.user?.name  || "",
      r.reward?.name || "",
      r.points_used,
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv  = ["data:text/csv;charset=utf-8,",
      [["Transaction","User","Reward","Points","Date"], ...rows].map((e) => e.join(",")).join("\n"),
    ].join("");
    const a = Object.assign(document.createElement("a"), {
      href: encodeURI(csv), download: "redemptions.csv",
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ── Shared input class ── */
  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E] transition";

  /* ── UI ── */
  return (
    <AdminLayout>
      <div className="max-w-screen-2xl mx-auto px-3 md:px-8 py-5 md:py-8 overflow-x-hidden space-y-5 md:space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1B1F5E] tracking-tight">
              Redemption Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
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

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-3">
          {/* Row 1: search full-width */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search user or reward…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>

          {/* Row 2: sort + date range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="points">Highest Points</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Clear */}
          {(search || fromDate || toDate) && (
            <button
              onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* ── Empty State ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <svg className="w-12 h-12 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No redemptions found</p>
            <p className="text-xs">Try adjusting your search or date filters</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B1F5E] text-white">
                    {["Transaction","User","Reward","Points","Date"].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-widest
                        ${i === 0 ? "text-left" : i < 3 ? "text-left" : "text-center"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {formatTxnId(r.id, r.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700 max-w-[140px] truncate">
                        {r.user?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">
                        {r.reward?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-[#1B1F5E] tabular-nums">
                        {(r.points_used ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="md:hidden space-y-2">
              {filtered.map((r) => (
                <div key={r.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-slate-200 transition-colors">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-800 truncate">
                      {r.user?.name ?? "—"}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>
                  {/* TXN ID */}
                  <p className="font-mono text-[10px] text-slate-400 mb-2">
                    {formatTxnId(r.id, r.created_at)}
                  </p>
                  {/* Bottom row */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate mr-2">{r.reward?.name ?? "—"}</span>
                    <span className="font-bold text-[#1B1F5E] whitespace-nowrap shrink-0">
                      {(r.points_used ?? 0).toLocaleString()} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Pagination ── */}
        {redemptions.links?.length > 3 && (
        <div className="flex justify-center flex-wrap gap-1.5 md:gap-2 pt-1">
          {redemptions.links.map((link, i) => (
            <Link
              key={i}
              href={link.url || "#"}
              preserveState
              preserveScroll
              as="button"
              disabled={!link.url}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                ${link.active
                  ? "bg-[#1B1F5E] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }
                ${!link.url ? "opacity-40 cursor-not-allowed" : ""}
              `}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
