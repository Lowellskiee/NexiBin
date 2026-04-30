import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

/* ─── HELPERS ─────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDay(scans) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  scans.forEach((s) => {
    const d = new Date(s.created_at); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime())          groups.Today.push(s);
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(s);
    else                                           groups.Earlier.push(s);
  });
  return groups;
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/* ─── TOAST ───────────────────────────────────────────────── */

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  }, []);
  return { toasts, add };
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold text-white pointer-events-auto
            ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ animation: "slideInRight .25s ease" }}
        >
          <span>{t.type === "success" ? "✓" : "✕"}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── PROGRESS BAR ────────────────────────────────────────── */

function ProgressBar({ pct, color = "#16a34a" }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

function progressColor(pct) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 45) return "#d97706";
  return "#dc2626";
}

/* ─── ACHIEVEMENT BADGE ───────────────────────────────────── */

function AchievementPop({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed inset-x-4 bottom-24 z-[150] flex items-center gap-3 bg-[#1B1F5E] text-white px-5 py-4 rounded-2xl shadow-2xl"
      style={{ animation: "slideUp .35s ease" }}
    >
      <span className="text-2xl">🏆</span>
      <div>
        <p className="font-extrabold text-sm">Achievement Unlocked!</p>
        <p className="text-xs text-blue-200 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

/* ─── REWARD CARD ─────────────────────────────────────────── */

function RewardCard({ reward, userPoints }) {
  const canRedeem = userPoints >= reward.points_required && reward.stock > 0;
  const pct = Math.min((userPoints / reward.points_required) * 100, 100);

  return (
    <Link
      href={route("rewards.index")}
      className="flex-shrink-0 w-44 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
    >
      <div className="relative h-24 overflow-hidden">
        <img
          src={reward.image ? `/storage/${reward.image}` : "https://placehold.co/200x100/e2e8f0/94a3b8?text=Reward"}
          alt={reward.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {canRedeem && (
          <div className="absolute top-2 left-2">
            <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">✓ Ready</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-[#1B1F5E] text-xs mb-0.5 truncate">{reward.name}</p>
        <p className="text-[10px] text-slate-400 mb-2">{reward.points_required.toLocaleString()} pts</p>
        <div className="mb-2">
          <ProgressBar pct={pct} color={progressColor(pct)} />
        </div>
        <div className={`w-full text-center py-1.5 rounded-lg text-[10px] font-bold transition-all
          ${canRedeem ? "bg-[#1B1F5E] text-white" : "bg-slate-100 text-slate-400"}`}
        >
          {canRedeem ? "Redeem Now" : "View"}
        </div>
      </div>
    </Link>
  );
}

/* ─── ACTIVITY ITEM ───────────────────────────────────────── */

function ActivityItem({ scan }) {
  const pts  = scan.trash_event?.points ?? 0;
  const name = scan.trash_event?.name   ?? "Points acquired";
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg flex-shrink-0">♻️</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{name}</p>
        <p className="text-[11px] text-slate-400">{timeAgo(scan.created_at)}</p>
      </div>
      <span className="text-emerald-600 font-extrabold text-sm whitespace-nowrap">+{pts} pts</span>
    </div>
  );
}

/* ─── LOGOUT CONFIRMATION MODAL ───────────────────────────── */

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4"
      style={{ animation: "fadeIn .2s ease" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xs p-7 text-center shadow-2xl"
        style={{ animation: "scaleIn .25s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          🚪
        </div>
        <h2 className="font-extrabold text-slate-800 text-xl mb-1">Log Out?</h2>
        <p className="text-slate-400 text-sm mb-6">
          Are you sure you want to log out of your account?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all active:scale-95"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── QR SCANNER MODAL ────────────────────────────────────── */

function ScannerModal({ onClose, onSuccess, onError, apiToken }) {
  const qrRef        = useRef(null);
  const doneRef      = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [localErr,   setLocalErr]   = useState(null);

  useEffect(() => {
    let qr;

    const start = async () => {
      try {
        qr = new Html5Qrcode("qr-reader");
        qrRef.current = qr;
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decoded) => {
            if (doneRef.current || processing) return;
            doneRef.current = true;
            setProcessing(true);
            setLocalErr(null);

            /* ── TOKEN EXTRACTION ── */
            let token = decoded.trim();
            try {
              const url = new URL(decoded);
              const queryToken = url.searchParams.get("token");
              token = queryToken ?? url.pathname.split("/").filter(Boolean).pop() ?? decoded;
            } catch {
              // Not a URL — use raw value as token
            }

            /* ── CLAIM VIA POST /api/trash/claim ── */
            try {
              const res = await axios.post(
                `/api/trash/${token}/claim`,
                { token },
                {
                  withCredentials: true,
                  headers: {
                    Accept: "application/json",
                  },
                }
              );
              const data = res.data;
              await stop();
              onSuccess({
                points: data.points,
                event:  data.type ?? "Points earned",
              });
            } catch (err) {
              const status = err?.response?.status;
              const msg =
                  status === 409 ? "QR code has already been used."
                : status === 410 ? "QR code has expired."
                : status === 404 ? "QR code not recognised."
                :                  "Scan failed. Please try again.";
              setLocalErr(msg);
              setProcessing(false);
              setTimeout(() => { doneRef.current = false; }, 1500);
            }
          },
          () => {}
        );
      } catch {
        setLocalErr("Camera could not start. Please allow camera access.");
      }
    };

    const stop = async () => {
      try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {}
      qrRef.current = null;
    };

    setTimeout(start, 200);
    return () => { stop(); };
  }, []);

  const handleClose = async () => {
    try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {}
    qrRef.current = null;
    onClose();
  };

  const retry = () => {
    setLocalErr(null);
    doneRef.current = false;
    setProcessing(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
      style={{ animation: "fadeIn .2s ease" }}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp .3s ease" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-extrabold text-[#1B1F5E] text-lg">Scan QR Code</h2>
            <p className="text-xs text-slate-400 mt-0.5">Align the code inside the box</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="relative mx-5 mb-2 rounded-2xl overflow-hidden bg-black">
          <div id="qr-reader" className="w-full" />

          {!localErr && !processing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 border-2 border-white/60 rounded-2xl relative">
                <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-blue-400 rounded-tl-xl" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-blue-400 rounded-tr-xl" />
                <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-blue-400 rounded-bl-xl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-blue-400 rounded-br-xl" />
                <div
                  className="absolute left-0 right-0 h-0.5 bg-blue-400/70 top-1/2"
                  style={{ animation: "scanLine 1.8s ease-in-out infinite" }}
                />
              </div>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <svg className="animate-spin w-10 h-10 text-white mb-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                  strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
              <p className="text-white text-sm font-bold">Processing…</p>
            </div>
          )}
        </div>

        {localErr && (
          <div className="mx-5 mb-3 bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-red-600 font-bold text-sm mb-1">⚠️ Scan Failed</p>
            <p className="text-red-500 text-xs mb-3">{localErr}</p>
            <button
              onClick={retry}
              className="px-5 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="px-5 pb-6">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SUCCESS MODAL ───────────────────────────────────────── */

function SuccessModal({ data, onDone }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
      style={{ animation: "fadeIn .2s ease" }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xs p-7 text-center shadow-2xl"
        style={{ animation: "scaleIn .25s ease" }}
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h2 className="font-extrabold text-emerald-600 text-xl mb-1">Scan Successful!</h2>
        <p className="text-slate-500 text-sm mb-2">{data.event}</p>
        <div className="bg-emerald-50 rounded-2xl py-4 px-6 mb-5">
          <p className="text-4xl font-extrabold text-emerald-600">+{data.points}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-1">points earned</p>
        </div>
        <button
          onClick={onDone}
          className="w-full py-3.5 bg-[#1B1F5E] text-white font-bold rounded-xl hover:bg-[#2d3494] transition-all active:scale-[.98]"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ──────────────────────────────────────── */

export default function Dashboard() {
  const { auth, rewards = [], recentScans = [], api_token } = usePage().props;
  const user = auth.user;

  const [points,            setPoints]            = useState(Number(user.points));
  const [showScanner,       setShowScanner]       = useState(false);
  const [scanResult,        setScanResult]        = useState(null);
  const [achievement,       setAchievement]       = useState(null);
  const [scans,             setScans]             = useState(recentScans);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { toasts, add: toast } = useToast();

  /* ── Closest locked reward ── */
  const nextReward = useMemo(() => {
    const locked = rewards.filter((r) => r.points_required > points && r.stock > 0);
    if (!locked.length) return null;
    return locked.reduce((a, b) =>
      (b.points_required - points) < (a.points_required - points) ? b : a
    );
  }, [rewards, points]);

  const nextPct = nextReward
    ? Math.min((points / nextReward.points_required) * 100, 100)
    : 100;

  /* ── Recommended reward ── */
  const recommended = useMemo(() => {
    const redeemable = rewards.filter((r) => points >= r.points_required && r.stock > 0);
    if (redeemable.length) return { reward: redeemable[0], canRedeem: true };
    if (nextReward)        return { reward: nextReward,    canRedeem: false };
    return null;
  }, [rewards, points, nextReward]);

  /* ── Grouped activity ── */
  const grouped = useMemo(() => groupByDay(scans), [scans]);

  /* ── Scan success handler ── */
  const handleScanSuccess = useCallback((data) => {
    setShowScanner(false);
    setScanResult(data);
    const newTotal = points + data.points;
    setPoints(newTotal);
    if (scans.length === 0)
      setAchievement("First Scan! You earned your first points.");
    else if (newTotal >= 100 && points < 100)
      setAchievement("100 Points milestone reached!");
  }, [points, scans]);

  const handleSuccessDone = useCallback(() => {
    setScanResult(null);
    router.reload({ only: ["recentScans"] });
  }, []);

  /* ── Logout ── */
  const handleLogoutClick   = () => setShowLogoutConfirm(true);
  const handleLogoutCancel  = () => setShowLogoutConfirm(false);
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    router.post(route("logout"));
  };

  const previewRewards = rewards.slice(0, 8);

  return (
    <>
      <Head title="Dashboard" />

      <style>{`
        @keyframes fadeIn       { from{opacity:0}                              to{opacity:1} }
        @keyframes slideUp      { from{transform:translateY(40px);opacity:0}  to{transform:translateY(0);opacity:1} }
        @keyframes scaleIn      { from{transform:scale(.9);opacity:0}         to{transform:scale(1);opacity:1} }
        @keyframes slideInRight { from{transform:translateX(30px);opacity:0}  to{transform:translateX(0);opacity:1} }
        @keyframes fadeUpIn     { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine     { 0%,100%{top:10%} 50%{top:85%} }
        .fade-up { animation: fadeUpIn .4s ease both; }
        .s1{animation-delay:.05s} .s2{animation-delay:.1s}  .s3{animation-delay:.15s}
        .s4{animation-delay:.2s}  .s5{animation-delay:.25s} .s6{animation-delay:.3s}
        .snap-x      { scroll-snap-type: x mandatory; }
        .snap-start  { scroll-snap-align: start; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <ToastStack toasts={toasts} />
      {achievement && <AchievementPop text={achievement} onDone={() => setAchievement(null)} />}

      <div className="min-h-screen bg-slate-50 relative isolate">

        {/* ── TOP NAV ── */}
        <div className="bg-[#1B1F5E] pt-safe">
          <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
            <div className="flex items-center justify-between mb-6 fade-up">
              <div>
                <p className="text-blue-300 text-xs font-semibold">{getGreeting()}</p>
                <h1 className="text-white text-xl font-extrabold leading-tight">{user.name}</h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center text-lg transition-all active:scale-95"
                  aria-label="Scan QR Code"
                  title="Scan QR Code"
                >
                  📷
                </button>

                <Link
                  href={route("profile.edit")}
                  className="w-10 h-10 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center font-bold text-white text-sm transition-all active:scale-95"
                  title="Profile"
                >
                  {initials(user.name)}
                </Link>

                <button
                  onClick={handleLogoutClick}
                  className="w-10 h-10 bg-red-500/70 hover:bg-red-500 rounded-xl flex items-center justify-center text-white text-lg transition-all active:scale-95"
                  title="Logout"
                >
                  🚪
                </button>
              </div>
            </div>

            {/* ── POINTS CARD ── */}
            <div className="bg-white/10 rounded-3xl p-5 mb-4 fade-up s1">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Points</p>
              <div className="flex items-end gap-2">
                <p className="text-white text-5xl font-extrabold tabular-nums leading-none">
                  {points.toLocaleString()}
                </p>
                <span className="text-blue-300 font-semibold text-base mb-1">pts</span>
              </div>
              {nextReward && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-blue-200 font-semibold">
                      {(nextReward.points_required - points).toLocaleString()} pts to {nextReward.name}
                    </span>
                    <span className="text-blue-300">{Math.floor(nextPct)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                      style={{ width: `${nextPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="max-w-2xl mx-auto px-4 -mt-4 pb-10 space-y-6">

          <button
            onClick={() => setShowScanner(true)}
            className="fade-up s2 w-full bg-[#1B1F5E] text-white py-4 rounded-2xl font-extrabold text-base
              shadow-lg shadow-[#1B1F5E]/30 hover:bg-[#2d3494] active:scale-[.98] transition-all duration-150
              flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📷</span>
            Scan QR Code to Earn Points
          </button>

          {nextReward && (
            <div className="fade-up s3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Next Reward</p>
              <div className="flex gap-3 items-center">
                <img
                  src={nextReward.image ? `/storage/${nextReward.image}` : "https://placehold.co/64x64/e2e8f0/94a3b8?text=★"}
                  alt={nextReward.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-[#1B1F5E] text-sm truncate">{nextReward.name}</p>
                  <p className="text-xs text-slate-400 mb-2">
                    {(nextReward.points_required - points).toLocaleString()} pts away
                  </p>
                  <ProgressBar pct={nextPct} color={progressColor(nextPct)} />
                </div>
              </div>
            </div>
          )}

          {recommended && (
            <div className={`fade-up s3 rounded-2xl border shadow-sm p-4 flex gap-3 items-center
              ${recommended.canRedeem ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}
            >
              <img
                src={recommended.reward.image
                  ? `/storage/${recommended.reward.image}`
                  : "https://placehold.co/64x64/e2e8f0/94a3b8?text=🎁"}
                alt={recommended.reward.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                  {recommended.canRedeem ? "✨ Ready to Redeem" : "Recommended for You"}
                </p>
                <p className="font-extrabold text-[#1B1F5E] text-sm truncate">{recommended.reward.name}</p>
                <p className="text-xs text-slate-400">{recommended.reward.points_required.toLocaleString()} pts required</p>
              </div>
              <Link
                href={route("rewards.index")}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${recommended.canRedeem
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-[#1B1F5E] text-white hover:bg-[#2d3494]"}`}
              >
                {recommended.canRedeem ? "Redeem" : "View"}
              </Link>
            </div>
          )}

          {previewRewards.length > 0 && (
            <div className="fade-up s4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-[#1B1F5E] text-base">Quick Rewards</h3>
                <Link
                  href={route("rewards.index")}
                  className="text-xs font-bold text-[#1B1F5E] hover:text-blue-700 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                {previewRewards.map((r) => (
                  <div key={r.id} className="snap-start">
                    <RewardCard reward={r} userPoints={points} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fade-up s5">
            <h3 className="font-extrabold text-[#1B1F5E] text-base mb-3">Recent Activity</h3>

            {scans.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <p className="text-4xl mb-3">♻️</p>
                <p className="font-bold text-slate-600">No activity yet</p>
                <p className="text-sm text-slate-400 mt-1">Start scanning QR codes to earn points!</p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="mt-4 px-5 py-2.5 bg-[#1B1F5E] text-white text-xs font-bold rounded-xl hover:bg-[#2d3494] transition-all"
                >
                  Scan Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {["Today", "Yesterday", "Earlier"].map((group) => {
                  const items = grouped[group];
                  if (!items?.length) return null;
                  return (
                    <div key={group}>
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
                      </div>
                      <div className="divide-y divide-slate-50 px-4">
                        {items.map((scan) => <ActivityItem key={scan.id} scan={scan} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── SCANNER MODAL — receives apiToken prop ── */}
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onSuccess={handleScanSuccess}
          onError={(msg) => toast(msg, "error")}
          apiToken={api_token}
        />
      )}

      {scanResult && (
        <SuccessModal data={scanResult} onDone={handleSuccessDone} />
      )}

      {showLogoutConfirm && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}
    </>
  );
}
