import { Head, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ─── HELPERS ─────────────────────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTxnId(id, date) {
  const d = date ? new Date(date) : new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(id ?? 0).padStart(4, "0");
  return `TXN-${yyyymmdd}-${seq}`;
}

function calcGrowth(data) {
  if (!data || data.length < 2) return null;
  const half = Math.floor(data.length / 2);
  const prev = data.slice(0, half).reduce((s, d) => s + (d.total || 0), 0);
  const curr = data.slice(half).reduce((s, d) => s + (d.total || 0), 0);
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

/* ─── SKELETON ────────────────────────────────────────────── */

function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-xl ${className}`}
      style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }}
    />
  );
}

/* ─── SUMMARY CARD ────────────────────────────────────────── */

function SummaryCard({ title, value, sub, icon, accent = false, loading = false, onClick }) {
  if (loading) return <Skeleton className="h-28 md:h-32" />;

  const clickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-sm border transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
        ${clickable ? "cursor-pointer active:scale-95" : ""}
        ${accent
          ? "bg-[#1B1F5E] text-white border-transparent"
          : "bg-white text-slate-800 border-slate-100"
        }`}
    >
      {/* decorative blob */}
      <div
        className={`absolute -top-5 -right-5 w-16 h-16 md:w-20 md:h-20 rounded-full opacity-10 ${
          accent ? "bg-white" : "bg-[#1B1F5E]"
        }`}
      />
      <div className="flex items-start justify-between">
        <p className={`text-[10px] md:text-xs font-semibold uppercase tracking-widest leading-tight ${accent ? "text-blue-200" : "text-slate-400"}`}>
          {title}
        </p>
        {icon && <span className="text-xl md:text-2xl">{icon}</span>}
      </div>
      <div>
        <p className={`text-2xl md:text-3xl font-bold mt-2 tabular-nums truncate ${accent ? "text-white" : "text-[#1B1F5E]"}`}>
          {value ?? 0}
        </p>
        {sub && (
          <p className={`text-[10px] md:text-xs mt-1 truncate ${accent ? "text-blue-200" : "text-slate-400"}`}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ─── METRIC PILL ─────────────────────────────────────────── */

function MetricPill({ label, value, delta, loading }) {
  if (loading) return <Skeleton className="h-16 md:h-20" />;
  const positive = delta > 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 md:p-4 flex flex-col gap-1 hover:shadow-md transition-shadow">
      <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-slate-400 leading-tight">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-[#1B1F5E] tabular-nums truncate">{value}</p>
      {delta !== undefined && delta !== null && (
        <span className={`text-[10px] md:text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
          {positive ? "▲" : "▼"} {Math.abs(delta)}%{" "}
          <span className="text-slate-400 font-normal">vs prev period</span>
        </span>
      )}
    </div>
  );
}

/* ─── CHART CARD ──────────────────────────────────────────── */

function ChartCard({ title, children, loading, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-5 gap-2 flex-wrap">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
        {action}
      </div>
      {loading ? <Skeleton className="h-48 md:h-64" /> : children}
    </div>
  );
}

/* ─── TOGGLE GROUP ────────────────────────────────────────── */

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-0.5 md:gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-semibold transition-all duration-150 ${
            value === opt
              ? "bg-[#1B1F5E] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── CHART TAB (mobile) ──────────────────────────────────── */

function ChartTab({ options, value, onChange }) {
  return (
    <div className="flex border-b border-slate-100 mb-4">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 pb-2 text-sm font-semibold transition-colors ${
            value === opt
              ? "text-[#1B1F5E] border-b-2 border-[#1B1F5E]"
              : "text-slate-400"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── EMPTY STATE ─────────────────────────────────────────── */

function EmptyState({ message = "No data available" }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-2 text-slate-400">
      <svg className="w-8 h-8 md:w-10 md:h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs md:text-sm">{message}</p>
    </div>
  );
}

/* ─── CHART OPTIONS ───────────────────────────────────────── */

const baseChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1B1F5E",
      padding: 10,
      cornerRadius: 8,
      titleFont: { size: 11, weight: "600" },
      bodyFont: { size: 12 },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8" } },
    y: {
      beginAtZero: true,
      grid: { color: "#f1f5f9" },
      ticks: { stepSize: 1, precision: 0, font: { size: 10 }, color: "#94a3b8" },
    },
  },
};

/* ─── MAIN DASHBOARD ──────────────────────────────────────── */

export default function AdminDashboard() {
  const {
    totalUsers,
    totalStaff,
    totalAdmins,
    totalRedemptions,
    topUser,
    topRewards = [],
    topUsers = [],
    activity = [],
    redemptions = { data: [] },
    logs = [],
    bins = [],           // Array of { fill_percentage: number, ... }
  } = usePage().props;

  const [loading] = useState(false);
  const [wasteView, setWasteView] = useState("Weekly");
  const [mobileChart, setMobileChart] = useState("Rewards");

  /* ── Waste data ── */
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);

  useEffect(() => {
    if (!logs?.length) { setWeeklyData([]); setMonthlyData([]); setYearlyData([]); return; }

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const wc = {}; const mc = {}; const yc = {};
    months.forEach((m) => (mc[m] = 0));

    logs.forEach((log) => {
      if (!log.collected_at) return;
      const d = new Date(log.collected_at);
      const day = days[d.getDay()];
      const mo = months[d.getMonth()];
      const yr = d.getFullYear();
      wc[day] = (wc[day] || 0) + 1;
      mc[mo]++;
      yc[yr] = (yc[yr] || 0) + 1;
    });

    setWeeklyData(days.map((d) => ({ label: d, total: wc[d] || 0 })));
    setMonthlyData(months.map((m) => ({ label: m, total: mc[m] })));
    setYearlyData(
      Object.keys(yc).map(Number).sort((a, b) => a - b).map((y) => ({ label: String(y), total: yc[y] }))
    );
  }, [logs]);

  /* ── Bin Level Distribution ── */
  const binDistribution = useMemo(() => {
    const items = bins ?? [];
    const low = items.filter((b) => b.fill_percentage <= 30).length;
    const medium = items.filter((b) => b.fill_percentage > 30 && b.fill_percentage <= 70).length;
    const full = items.filter((b) => b.fill_percentage > 70).length;
    return { low, medium, full, total: items.length };
  }, [bins]);

  const binDonutData = useMemo(() => ({
    labels: ["Low (0–30%)", "Medium (31–70%)", "Full (71–100%)"],
    datasets: [{
      data: [binDistribution.low, binDistribution.medium, binDistribution.full],
      backgroundColor: ["#22C55E", "#F59E0B", "#EF4444"],
      borderColor: ["#fff", "#fff", "#fff"],
      borderWidth: 3,
      hoverOffset: 6,
    }],
  }), [binDistribution]);

  const binDonutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 10 }, padding: 10, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "#1B1F5E",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const total = binDistribution.total;
            const val = ctx.parsed;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label.split(" ")[0]}: ${val} bins (${pct}%)`;
          },
        },
      },
    },
  }), [binDistribution]);

  /* ── Chart datasets ── */
  const rewardsChartData = useMemo(() => ({
    labels: topRewards.map((r) => r.reward?.name || "Unknown"),
    datasets: [{
      label: "Redemptions",
      data: topRewards.map((r) => r.total),
      backgroundColor: topRewards.map((_, i) =>
        i === 0 ? "#1B1F5E" : `rgba(27,31,94,${0.55 - i * 0.08})`
      ),
      borderRadius: 8,
      borderSkipped: false,
    }],
  }), [topRewards]);

  const activityChartData = useMemo(() => ({
    labels: activity.map((a) => a.date),
    datasets: [{
      label: "Redemptions",
      data: activity.map((a) => a.total),
      borderColor: "#2563EB",
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, "rgba(37,99,235,0.18)");
        gradient.addColorStop(1, "rgba(37,99,235,0)");
        return gradient;
      },
      tension: 0.45,
      fill: true,
      pointBackgroundColor: "#2563EB",
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  }), [activity]);

  const wasteChartData = useMemo(() => {
    const raw = wasteView === "Weekly" ? weeklyData : wasteView === "Monthly" ? monthlyData : yearlyData;
    return {
      labels: raw.map((d) => d.label),
      datasets: [{
        label: "Bins Collected",
        data: raw.map((d) => d.total),
        borderColor: "#1B1F5E",
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(27,31,94,0.15)");
          gradient.addColorStop(1, "rgba(27,31,94,0)");
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#1B1F5E",
        pointRadius: 4,
        pointHoverRadius: 7,
      }],
    };
  }, [wasteView, weeklyData, monthlyData, yearlyData]);

  /* ── Redemption metrics ── */
  const avgPoints = useMemo(() => {
    const items = redemptions?.data ?? [];
    if (!items.length) return 0;
    const total = items.reduce((s, r) => s + (r.points_used || 0), 0);
    return Math.round(total / items.length);
  }, [redemptions]);

  const mostRedeemed = topRewards[0]?.reward?.name ?? "—";
  const growth = calcGrowth(activity);

  /* ── Recent redemptions ── */
  const recent = useMemo(() => (redemptions?.data ?? []).slice(0, 8), [redemptions]);

  /* ─────────────────────────────────────────────────── */

  return (
    <>
      <Head title="Admin Dashboard" />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.10s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.20s; }
        .fade-up-5 { animation-delay: 0.25s; }
      `}</style>

      <AdminLayout>
        <div className="max-w-screen-2xl mx-auto px-3 md:px-8 py-5 md:py-8 space-y-5 md:space-y-8 overflow-x-hidden">

          {/* ── PAGE HEADER ── */}
          <div className="fade-up">
            <h1 className="text-xl md:text-2xl font-bold text-[#1B1F5E] tracking-tight">Overview</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* ── SUMMARY CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 fade-up fade-up-1">
            <SummaryCard
              title="Total Users"
              value={totalUsers}
              loading={loading}
              onClick={() => router.visit(route("admin.users.index"))}
            />
            <SummaryCard
              title="Total Staff"
              value={totalStaff}
              loading={loading}
              onClick={() => router.visit(route("admin.users.index"))}
            />
            <SummaryCard
              title="Total Admins"
              value={totalAdmins}
              loading={loading}
              onClick={() => router.visit(route("admin.users.index"))}
            />
            <SummaryCard
              title="Rewards Redeemed"
              value={totalRedemptions}
              accent
              loading={loading}
              onClick={() => router.visit(route("admin.redemptions.index"))}
            />
            <SummaryCard
              title="Top Redeemer"
              value={topUser?.user?.name || "No Data"}
              sub={`${topUser?.total || 0} redemptions`}
              icon="🏆"
              loading={loading}
            />
          </div>

          {/* ── REWARD ANALYTICS ── */}

          {/* Mobile: tabbed */}
          <div className="md:hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4 fade-up fade-up-2">
            <ChartTab
              options={["Rewards", "Activity"]}
              value={mobileChart}
              onChange={setMobileChart}
            />
            <div className="h-48">
              {mobileChart === "Rewards" ? (
                topRewards.length ? (
                  <Bar data={rewardsChartData} options={baseChartOpts} />
                ) : <EmptyState />
              ) : (
                activity.length ? (
                  <Line data={activityChartData} options={baseChartOpts} />
                ) : <EmptyState />
              )}
            </div>
          </div>

          {/* Desktop: side-by-side */}
          <div className="hidden md:grid md:grid-cols-2 gap-6 fade-up fade-up-2">
            <ChartCard title="Most Redeemed Rewards" loading={loading}>
              <div className="h-48 md:h-64">
                {topRewards.length ? (
                  <Bar data={rewardsChartData} options={baseChartOpts} />
                ) : <EmptyState />}
              </div>
            </ChartCard>

            <ChartCard title="Redemption Activity" loading={loading}>
              <div className="h-48 md:h-64">
                {activity.length ? (
                  <Line data={activityChartData} options={baseChartOpts} />
                ) : <EmptyState />}
              </div>
            </ChartCard>
          </div>

          {/* ── WASTE ANALYTICS ── */}
          <ChartCard
            title="Waste Collection Analytics"
            loading={loading}
            action={
              <ToggleGroup
                options={["Weekly", "Monthly", "Yearly"]}
                value={wasteView}
                onChange={setWasteView}
              />
            }
          >
            <div className="h-48 md:h-64 fade-up fade-up-3">
              {(wasteView === "Weekly" ? weeklyData : wasteView === "Monthly" ? monthlyData : yearlyData).length ? (
                <Line data={wasteChartData} options={baseChartOpts} />
              ) : <EmptyState message="No collection data yet" />}
            </div>
          </ChartCard>

          {/* ── REDEMPTION INSIGHTS ── */}
          <div className="fade-up fade-up-4 space-y-4 md:space-y-6">

            {/* Metric pills */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <MetricPill
                label="Avg Points / Redemption"
                value={avgPoints.toLocaleString()}
                loading={loading}
              />
              <MetricPill
                label="Top Reward"
                value={mostRedeemed}
                loading={loading}
              />
              <MetricPill
                label="Redemption Growth"
                value={growth !== null ? `${growth > 0 ? "+" : ""}${growth}%` : "—"}
                delta={growth}
                loading={loading}
              />
            </div>

            {/* Bin Level Distribution + recent redemptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

              {/* Bin Level Donut */}
              <ChartCard title="Bin Level Distribution" loading={loading}>
                <div className="h-48 md:h-52 flex items-center justify-center">
                  {binDistribution.total > 0 ? (
                    <Doughnut data={binDonutData} options={binDonutOptions} />
                  ) : (
                    <EmptyState message="No bin data available" />
                  )}
                </div>
              </ChartCard>

              {/* Recent Redemptions */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Recent Redemptions
                  </h2>
                  <button
                    onClick={() => router.visit(route("admin.redemptions.index"))}
                    className="text-xs font-semibold text-[#1B1F5E] hover:text-blue-700 transition-colors flex items-center gap-1"
                  >
                    View All
                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 md:h-12" />)}
                  </div>
                ) : recent.length === 0 ? (
                  <EmptyState message="No redemptions yet" />
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm min-w-0">
                        <thead>
                          <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-3 text-left font-semibold">TXN ID</th>
                            <th className="pb-3 text-left font-semibold">User</th>
                            <th className="pb-3 text-left font-semibold">Reward</th>
                            <th className="pb-3 text-right font-semibold">Points</th>
                            <th className="pb-3 text-right font-semibold">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recent.map((r) => (
                            <tr key={r.id} className="group hover:bg-slate-50 transition-colors">
                              <td className="py-3 pr-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                                {formatTxnId(r.id, r.created_at)}
                              </td>
                              <td className="py-3 pr-3 font-medium text-slate-700 max-w-[120px] truncate">
                                {r.user?.name ?? "—"}
                              </td>
                              <td className="py-3 pr-3 text-slate-600 max-w-[120px] truncate">
                                {r.reward?.name ?? "—"}
                              </td>
                              <td className="py-3 pr-3 text-right font-semibold text-[#1B1F5E] tabular-nums whitespace-nowrap">
                                {(r.points_used ?? 0).toLocaleString()}
                              </td>
                              <td className="py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                                {new Date(r.created_at).toLocaleString("en-US", {
                                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="md:hidden space-y-2">
                      {recent.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-800 truncate">{r.user?.name ?? "—"}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                {formatTxnId(r.id, r.created_at)}
                              </p>
                            </div>
                            <span className="font-semibold text-sm text-[#1B1F5E] whitespace-nowrap shrink-0">
                              {(r.points_used ?? 0).toLocaleString()} pts
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="truncate mr-2">{r.reward?.name ?? "—"}</span>
                            <span className="text-slate-400 whitespace-nowrap shrink-0">
                              {new Date(r.created_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── FOOTER SPACER ── */}
          <div className="h-2 md:h-4" />
        </div>
      </AdminLayout>
    </>
  );
}
