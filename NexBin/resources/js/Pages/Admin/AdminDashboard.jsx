import { Head, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Bar, Line } from "react-chartjs-2";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
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
    Title,
    Tooltip,
    Legend,
    Filler
);

/* ─── CONSTANTS ───────────────────────────────────────────── */

const POLL_MS = 10000;

const INITIAL_BINS = [
    { id: "metallic", name: "Metallic Bin", location: "CCIS", fill_percentage: 0, last_collected_at: null },
    { id: "wet",      name: "Wet Bin",      location: "CCIS", fill_percentage: 0, last_collected_at: null },
    { id: "dry",      name: "Dry Bin",      location: "CCIS", fill_percentage: 0, last_collected_at: null },
];

/* ─── HELPERS ─────────────────────────────────────────────── */

function timeAgo(dateStr) {
    if (!dateStr) return "Never";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatTxnId(id, date) {
    const d        = date ? new Date(date) : new Date();
    const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
    const seq      = String(id ?? 0).padStart(4, "0");
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

function binStatus(fill) {
    if (fill > 70) return { label: "Full",   color: "text-red-500",     bar: "bg-red-500",     dot: "bg-red-500"     };
    if (fill > 30) return { label: "Medium", color: "text-amber-500",   bar: "bg-amber-400",   dot: "bg-amber-400"   };
    return           { label: "Normal", color: "text-emerald-600", bar: "bg-emerald-500", dot: "bg-emerald-500" };
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

/* ─── ARDUINO PILL ────────────────────────────────────────── */

function ArduinoPill({ status }) {
    const online = status === "online";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold whitespace-nowrap
            ${online
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
        >
            <span className="relative flex h-2 w-2 shrink-0">
                {online && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? "bg-green-400" : "bg-red-400"}`} />
            </span>
            {online ? "Online" : "Offline"}
        </span>
    );
}

/* ─── SUMMARY CARD ────────────────────────────────────────── */

function SummaryCard({ title, value, sub, icon, accent = false, loading = false, onClick }) {
    if (loading) return <Skeleton className="h-24 sm:h-28" />;
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl p-3 sm:p-5 flex flex-col justify-between shadow-sm border
                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                ${onClick ? "cursor-pointer active:scale-95" : ""}
                ${accent
                    ? "bg-[#1B1F5E] text-white border-transparent"
                    : "bg-white text-slate-800 border-slate-100"
                }`}
        >
            <div className={`absolute -top-4 -right-4 w-14 h-14 sm:w-20 sm:h-20 rounded-full opacity-10
                ${accent ? "bg-white" : "bg-[#1B1F5E]"}`}
            />
            <div className="flex items-start justify-between gap-1">
                <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest leading-tight
                    ${accent ? "text-blue-200" : "text-slate-400"}`}>
                    {title}
                </p>
                {icon && <span className="text-base sm:text-xl shrink-0">{icon}</span>}
            </div>
            <div className="mt-2">
                <p className={`text-xl sm:text-3xl font-bold tabular-nums truncate
                    ${accent ? "text-white" : "text-[#1B1F5E]"}`}>
                    {value ?? 0}
                </p>
                {sub && (
                    <p className={`text-[9px] sm:text-xs mt-0.5 truncate
                        ${accent ? "text-blue-200" : "text-slate-400"}`}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ─── TOP REDEEMER CARD ───────────────────────────────────── */

function TopRedeemerCard({ topUser, loading }) {
    if (loading) return <Skeleton className="h-24 sm:h-28" />;

    const user        = topUser?.user ?? null;
    const total       = topUser?.total ?? 0;
    const name        = user?.name           ?? "No Data";
    const studentNo   = user?.student_number ?? null;
    const year        = user?.year_level     ?? null;
    const section     = user?.section        ?? null;

    // Build a compact info line e.g. "00-100000 · 3rd Year · Section A"
    const details = [studentNo, year ? `${year}` : null, section]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className="relative overflow-hidden rounded-2xl p-3 sm:p-5 flex flex-col justify-between
            shadow-sm border bg-white text-slate-800 border-slate-100
            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -top-4 -right-4 w-14 h-14 sm:w-20 sm:h-20 rounded-full opacity-10 bg-[#1B1F5E]" />
            <div className="flex items-start justify-between gap-1">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">
                    Top Redeemer
                </p>
                <span className="text-base sm:text-xl shrink-0">🏆</span>
            </div>
            <div className="mt-2">
                <p className="text-base sm:text-xl font-bold text-[#1B1F5E] truncate leading-tight">
                    {name}
                </p>
                {details && (
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
                        {details}
                    </p>
                )}
                <p className="text-[9px] sm:text-xs text-slate-400 mt-0.5">
                    {total} redemption{total !== 1 ? "s" : ""}
                </p>
            </div>
        </div>
    );
}

/* ─── CHART CARD ──────────────────────────────────────────── */

function ChartCard({ title, children, loading, action }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
                {action}
            </div>
            {loading ? <Skeleton className="h-44 sm:h-64" /> : children}
        </div>
    );
}

/* ─── TOGGLE GROUP ────────────────────────────────────────── */

function ToggleGroup({ options, value, onChange }) {
    return (
        <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-0.5">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`px-2 py-1 rounded-lg text-[9px] sm:text-xs font-semibold transition-all duration-150
                        ${value === opt
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

/* ─── CHART TAB ───────────────────────────────────────────── */

function ChartTab({ options, value, onChange }) {
    return (
        <div className="flex border-b border-slate-100 mb-4">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`flex-1 pb-2 text-xs sm:text-sm font-semibold transition-colors
                        ${value === opt
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
        <div className="flex flex-col items-center justify-center h-full min-h-[100px] gap-2 text-slate-400">
            <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs">{message}</p>
        </div>
    );
}

/* ─── LIVE BIN CARD ───────────────────────────────────────── */

function LiveBinCard({ bin, index }) {
    const fill   = bin.fill_percentage ?? 0;
    const status = binStatus(fill);

    return (
        <div className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                        <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                            {bin.name ?? `Bin #${index + 1}`}
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 pl-3.5 truncate">
                        {bin.location ?? "—"} · {timeAgo(bin.last_collected_at)}
                    </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                    <p className={`text-lg sm:text-xl font-bold tabular-nums ${status.color}`}>{fill}%</p>
                    <p className={`text-[10px] font-semibold ${status.color}`}>{status.label}</p>
                </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${status.bar}`}
                    style={{ width: `${Math.min(fill, 100)}%` }}
                />
            </div>
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
            padding: 8,
            cornerRadius: 8,
            titleFont: { size: 10, weight: "600" },
            bodyFont:  { size: 11 },
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: {
                font:      { size: 9 },
                color:     "#94a3b8",
                maxRotation: 0,
                callback: function(val) {
                    const label = this.getLabelForValue(val);
                    return label?.length > 8 ? label.slice(0, 8) + "…" : label;
                },
            },
        },
        y: {
            beginAtZero: true,
            grid:  { color: "#f1f5f9" },
            ticks: { stepSize: 1, precision: 0, font: { size: 9 }, color: "#94a3b8" },
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
        topRewards  = [],
        topUsers    = [],
        activity    = [],
        redemptions = { data: [] },
        logs        = [],
    } = usePage().props;

    const [loading]     = useState(false);
    const [wasteView,   setWasteView]   = useState("Weekly");
    const [mobileChart, setMobileChart] = useState("Rewards");

    /* ── Live bin state ── */
    const [bins,          setBins]          = useState(INITIAL_BINS);
    const [arduinoStatus, setArduinoStatus] = useState("offline");
    const [lastPing,      setLastPing]      = useState(null);
    const pollRef = useRef(null);

    /* ── Poll /api/bins/latest ── */
    const pollBins = useCallback(async () => {
        try {
            const res = await fetch("/api/bins/latest", {
                headers:     { Accept: "application/json" },
                credentials: "include",
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const isOnline = ["active", "collected", "cooldown"].includes(data.status);
            setArduinoStatus(isOnline ? "online" : "offline");
            setLastPing(new Date());

            setBins([
                { id: "metallic", name: "Metallic Bin", location: "CCIS", fill_percentage: data.metallic ?? 0, last_collected_at: data.collected_at ?? null },
                { id: "wet",      name: "Wet Bin",      location: "CCIS", fill_percentage: data.wet      ?? 0, last_collected_at: data.collected_at ?? null },
                { id: "dry",      name: "Dry Bin",      location: "CCIS", fill_percentage: data.dry      ?? 0, last_collected_at: data.collected_at ?? null },
            ]);
        } catch {
            setArduinoStatus("offline");
        }
    }, []);

    useEffect(() => {
        pollBins();
        pollRef.current = setInterval(pollBins, POLL_MS);
        return () => clearInterval(pollRef.current);
    }, [pollBins]);

    /* ── Waste chart data ── */
    const [weeklyData,  setWeeklyData]  = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [yearlyData,  setYearlyData]  = useState([]);

    useEffect(() => {
        if (!logs?.length) {
            setWeeklyData([]);
            setMonthlyData([]);
            setYearlyData([]);
            return;
        }

        const days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const wc = {};
        const mc = {};
        const yc = {};
        months.forEach((m) => (mc[m] = 0));

        logs.forEach((log) => {
            if (!log.collected_at) return;
            const d   = new Date(log.collected_at);
            const day = days[d.getDay()];
            const mo  = months[d.getMonth()];
            const yr  = d.getFullYear();
            wc[day] = (wc[day] || 0) + 1;
            mc[mo]++;
            yc[yr] = (yc[yr] || 0) + 1;
        });

        setWeeklyData(days.map((d)    => ({ label: d,         total: wc[d] || 0 })));
        setMonthlyData(months.map((m) => ({ label: m,         total: mc[m]      })));
        setYearlyData(
            Object.keys(yc).map(Number).sort((a, b) => a - b).map((y) => ({ label: String(y), total: yc[y] }))
        );
    }, [logs]);

    /* ── Chart datasets ── */
    const rewardsChartData = useMemo(() => ({
        labels: topRewards.map((r) => r.reward?.name || "Unknown"),
        datasets: [{
            label: "Redemptions",
            data:  topRewards.map((r) => r.total),
            backgroundColor: topRewards.map((_, i) =>
                i === 0 ? "#1B1F5E" : `rgba(27,31,94,${0.55 - i * 0.08})`
            ),
            borderRadius:  6,
            borderSkipped: false,
        }],
    }), [topRewards]);

    const activityChartData = useMemo(() => ({
        labels: activity.map((a) => a.date),
        datasets: [{
            label:           "Redemptions",
            data:            activity.map((a) => a.total),
            borderColor:     "#2563EB",
            backgroundColor: (ctx) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
                g.addColorStop(0, "rgba(37,99,235,0.18)");
                g.addColorStop(1, "rgba(37,99,235,0)");
                return g;
            },
            tension:              0.45,
            fill:                 true,
            pointBackgroundColor: "#2563EB",
            pointRadius:          3,
            pointHoverRadius:     5,
        }],
    }), [activity]);

    const wasteChartData = useMemo(() => {
        const raw = wasteView === "Weekly"
            ? weeklyData
            : wasteView === "Monthly" ? monthlyData : yearlyData;
        return {
            labels: raw.map((d) => d.label),
            datasets: [{
                label:           "Bins Collected",
                data:            raw.map((d) => d.total),
                borderColor:     "#1B1F5E",
                backgroundColor: (ctx) => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                    g.addColorStop(0, "rgba(27,31,94,0.15)");
                    g.addColorStop(1, "rgba(27,31,94,0)");
                    return g;
                },
                tension:              0.4,
                fill:                 true,
                pointBackgroundColor: "#1B1F5E",
                pointRadius:          3,
                pointHoverRadius:     6,
            }],
        };
    }, [wasteView, weeklyData, monthlyData, yearlyData]);

    const recent = useMemo(() => (redemptions?.data ?? []).slice(0, 8), [redemptions]);

    const binCounts = useMemo(() => ({
        full:   bins.filter((b) => b.fill_percentage > 70).length,
        medium: bins.filter((b) => b.fill_percentage > 30 && b.fill_percentage <= 70).length,
        normal: bins.filter((b) => b.fill_percentage <= 30).length,
    }), [bins]);

    /* ─────────────────────────────────────────────────── */

    return (
        <>
            <Head title="Admin Dashboard" />

            <style>{`
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                .fade-up   { animation: fadeUp 0.4s ease both; }
                .fade-up-1 { animation-delay: 0.05s; }
                .fade-up-2 { animation-delay: 0.10s; }
                .fade-up-3 { animation-delay: 0.15s; }
                .fade-up-4 { animation-delay: 0.20s; }
            `}</style>

            <AdminLayout>
                <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8
                    space-y-4 sm:space-y-6 overflow-x-hidden">

                    {/* ── PAGE HEADER ── */}
                    <div className="flex items-center justify-between gap-2 fade-up">
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-bold text-[#1B1F5E] tracking-tight truncate">
                                Overview
                            </h1>
                            <p className="text-[10px] sm:text-sm text-slate-400 mt-0.5">
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <ArduinoPill status={arduinoStatus} />
                            <button
                                onClick={pollBins}
                                className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border
                                    border-slate-200 bg-white text-slate-500 hover:bg-slate-50
                                    active:scale-95 transition-all whitespace-nowrap"
                            >
                                ↻ Refresh
                            </button>
                        </div>
                    </div>

                    {/* ── SUMMARY CARDS ──
                         2 cols on mobile, 3 on sm, 5 on xl
                    ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4 fade-up fade-up-1">
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
                            title="Redeemed"
                            value={totalRedemptions}
                            accent
                            loading={loading}
                            onClick={() => router.visit(route("admin.redemptions.index"))}
                        />
                        {/* ── REPLACED: TopRedeemerCard now shows student info ── */}
                        <TopRedeemerCard topUser={topUser} loading={loading} />
                    </div>

                    {/* ── CHARTS: mobile tabbed, desktop side-by-side ── */}
                    <div className="sm:hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4 fade-up fade-up-2">
                        <ChartTab
                            options={["Rewards", "Activity"]}
                            value={mobileChart}
                            onChange={setMobileChart}
                        />
                        <div className="h-44">
                            {mobileChart === "Rewards"
                                ? topRewards.length ? <Bar  data={rewardsChartData}  options={baseChartOpts} /> : <EmptyState />
                                : activity.length   ? <Line data={activityChartData} options={baseChartOpts} /> : <EmptyState />
                            }
                        </div>
                    </div>

                    <div className="hidden sm:grid sm:grid-cols-2 gap-4 sm:gap-6 fade-up fade-up-2">
                        <ChartCard title="Most Redeemed Rewards" loading={loading}>
                            <div className="h-56 sm:h-64">
                                {topRewards.length
                                    ? <Bar data={rewardsChartData} options={baseChartOpts} />
                                    : <EmptyState />}
                            </div>
                        </ChartCard>
                        <ChartCard title="Redemption Activity" loading={loading}>
                            <div className="h-56 sm:h-64">
                                {activity.length
                                    ? <Line data={activityChartData} options={baseChartOpts} />
                                    : <EmptyState />}
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
                        <div className="h-44 sm:h-64 fade-up fade-up-3">
                            {(wasteView === "Weekly" ? weeklyData : wasteView === "Monthly" ? monthlyData : yearlyData).length
                                ? <Line data={wasteChartData} options={baseChartOpts} />
                                : <EmptyState message="No collection data yet" />
                            }
                        </div>
                    </ChartCard>

                    {/* ── BIN STATUS + RECENT REDEMPTIONS ── */}
                    <div className="fade-up fade-up-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* ── LIVE BIN STATUS ── */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Live Bin Status
                                    </h2>
                                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                                        <span className="flex items-center gap-1 text-red-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                            {binCounts.full}
                                        </span>
                                        <span className="flex items-center gap-1 text-amber-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                            {binCounts.medium}
                                        </span>
                                        <span className="flex items-center gap-1 text-emerald-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                            {binCounts.normal}
                                        </span>
                                    </div>
                                </div>

                                {bins.length === 0 ? (
                                    <EmptyState message="No bin data available" />
                                ) : (
                                    <div className="space-y-2">
                                        {bins.map((bin, i) => (
                                            <LiveBinCard key={bin.id ?? i} bin={bin} index={i} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── RECENT REDEMPTIONS ── */}
                            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Recent Redemptions
                                    </h2>
                                    <button
                                        onClick={() => router.visit(route("admin.redemptions.index"))}
                                        className="text-[10px] sm:text-xs font-semibold text-[#1B1F5E]
                                            hover:text-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                                    >
                                        View All
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="space-y-2">
                                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
                                    </div>
                                ) : recent.length === 0 ? (
                                    <EmptyState message="No redemptions yet" />
                                ) : (
                                    <>
                                        {/* Desktop table */}
                                        <div className="hidden sm:block overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                        <th className="pb-2 text-left font-semibold">TXN ID</th>
                                                        <th className="pb-2 text-left font-semibold">User</th>
                                                        <th className="pb-2 text-left font-semibold">Reward</th>
                                                        <th className="pb-2 text-right font-semibold">Points</th>
                                                        <th className="pb-2 text-right font-semibold">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {recent.map((r) => (
                                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-2.5 pr-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                                                {formatTxnId(r.id, r.created_at)}
                                                            </td>
                                                            <td className="py-2.5 pr-3 font-medium text-slate-700 max-w-[100px] truncate text-xs">
                                                                {r.user?.name ?? "—"}
                                                            </td>
                                                            <td className="py-2.5 pr-3 text-slate-600 max-w-[100px] truncate text-xs">
                                                                {r.reward?.name ?? "—"}
                                                            </td>
                                                            <td className="py-2.5 pr-3 text-right font-semibold text-[#1B1F5E] tabular-nums text-xs whitespace-nowrap">
                                                                {(r.points_used ?? 0).toLocaleString()}
                                                            </td>
                                                            <td className="py-2.5 text-right text-[10px] text-slate-400 whitespace-nowrap">
                                                                {new Date(r.created_at).toLocaleString("en-US", {
                                                                    month: "short", day: "numeric",
                                                                    hour: "2-digit", minute: "2-digit",
                                                                })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile card list */}
                                        <div className="sm:hidden space-y-2">
                                            {recent.map((r) => (
                                                <div key={r.id}
                                                    className="rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-xs text-slate-800 truncate">
                                                                {r.user?.name ?? "—"}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                                                {formatTxnId(r.id, r.created_at)}
                                                            </p>
                                                        </div>
                                                        <span className="font-semibold text-xs text-[#1B1F5E] whitespace-nowrap shrink-0">
                                                            {(r.points_used ?? 0).toLocaleString()} pts
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                        <span className="truncate mr-2">{r.reward?.name ?? "—"}</span>
                                                        <span className="text-slate-400 whitespace-nowrap shrink-0">
                                                            {new Date(r.created_at).toLocaleDateString("en-US", {
                                                                month: "short", day: "numeric",
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

                    <div className="h-2 sm:h-4" />
                </div>
            </AdminLayout>
        </>
    );
}
