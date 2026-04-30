import { Head, usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import StaffLayout from "@/Layouts/StaffLayout";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid,
    ResponsiveContainer, Legend,
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

const BIN_DEPTH_CM    = 30;
const ALERT_THRESHOLD = 80;
const WARN_THRESHOLD  = 50;
const POLL_MS         = 8000;
const ALERT_POLL_MS   = 10000;

const BIN_COLORS = {
    metallic: "#f59e0b",
    wet:      "#22c55e",
    dry:      "#3b82f6",
};

/**
 * Initial per-bin state shape.
 *
 * binStates is the SINGLE SOURCE OF TRUTH for what each bin's UI shows.
 * It is updated from the `bins` field that /api/bins/latest now returns.
 *
 * Possible state values (mirror backend BinLevel::binState):
 *   "normal"     – sensor data is valid; show real percentage
 *   "collecting" – staff just confirmed; suppress sensor, show "Collecting…"
 *   "cooldown"   – short window after collecting; show "Just Collected"
 */
const INITIAL_BIN_STATES = {
    metallic: { state: "normal", collected_at: null },
    wet:      { state: "normal", collected_at: null },
    dry:      { state: "normal", collected_at: null },
};

const INITIAL_BINS = [
    { id: "metallic", name: "Metallic Bin", location: "CCIS", level: 0 },
    { id: "wet",      name: "Wet Bin",      location: "CCIS", level: 0 },
    { id: "dry",      name: "Dry Bin",      location: "CCIS", level: 0 },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */

const getColor = (level) => {
    if (level >= ALERT_THRESHOLD) return "#ef4444";
    if (level >= WARN_THRESHOLD)  return "#f59e0b";
    return "#22c55e";
};

const getStatus = (level) => {
    if (level >= ALERT_THRESHOLD) return {
        text: "Needs Collection", short: "Critical",
        cls: "text-red-500", bg: "bg-red-50",
        border: "border-red-300", ring: "ring-red-200",
        severity: "critical",
    };
    if (level >= WARN_THRESHOLD) return {
        text: "Almost Full", short: "Warning",
        cls: "text-amber-500", bg: "bg-amber-50",
        border: "border-amber-300", ring: "ring-amber-200",
        severity: "warning",
    };
    return {
        text: "Normal", short: "Normal",
        cls: "text-green-600", bg: "bg-green-50",
        border: "border-green-200", ring: "ring-green-200",
        severity: "normal",
    };
};

const pctToDistance = (pct) => Math.round(BIN_DEPTH_CM - (pct / 100) * BIN_DEPTH_CM);

const timeAgo = (isoStr) => {
    if (!isoStr) return "Never";
    const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
    if (diff < 10)   return "just now";
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
};

const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") ?? "";

const playAlertSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [880, 660, 880].forEach((freq, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.15);
            osc.start(ctx.currentTime + i * 0.18);
            osc.stop(ctx.currentTime + i * 0.18 + 0.15);
        });
    } catch (_) {}
};

/**
 * Derive what the UI should show for a single bin given:
 *   - binState  : "normal" | "collecting" | "cooldown"
 *   - sensorLevel : raw % from the sensor
 *
 * Returns { displayLevel, label, isOverridden }
 *
 * isOverridden = true means the sensor value is being suppressed.
 */
const deriveBinDisplay = (binState, sensorLevel) => {
    if (binState === "collecting") {
        return { displayLevel: 0, label: "Collecting…", isOverridden: true };
    }
    if (binState === "cooldown") {
        return { displayLevel: 0, label: "Just Collected", isOverridden: true };
    }
    return { displayLevel: sensorLevel, label: null, isOverridden: false };
};

/* ═══════════════════════════════════════════════════════════
   CIRCULAR GAUGE
═══════════════════════════════════════════════════════════ */

function CircularGauge({ level, size = 104, overrideLabel }) {
    const stroke = 9;
    const r      = size / 2 - stroke;
    const circ   = 2 * Math.PI * r;
    const fill   = (level / 100) * circ;
    const color  = getColor(level);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            <circle
                cx={size/2} cy={size/2} r={r}
                fill="none" stroke={overrideLabel ? "#94a3b8" : color} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${fill} ${circ}`}
                strokeDashoffset={circ / 4}
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)" }}
            />
            {overrideLabel ? (
                <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
                    fontSize="10" fontWeight="700" fill="#94a3b8">{overrideLabel}</text>
            ) : (
                <>
                    <text x={size/2} y={size/2 - 5} textAnchor="middle" dominantBaseline="middle"
                        fontSize="20" fontWeight="800" fill={color}>{level}</text>
                    <text x={size/2} y={size/2 + 14} textAnchor="middle"
                        fontSize="11" fill="#9ca3af" fontWeight="500">%</text>
                </>
            )}
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════
   SPARKLINE
═══════════════════════════════════════════════════════════ */

function Sparkline({ data, color, width = 180, height = 36 }) {
    if (!data || data.length < 2) return (
        <div className="text-[10px] text-slate-300 italic">Waiting for data…</div>
    );
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / 100) * height;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} opacity="0.1" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════════════════════ */

function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    className={`
                        pointer-events-auto flex items-start gap-3 px-4 py-3
                        rounded-2xl shadow-xl border cursor-pointer transition-all duration-300
                        ${t.severity === "critical"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"}
                    `}
                    style={{ animation: "slideInRight 0.3s ease both", maxWidth: "320px" }}
                >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                        {t.severity === "critical" ? "🚨" : "⚠️"}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{t.title}</p>
                        <p className="text-xs opacity-75 mt-0.5">{t.message}</p>
                    </div>
                    <button className="text-xs opacity-50 hover:opacity-100 flex-shrink-0">✕</button>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MODAL (base)
═══════════════════════════════════════════════════════════ */

function Modal({ isOpen, onClose, title, children, size = "md" }) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ animation: "fadeIn 0.2s ease both" }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <div
                className={`relative bg-white w-full ${sizes[size]} rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 z-10`}
                style={{ animation: "slideUpModal 0.28s cubic-bezier(0.32,0.72,0,1) both" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95
                            flex items-center justify-center text-slate-400 text-sm transition-all"
                    >✕</button>
                </div>
                {children}
            </div>
            <style>{`
                @keyframes fadeIn        { from{opacity:0}                     to{opacity:1} }
                @keyframes slideUpModal  { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
                @keyframes scaleIn       { from{transform:scale(0.92);opacity:0}      to{transform:scale(1);opacity:1} }
                @keyframes slideInRight  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
                @keyframes fadeUpIn      { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse-ring    { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   COLLECT CONFIRMATION MODAL
═══════════════════════════════════════════════════════════ */

function CollectModal({ bin, binState, isOpen, onClose, onConfirm, collecting }) {
    if (!bin) return null;

    // Use sensor level for display (not overridden value) so staff see the real fill
    const color  = getColor(bin.level);
    const status = getStatus(bin.level);
    const alreadyInCooldown = binState !== "normal";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Collection" size="sm">
            {alreadyInCooldown ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 text-center">
                    <p className="text-sm font-bold text-blue-700 mb-1">Cooldown Active</p>
                    <p className="text-xs text-blue-500">
                        This bin was recently collected. Please wait for the cooldown to finish.
                    </p>
                </div>
            ) : (
                <>
                    <div className={`rounded-2xl p-4 mb-5 ${status.bg} border ${status.border}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-slate-800">{bin.name}</p>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.cls}`}>
                                {status.short}
                            </span>
                        </div>
                        <div className="h-2.5 bg-white/70 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${bin.level}%`, background: color }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>{bin.location}</span>
                            <span className="font-bold" style={{ color }}>{bin.level}% full</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">
                        This will mark the <strong className="text-slate-700">{bin.name}</strong> as collected,
                        reset its display to 0%, and log a collection event. Sensor data for this bin will be
                        suppressed for 60 seconds while you complete the collection.
                    </p>
                </>
            )}
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200
                        text-slate-500 hover:bg-slate-50 active:scale-[0.97] transition-all"
                >Cancel</button>
                {!alreadyInCooldown && (
                    <button
                        onClick={onConfirm}
                        disabled={collecting}
                        className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all
                            active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait
                            bg-green-600 hover:bg-green-700"
                    >
                        {collecting ? "Collecting…" : "Confirm Collection"}
                    </button>
                )}
            </div>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════
   SUCCESS MODAL
═══════════════════════════════════════════════════════════ */

function SuccessModal({ isOpen, onClose, binName }) {
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(onClose, 3000);
            return () => clearTimeout(t);
        }
    }, [isOpen, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div
                    className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200
                        flex items-center justify-center text-3xl"
                    style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >✓</div>
                <div>
                    <p className="text-lg font-extrabold text-slate-800">Collection Logged!</p>
                    <p className="text-sm text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{binName}</span> is now in
                        collection mode. Sensor data will resume once the cooldown ends.
                    </p>
                </div>
                <p className="text-[11px] text-slate-400">This window will close automatically.</p>
            </div>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════
   ALERT DETAIL MODAL
═══════════════════════════════════════════════════════════ */

function AlertModal({ alert, isOpen, onClose, onResolve, resolving }) {
    if (!alert) return null;
    const isCritical = alert.severity === "critical";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Alert Details" size="sm">
            <div className={`rounded-2xl p-4 mb-5 border ${isCritical ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{isCritical ? "🚨" : "⚠️"}</span>
                    <div>
                        <p className={`font-bold text-sm ${isCritical ? "text-red-800" : "text-amber-800"}`}>
                            {alert.bin_type?.charAt(0).toUpperCase() + alert.bin_type?.slice(1)} Bin —{" "}
                            <span className="uppercase text-xs">{alert.severity}</span>
                        </p>
                        <p className={`text-xs mt-0.5 ${isCritical ? "text-red-600" : "text-amber-600"}`}>
                            Level at alert: {alert.level_at_alert}% · {timeAgo(alert.created_at)}
                        </p>
                    </div>
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-5">
                Resolving this alert marks the issue as addressed. The bin will still need physical
                collection if it remains full.
            </p>
            <div className="flex gap-3">
                <button onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200
                        text-slate-500 hover:bg-slate-50 active:scale-[0.97] transition-all"
                >Dismiss</button>
                <button onClick={onResolve} disabled={resolving}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all
                        active:scale-[0.97] disabled:opacity-60 bg-blue-600 hover:bg-blue-700"
                >
                    {resolving ? "Resolving…" : "Mark Resolved"}
                </button>
            </div>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════
   ALERT BANNER
═══════════════════════════════════════════════════════════ */

function AlertBanner({ alerts, onAlertClick }) {
    if (!alerts.length) return null;
    const critical = alerts.filter((a) => a.severity === "critical");
    const warnings = alerts.filter((a) => a.severity === "warning");

    return (
        <div className="space-y-2" style={{ animation: "fadeUpIn 0.3s ease both" }}>
            {critical.length > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                    <span className="text-xl mt-0.5 flex-shrink-0">🚨</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-700">
                            {critical.length} bin{critical.length > 1 ? "s" : ""} require immediate collection
                        </p>
                        <p className="text-xs text-red-500 mt-0.5 flex flex-wrap gap-1.5">
                            {critical.map((a) => (
                                <button key={a.id} onClick={() => onAlertClick(a)}
                                    className="underline underline-offset-2 hover:text-red-700 font-semibold">
                                    {a.bin_type} ({a.level_at_alert}%)
                                </button>
                            ))}
                        </p>
                    </div>
                </div>
            )}
            {warnings.length > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <span className="text-xl mt-0.5 flex-shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-700">
                            {warnings.length} bin{warnings.length > 1 ? "s are" : " is"} filling up
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5 flex flex-wrap gap-1.5">
                            {warnings.map((a) => (
                                <button key={a.id} onClick={() => onAlertClick(a)}
                                    className="underline underline-offset-2 hover:text-amber-800 font-semibold">
                                    {a.bin_type} ({a.level_at_alert}%)
                                </button>
                            ))}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ARDUINO STATUS PILL
═══════════════════════════════════════════════════════════ */

function ArduinoPill({ status }) {
    const map = {
        online:  { dot: "bg-green-400", ring: true,  pill: "bg-green-50 text-green-700 border-green-200", label: "Arduino Online"  },
        offline: { dot: "bg-red-400",   ring: false, pill: "bg-red-50 text-red-700 border-red-200",       label: "Arduino Offline" },
    };
    const s = map[status] ?? map.offline;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${s.pill}`}>
            <span className="relative flex h-2 w-2">
                {s.ring && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
            </span>
            {s.label}
        </span>
    );
}

/* ═══════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════ */

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className={`text-3xl font-extrabold tracking-tight ${accent ?? "text-[#1B1F5E]"}`}>{value}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM CHART TOOLTIP
═══════════════════════════════════════════════════════════ */

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1B1F5E] text-white text-xs rounded-xl px-3 py-2.5 shadow-xl">
            <p className="font-bold mb-1.5 text-white/70">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color ?? p.stroke }} />
                    {p.name ?? p.dataKey}: <span className="font-bold ml-1">{p.value}</span>
                </p>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   BIN CARD — per-bin state aware
═══════════════════════════════════════════════════════════ */

function BinCard({ bin, binState, onCollect, sparkData, hasAlert, alertSeverity }) {
    /**
     * Derive display values from the bin's current state.
     *
     * binState is one of: "normal" | "collecting" | "cooldown"
     *
     * When in collecting/cooldown the sensor % is suppressed — the card
     * shows an override label and a greyed-out gauge instead.
     */
    const { displayLevel, label: overrideLabel, isOverridden } = deriveBinDisplay(binState, bin.level);

    const status     = getStatus(displayLevel);
    const color      = getColor(displayLevel);
    const isCritical = !isOverridden && displayLevel >= ALERT_THRESHOLD;
    const isWarning  = !isOverridden && displayLevel >= WARN_THRESHOLD && displayLevel < ALERT_THRESHOLD;

    // Button is disabled while this specific bin is in any non-normal state
    const isDisabled = isOverridden || displayLevel === 0;

    const buttonLabel = () => {
        if (binState === "collecting") return "⟳ Collecting…";
        if (binState === "cooldown")   return "✓ Just Collected";
        if (displayLevel === 0)        return "Already Empty";
        if (isCritical)                return "⚠ Collect Now — Urgent";
        return "Mark as Collected";
    };

    const statusBadgeLabel = () => {
        if (binState === "collecting") return "Collecting";
        if (binState === "cooldown")   return "Cooldown";
        return status.text;
    };

    const statusBadgeCls = () => {
        if (isOverridden) return "bg-blue-50 text-blue-600";
        return `${status.bg} ${status.cls}`;
    };

    return (
        <div
            className={`
                relative bg-white rounded-2xl border flex flex-col gap-3 p-5
                transition-all duration-300
                ${isCritical
                    ? "border-red-300 ring-2 ring-red-100 shadow-red-50 shadow-md"
                    : isWarning
                        ? "border-amber-300 ring-2 ring-amber-100"
                        : isOverridden
                            ? "border-blue-200 ring-2 ring-blue-50"
                            : "border-slate-200"
                }
            `}
            style={{ animation: "fadeUpIn 0.4s ease both" }}
        >
            {/* Status badge + live pulse */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {hasAlert && !isOverridden && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${alertSeverity === "critical" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                        {alertSeverity === "critical" ? "CRITICAL" : "WARNING"}
                    </span>
                )}
                {isOverridden && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                        {binState === "collecting" ? "COLLECTING" : "COOLDOWN"}
                    </span>
                )}
                <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                        ${isCritical ? "bg-red-400" : isOverridden ? "bg-blue-400" : "bg-green-400"}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2
                        ${isCritical ? "bg-red-500" : isOverridden ? "bg-blue-500" : "bg-green-500"}`} />
                </span>
            </div>

            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pr-20">{bin.name}</p>

            <div className="flex justify-center">
                <CircularGauge level={displayLevel} overrideLabel={overrideLabel} />
            </div>

            <div className="flex justify-center">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusBadgeCls()}`}>
                    {statusBadgeLabel()}
                </span>
            </div>

            <div className="text-center space-y-0.5">
                <p className="text-[10px] text-slate-400">{bin.location}</p>
                {!isOverridden && (
                    <p className="text-[10px] text-slate-300">{pctToDistance(displayLevel)} cm from sensor</p>
                )}
                {isOverridden && (
                    <p className="text-[10px] text-blue-400 font-medium">Sensor data suppressed</p>
                )}
            </div>

            {/* Only show sparkline when not suppressed */}
            {!isOverridden && sparkData.length >= 2 && (
                <div className="px-1">
                    <Sparkline data={sparkData} color={BIN_COLORS[bin.id]} width={160} height={30} />
                </div>
            )}

            {/* Collecting/cooldown progress indicator */}
            {isOverridden && (
                <div className="px-1">
                    <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{
                                width: binState === "collecting" ? "40%" : "80%",
                                transition: "width 1s ease",
                            }}
                        />
                    </div>
                    <p className="text-[9px] text-blue-400 text-center mt-1">
                        {binState === "collecting" ? "Collection in progress…" : "Almost done, resuming soon…"}
                    </p>
                </div>
            )}

            <div className="border-t border-slate-100 pt-2">
                <p className="text-[10px] text-slate-400 text-center">
                    Last collected:{" "}
                    <span className="font-semibold text-slate-500">
                        {timeAgo(bin.lastCollected)}
                    </span>
                </p>
            </div>

            <button
                onClick={() => onCollect(bin)}
                disabled={isDisabled}
                className={`
                    w-full py-2.5 rounded-xl font-bold text-sm
                    transition-all duration-150 active:scale-[0.97]
                    ${isDisabled
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isCritical
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                            : isWarning
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                                : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    }
                `}
            >
                {buttonLabel()}
            </button>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════ */

export default function StaffDashboard() {
    const { auth, logs = [] } = usePage().props;
    const user = auth.user;

    /* ── Core state ── */
    const [bins,          setBins]          = useState(INITIAL_BINS);
    const [binStates,     setBinStates]     = useState(INITIAL_BIN_STATES);
    const [arduinoStatus, setArduinoStatus] = useState("offline");
    const [lastPing,      setLastPing]      = useState(null);
    const [sensorHistory, setSensorHistory] = useState([]);
    const [trendData,     setTrendData]     = useState([]);
    const [monthlyData,   setMonthlyData]   = useState([]);

    /* ── Alert state ── */
    const [alerts,      setAlerts]      = useState([]);
    const [knownAlerts, setKnownAlerts] = useState(new Set());
    const [toasts,      setToasts]      = useState([]);
    const toastId = useRef(0);

    /* ── Modal state ── */
    const [collectTarget,  setCollectTarget]  = useState(null);
    const [collectOpen,    setCollectOpen]    = useState(false);
    const [collecting,     setCollecting]     = useState(false);
    const [successOpen,    setSuccessOpen]    = useState(false);
    const [successBinName, setSuccessBinName] = useState("");
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertTarget,    setAlertTarget]    = useState(null);
    const [resolving,      setResolving]      = useState(false);

    const pollRef      = useRef(null);
    const alertPollRef = useRef(null);

    /* ── Chart data ── */
    useEffect(() => {
        const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        const counts = {};
        logs.forEach((log) => {
            const day = days[new Date(log.collected_at).getDay()];
            counts[day] = (counts[day] || 0) + 1;
        });
        setTrendData(days.map((d) => ({ day: d, collections: counts[d] || 0 })));

        const mc = {};
        months.forEach((m) => { mc[m] = { month: m, wet: 0, dry: 0, metallic: 0 }; });
        logs.forEach((log) => {
            const m = months[new Date(log.collected_at).getMonth()];
            if (mc[m] && log.bin_type) mc[m][log.bin_type]++;
        });
        setMonthlyData(Object.values(mc));
    }, [logs]);

    /* ──────────────────────────────────────────────────────────
       BIN LEVEL POLLING
       ──────────────────────────────────────────────────────────
       The API now returns a `bins` field:
       {
         bins: {
           metallic: { state: "normal"|"collecting"|"cooldown", collected_at: "…" },
           wet:      { … },
           dry:      { … },
         }
       }
       We merge those states into binStates.  When a bin's state is not
       "normal" we leave the sensor level as-is (don't overwrite with 0 from
       the server, which may already be suppressing it).
    ────────────────────────────────────────────────────────── */
    const pollBins = useCallback(async () => {
        try {
            const res = await fetch("/api/bins/latest", {
                headers: { Accept: "application/json" },
                credentials: "include",
            });
            if (!res.ok) throw new Error("non-ok");
            const data = await res.json();

            const isOnline = ["active", "collected", "cooldown"].includes(data.status);
            setArduinoStatus(isOnline ? "online" : "offline");

            // ✅ Merge per-bin states from server
            if (data.bins) {
                setBinStates((prev) => {
                    const next = { ...prev };
                    for (const binId of ["metallic", "wet", "dry"]) {
                        if (data.bins[binId]) {
                            next[binId] = {
                                state:        data.bins[binId].state        ?? "normal",
                                collected_at: data.bins[binId].collected_at ?? prev[binId].collected_at,
                            };
                        }
                    }
                    return next;
                });
            }

            // ✅ Update sensor levels.
            //    For bins in cooldown/collecting, the server already returns 0
            //    (or the last suppressed value) — use what the server sends.
            setBins((prev) => prev.map((b) => ({
                ...b,
                level: data[b.id] ?? b.level,
                lastCollected: data.bins?.[b.id]?.collected_at
                    ? data.bins[b.id].collected_at
                    : b.lastCollected,
            })));

            setSensorHistory((h) => {
                const entry = {
                    ts:       Date.now(),
                    metallic: data.metallic ?? 0,
                    wet:      data.wet      ?? 0,
                    dry:      data.dry      ?? 0,
                };
                const next = [...h, entry];
                return next.length > 120 ? next.slice(-120) : next;
            });

            setLastPing(new Date());
        } catch {
            setArduinoStatus("offline");
        }
    }, []);

    /* ── Alert polling ── */
    const pollAlerts = useCallback(async () => {
        try {
            const res  = await fetch("/api/bins/alerts", {
                headers: { Accept: "application/json" },
                credentials: "include",
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            setAlerts(data);

            data.forEach((alert) => {
                if (!knownAlerts.has(alert.id)) {
                    setKnownAlerts((prev) => new Set([...prev, alert.id]));
                    const id = ++toastId.current;
                    setToasts((prev) => [...prev, {
                        id,
                        severity: alert.severity,
                        title:    `${alert.bin_type?.charAt(0).toUpperCase() + alert.bin_type?.slice(1)} Bin Alert`,
                        message:  `Fill level: ${alert.level_at_alert}% — ${alert.severity === "critical" ? "Immediate collection needed" : "Bin is filling up"}`,
                    }]);
                    playAlertSound();
                    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
                }
            });
        } catch {}
    }, [knownAlerts]);

    useEffect(() => {
        pollBins();
        pollRef.current = setInterval(pollBins, POLL_MS);
        return () => clearInterval(pollRef.current);
    }, [pollBins]);

    useEffect(() => {
        pollAlerts();
        alertPollRef.current = setInterval(pollAlerts, ALERT_POLL_MS);
        return () => clearInterval(alertPollRef.current);
    }, [pollAlerts]);

    /* ──────────────────────────────────────────────────────────
       COLLECT FLOW
       ──────────────────────────────────────────────────────────
       1. Staff clicks "Mark as Collected" on a BinCard
       2. CollectModal opens, showing the bin's real level
       3. Staff clicks "Confirm Collection"
       4. We call POST /api/bins/collect/{binType}
       5. On success:
            a. Immediately set binState[binType] = "collecting"
               so the card flips to "Collecting…" without waiting for
               the next poll
            b. Zero out that bin's level in local state
       6. Subsequent polls will keep returning state = "collecting" / "cooldown"
          from the server until the PER_BIN_COOLDOWN_SECONDS window expires,
          at which point the server returns state = "normal" and the live
          sensor level is restored.
    ────────────────────────────────────────────────────────── */

    const handleCollectClick = useCallback((bin) => {
        // Do not open modal if already in cooldown — button is disabled anyway,
        // but guard here too for safety
        if (binStates[bin.id]?.state !== "normal") return;
        setCollectTarget(bin);
        setCollectOpen(true);
    }, [binStates]);

    const handleCollectConfirm = useCallback(() => {
        if (!collectTarget) return;
        setCollecting(true);

        router.post(route('bins.collect', collectTarget.id), {}, {
            onSuccess: () => {
                const now = new Date().toISOString();

                setBinStates((prev) => ({
                    ...prev,
                    [collectTarget.id]: { state: "collecting", collected_at: now },
                }));

                setBins((prev) =>
                    prev.map((b) =>
                        b.id === collectTarget.id
                            ? { ...b, level: 0, lastCollected: now }
                            : b
                    )
                );

                setCollecting(false);
                setCollectOpen(false);
                setSuccessBinName(collectTarget.name);
                setSuccessOpen(true);
                setCollectTarget(null);
            },

            onError: (err) => {
                console.warn("Collect failed:", err);
                setCollecting(false);
                setCollectOpen(false);
            },
        });
    }, [collectTarget]);

    /* ── Alert resolution ── */
    const handleAlertClick = useCallback((alert) => {
        setAlertTarget(alert);
        setAlertModalOpen(true);
    }, []);

    const handleResolveAlert = useCallback(async () => {
        if (!alertTarget) return;
        setResolving(true);

        try {
            const res = await fetch(`/api/bins/alerts/${alertTarget.id}/resolve`, {
                method:      "POST",
                credentials: "include",
                headers: {
                    "Accept":       "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
            });

            if (res.ok) {
                setAlerts((prev) => prev.filter((a) => a.id !== alertTarget.id));
            }
        } catch (err) {
            console.error("Resolve alert failed:", err);
        } finally {
            setResolving(false);
            setAlertModalOpen(false);
            setAlertTarget(null);
        }
    }, [alertTarget]);

    /* ── Derived stats ── */
    const criticalBins = bins.filter((b) => {
        // Only count bins whose state is normal and level is critical
        const state = binStates[b.id]?.state ?? "normal";
        return state === "normal" && b.level >= ALERT_THRESHOLD;
    }).length;

    const avgLevel = Math.round(
        bins.reduce((acc, b) => {
            const state = binStates[b.id]?.state ?? "normal";
            return acc + (state === "normal" ? b.level : 0);
        }, 0) / bins.length
    );

    const sparkFor    = (id) => sensorHistory.slice(-14).map((d) => d[id] ?? 0);
    const alertForBin = (id) => alerts.find((a) => a.bin_type === id);

    /* ── Global cooldown flag for the banner ── */
    const globalCooldown = Object.values(binStates).some((s) => s.state !== "normal");

    return (
        <>
            <Head title="Staff Dashboard" />

            <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

            <CollectModal
                bin={collectTarget}
                binState={collectTarget ? (binStates[collectTarget.id]?.state ?? "normal") : "normal"}
                isOpen={collectOpen}
                onClose={() => { setCollectOpen(false); setCollectTarget(null); }}
                onConfirm={handleCollectConfirm}
                collecting={collecting}
            />

            <SuccessModal
                isOpen={successOpen}
                onClose={() => setSuccessOpen(false)}
                binName={successBinName}
            />

            <AlertModal
                alert={alertTarget}
                isOpen={alertModalOpen}
                onClose={() => { setAlertModalOpen(false); setAlertTarget(null); }}
                onResolve={handleResolveAlert}
                resolving={resolving}
            />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">

                {/* ── Page header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Smart Waste Monitoring
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">Welcome back, {user.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <ArduinoPill status={arduinoStatus} />
                        <button
                            onClick={() => { pollBins(); pollAlerts(); }}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-full border
                                border-slate-200 bg-white text-slate-500 hover:bg-slate-50
                                active:scale-95 transition-all"
                        >↻ Refresh</button>
                        {lastPing && (
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                                Last ping: {timeAgo(lastPing.toISOString())}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Per-bin cooldown banner ── */}
                {globalCooldown && (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4"
                        style={{ animation: "fadeUpIn 0.3s ease both" }}>
                        <span className="text-xl">🕐</span>
                        <div>
                            <p className="text-sm font-bold text-blue-700">Collection In Progress</p>
                            <p className="text-xs text-blue-500 mt-0.5">
                                {Object.entries(binStates)
                                    .filter(([, s]) => s.state !== "normal")
                                    .map(([id]) => id.charAt(0).toUpperCase() + id.slice(1))
                                    .join(", ")}
                                {" "}bin{Object.values(binStates).filter((s) => s.state !== "normal").length > 1 ? "s are" : " is"} in
                                cooldown — sensor data suppressed temporarily.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Alert banners ── */}
                <AlertBanner alerts={alerts} onAlertClick={handleAlertClick} />

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard label="Total Bins"       value={bins.length}   sub="CCIS monitored" />
                    <StatCard
                        label="Needs Collection"
                        value={criticalBins}
                        sub={criticalBins > 0 ? "Bins at ≥80%" : "All bins clear"}
                        accent={criticalBins > 0 ? "text-red-500" : undefined}
                    />
                    <StatCard
                        label="Avg Fill Level"
                        value={`${avgLevel}%`}
                        sub={lastPing ? `Updated ${timeAgo(lastPing.toISOString())}` : "Waiting for Arduino…"}
                    />
                    <StatCard
                        label="Active Alerts"
                        value={alerts.length}
                        sub={alerts.length > 0 ? "Click banner to resolve" : "No active alerts"}
                        accent={alerts.length > 0 ? "text-red-500" : "text-green-600"}
                    />
                </div>

                {/* ── Bin Cards ── */}
                <div>
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-3">
                        Bin Status — Live Sensor Readings
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {bins.map((bin) => {
                            const alert    = alertForBin(bin.id);
                            const binState = binStates[bin.id]?.state ?? "normal";
                            return (
                                <BinCard
                                    key={bin.id}
                                    bin={bin}
                                    binState={binState}
                                    onCollect={handleCollectClick}
                                    sparkData={sparkFor(bin.id)}
                                    hasAlert={!!alert}
                                    alertSeverity={alert?.severity}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* ── Sparkline panel ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Fill Trend — Last 14 readings
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {bins.map((bin) => {
                            const binState = binStates[bin.id]?.state ?? "normal";
                            return (
                                <div key={bin.id} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-500">{bin.name}</p>
                                        <p className="text-xs font-bold" style={{ color: binState === "normal" ? getColor(bin.level) : "#94a3b8" }}>
                                            {binState === "normal" ? `${bin.level}%` : binState === "collecting" ? "Collecting…" : "Just Collected"}
                                        </p>
                                    </div>
                                    {binState === "normal" ? (
                                        <Sparkline data={sparkFor(bin.id)} color={BIN_COLORS[bin.id]} width={200} height={44} />
                                    ) : (
                                        <div className="h-[44px] flex items-center justify-center">
                                            <p className="text-[10px] text-blue-400 italic">Suppressed during collection</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Weekly Trend ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-700 mb-4">Collection Trend (Weekly)</h2>
                    <div className="h-52 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="collections" name="Collections"
                                    stroke="#1B1F5E" strokeWidth={2.5}
                                    dot={{ r: 3.5, fill: "#1B1F5E", strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: "#1B1F5E" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Monthly by Type ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-700 mb-4">Monthly Collection by Type</h2>
                    <div className="h-52 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconSize={10} />
                                <Bar dataKey="wet"      stackId="a" fill="#22c55e" name="Wet"      radius={[0,0,0,0]} />
                                <Bar dataKey="dry"      stackId="a" fill="#3b82f6" name="Dry"      radius={[0,0,0,0]} />
                                <Bar dataKey="metallic" stackId="a" fill="#f59e0b" name="Metallic" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Recent Collection Logs ── */}
                {logs.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Recent Collections
                            </p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {logs.slice(0, 5).map((log) => (
                                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                                        🗑️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {log.bin ?? "Bin"} — {log.location ?? "Unknown"}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {log.staff?.name ?? "Staff"} ·{" "}
                                            {new Date(log.collected_at ?? log.created_at).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        Collected
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}

StaffDashboard.layout = (page) => <StaffLayout>{page}</StaffLayout>;
