import { Head, usePage, Link, router } from "@inertiajs/react";
import { useState, useMemo, useCallback, useEffect } from "react";

/* ─── HELPERS ─────────────────────────────────────────────── */

function formatTxnId(id, date) {
  const d = date ? new Date(date) : new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `TXN-${yyyymmdd}-${String(id ?? 0).padStart(4, "0")}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function progressColor(pct) {
  if (pct >= 85) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}

/* ─── TOAST ───────────────────────────────────────────────── */

function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-300 pointer-events-auto ${
            t.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
          style={{ animation: "slideIn 0.25s ease" }}
        >
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

/* ─── STATUS BADGE ────────────────────────────────────────── */

const STATUS_STYLES = {
  Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Pending:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500"
      }`}
    >
      {status ?? "Unknown"}
    </span>
  );
}

/* ─── REWARD CARD ─────────────────────────────────────────── */

function RewardCard({ reward, userPoints, onDetails, redeeming }) {
  const pct        = Math.min((userPoints / reward.points_required) * 100, 100);
  const canRedeem  = userPoints >= reward.points_required && reward.stock > 0;
  const outOfStock = reward.stock <= 0;
  const needMore   = !outOfStock && !canRedeem;
  const gap        = reward.points_required - userPoints;
  const barColor   = progressColor(pct);

  return (
    <div
      onClick={() => onDetails(reward)}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 cursor-pointer
        hover:-translate-y-1 hover:shadow-lg
        ${canRedeem  ? "border-emerald-400"  : ""}
        ${outOfStock ? "border-red-200 opacity-75" : ""}
        ${needMore   ? "border-slate-100"    : ""}
      `}
    >
      {/* Status ribbon */}
      <div className="absolute top-3 left-3 z-10">
        {canRedeem  && <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">✓ Redeemable</span>}
        {outOfStock && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">Out of Stock</span>}
        {needMore   && <span className="bg-slate-700/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">🔒 Locked</span>}
      </div>

      {/* Image */}
      <div className="relative overflow-hidden h-36">
        <img
          src={reward.image ? `/storage/${reward.image}` : "https://placehold.co/400x200/e2e8f0/94a3b8?text=Reward"}
          alt={reward.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="font-bold text-[#1B1F5E] text-sm leading-tight mb-1 line-clamp-1">{reward.name}</h2>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{reward.description}</p>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-500">
              {needMore ? `${gap.toLocaleString()} pts more` : canRedeem ? "Ready!" : "Out of stock"}
            </span>
            <span className="text-[10px] text-slate-400">{Math.floor(pct)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-extrabold text-[#1B1F5E]">
              {reward.points_required.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">pts</span>
            </p>
            <p className="text-[10px] text-slate-400">Stock: {reward.stock}</p>
          </div>
          <button
            disabled={!canRedeem || redeeming}
            onClick={(e) => { e.stopPropagation(); onDetails(reward); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95
              ${canRedeem && !redeeming
                ? "bg-[#1B1F5E] text-white hover:bg-[#2d3494] shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
          >
            {outOfStock ? "Out of Stock" : needMore ? "Locked" : "Redeem Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── REWARD DETAIL MODAL ─────────────────────────────────── */

function RewardDetailModal({ reward, userPoints, onClose, onRedeem, redeeming }) {
  const canRedeem  = userPoints >= reward.points_required && reward.stock > 0;
  const outOfStock = reward.stock <= 0;
  const gap        = reward.points_required - userPoints;
  const pct        = Math.min((userPoints / reward.points_required) * 100, 100);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.3s ease" }}
      >
        {/* Image */}
        <div className="relative h-52">
          <img
            src={reward.image ? `/storage/${reward.image}` : "https://placehold.co/400x200/e2e8f0/94a3b8?text=Reward"}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-600 text-sm shadow transition-all"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-4">
            {canRedeem  && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ Redeemable</span>}
            {outOfStock && <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Out of Stock</span>}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-extrabold text-[#1B1F5E] mb-1">{reward.name}</h2>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">{reward.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Points Required</p>
              <p className="text-lg font-extrabold text-[#1B1F5E]">{reward.points_required.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Stock Left</p>
              <p className={`text-lg font-extrabold ${reward.stock <= 5 ? "text-red-500" : "text-slate-700"}`}>
                {reward.stock}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-500">
                {canRedeem ? "Ready to redeem!" : outOfStock ? "Out of stock" : `${gap.toLocaleString()} pts to go`}
              </span>
              <span className="text-slate-400">{Math.floor(pct)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: progressColor(pct) }}
              />
            </div>
          </div>

          <button
            disabled={!canRedeem || redeeming}
            onClick={() => onRedeem(reward)}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.98]
              ${canRedeem && !redeeming
                ? "bg-[#1B1F5E] text-white hover:bg-[#2d3494] shadow-md"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
          >
            {redeeming ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                Processing…
              </span>
            ) : outOfStock ? "Out of Stock" : !canRedeem ? `Earn ${gap.toLocaleString()} more pts` : "Redeem Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CONFIRM MODAL ───────────────────────────────────────── */

function ConfirmModal({ reward, onConfirm, onCancel, redeeming }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs p-6 text-center shadow-2xl"
        style={{ animation: "scaleIn 0.2s ease" }}
      >
        <div className="w-14 h-14 bg-[#1B1F5E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎁</span>
        </div>
        <h2 className="font-extrabold text-[#1B1F5E] text-lg mb-1">Confirm Redemption</h2>
        <p className="text-sm text-slate-500 mb-1">You are about to redeem</p>
        <p className="font-bold text-[#1B1F5E] text-base mb-1">{reward.name}</p>
        <p className="text-sm text-slate-400 mb-5">
          for <span className="font-bold text-[#1B1F5E]">{reward.points_required.toLocaleString()} points</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={redeeming}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={redeeming}
            className="flex-1 py-2.5 bg-[#1B1F5E] text-white rounded-xl text-sm font-bold hover:bg-[#2d3494] transition-all active:scale-[0.97] disabled:opacity-60"
          >
            {redeeming ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                Processing…
              </span>
            ) : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── RECEIPT MODAL ───────────────────────────────────────── */

function ReceiptModal({ receipt, onClose, onViewHistory }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const txnId   = formatTxnId(receipt.redemptionId, receipt.date);
  const dateStr = formatDate(receipt.date);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.3s ease" }}
      >
        {/* Header */}
        <div className="bg-[#1B1F5E] px-6 py-5 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🎁</span>
          </div>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Redemption Confirmed</p>
          <p className="text-white font-extrabold text-lg leading-tight">{receipt.rewardName}</p>
        </div>

        {/* Receipt body */}
        <div className="p-5 space-y-4">
          <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
            {[
              ["Transaction ID", <span key="txn" className="font-mono text-[11px] text-slate-600">{txnId}</span>],
              ["Date",           <span key="date" className="text-slate-700">{dateStr}</span>],
              ["Account",        <span key="acct" className="text-slate-700">{receipt.userEmail}</span>],
              ["Points spent",   <span key="spent" className="font-bold text-[#1B1F5E]">−{receipt.pointsUsed.toLocaleString()} pts</span>],
              ["Remaining balance", <span key="bal" className="font-bold text-slate-800">{receipt.pointsAfter.toLocaleString()} pts</span>],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs text-right">{val}</span>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 rounded-xl px-4 py-3 flex gap-2.5 items-start">
            <span className="text-base mt-0.5">✅</span>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your reward is being processed. A staff member will contact you shortly to fulfill your reward.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { onClose(); onViewHistory(); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              View History
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#1B1F5E] text-white text-xs font-bold hover:bg-[#2d3494] transition-all active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── HISTORY RECEIPT MODAL (NEW) ────────────────────────── */

function HistoryReceiptModal({ redemption, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const txnId   = formatTxnId(redemption.id, redemption.created_at);
  const dateStr = formatDate(redemption.created_at);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4"
      onClick={onClose}
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.3s ease" }}
      >
        {/* Header */}
        <div className="bg-[#1B1F5E] px-6 py-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-sm transition-all"
          >
            ✕
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🧾</span>
          </div>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Redemption Receipt</p>
          <p className="text-white font-extrabold text-lg leading-tight">{redemption.reward?.name ?? "—"}</p>
        </div>

        {/* Receipt body */}
        <div className="p-5 space-y-4">
          <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
            {[
              ["Transaction ID", <span key="txn" className="font-mono text-[11px] text-slate-600">{txnId}</span>],
              ["Date",           <span key="date" className="text-slate-700">{dateStr}</span>],
              ["Points spent",   <span key="spent" className="font-bold text-[#1B1F5E]">−{(redemption.points_used ?? 0).toLocaleString()} pts</span>],
              ["Status",         <StatusBadge key="status" status={redemption.status} />],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs text-right">{val}</span>
              </div>
            ))}
          </div>

          {redemption.status === "Pending" && (
            <div className="bg-amber-50 rounded-xl px-4 py-3 flex gap-2.5 items-start">
              <span className="text-base mt-0.5">⏳</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                This reward is still being processed. A staff member will contact you shortly.
              </p>
            </div>
          )}
          {redemption.status === "Completed" && (
            <div className="bg-emerald-50 rounded-xl px-4 py-3 flex gap-2.5 items-start">
              <span className="text-base mt-0.5">✅</span>
              <p className="text-xs text-emerald-700 leading-relaxed">
                This reward has been fulfilled. Thank you!
              </p>
            </div>
          )}
          {redemption.status === "Cancelled" && (
            <div className="bg-red-50 rounded-xl px-4 py-3 flex gap-2.5 items-start">
              <span className="text-base mt-0.5">❌</span>
              <p className="text-xs text-red-700 leading-relaxed">
                This redemption was cancelled. Please contact support if you have questions.
              </p>
            </div>
          )}
          {!["Pending", "Completed", "Cancelled"].includes(redemption.status) && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex gap-2.5 items-start">
              <span className="text-base mt-0.5">ℹ️</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Status is currently unknown. Please contact support for more information.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1B1F5E] text-white text-xs font-bold hover:bg-[#2d3494] transition-all active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PAGINATION ──────────────────────────────────────────── */

function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;

  const getPages = () => {
    const pages = [];
    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(lastPage - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < lastPage - 2) pages.push("...");
      pages.push(lastPage);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                   bg-white border border-slate-200 text-slate-600
                   hover:bg-slate-50 hover:border-slate-300
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-150 active:scale-[0.97]"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>

      <div className="flex items-center gap-1">
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-slate-400 font-semibold select-none">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.95]
                ${p === currentPage
                  ? "bg-[#1B1F5E] text-white shadow-sm"
                  : "bg-white border border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                   bg-white border border-slate-200 text-slate-600
                   hover:bg-slate-50 hover:border-slate-300
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-all duration-150 active:scale-[0.97]"
      >
        Next
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/* ─── HISTORY SECTION ─────────────────────────────────────── */

function RedemptionHistory({ redemptions = [], onView }) {
  if (!redemptions.length) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm font-semibold">No redemptions yet</p>
        <p className="text-xs mt-1">Your redeemed rewards will appear here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="pb-3 text-left font-semibold">TXN ID</th>
              <th className="pb-3 text-left font-semibold">Reward</th>
              <th className="pb-3 text-right font-semibold">Points</th>
              <th className="pb-3 text-center font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {redemptions.map((r) => (
              <tr
                key={r.id}
                onClick={() => onView(r)}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="py-3 pr-4 font-mono text-[10px] text-slate-400">{formatTxnId(r.id, r.created_at)}</td>
                <td className="py-3 pr-4 font-semibold text-slate-700 group-hover:text-[#1B1F5E] transition-colors">{r.reward?.name ?? "—"}</td>
                <td className="py-3 pr-4 text-right font-bold text-[#1B1F5E]">{(r.points_used ?? 0).toLocaleString()}</td>
                <td className="py-3 text-center"><StatusBadge status={r.status} /></td>
                <td className="py-3 pl-4 text-right text-xs text-slate-400">
                  <span>{timeAgo(r.created_at)}</span>
                  <span className="ml-2 text-[10px] text-slate-300 group-hover:text-[#1B1F5E] transition-colors">→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {redemptions.map((r) => (
          <div
            key={r.id}
            onClick={() => onView(r)}
            className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm cursor-pointer hover:border-[#1B1F5E]/30 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-sm text-slate-800">{r.reward?.name ?? "—"}</p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">{formatTxnId(r.id, r.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="text-slate-300 text-xs">→</span>
              </div>
            </div>
            <div className="border-t border-dashed border-slate-100 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Points Used</p>
                <p className="text-sm font-bold text-[#1B1F5E]">{(r.points_used ?? 0).toLocaleString()} pts</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-xs text-slate-500">{timeAgo(r.created_at)}</p>
                <p className="text-[10px] text-slate-400">{formatDate(r.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────── */

const TABS  = ["All Rewards", "Redeemable", "High Value"];
const SORTS = ["Lowest Points", "Highest Points", "Closest to Redeem"];

export default function RewardsIndex() {
  const { rewards = [], auth, redemptions = {}, latestRedemptionId } = usePage().props;
  const user = auth.user;

  const redemptionData  = redemptions.data         ?? [];
  const currentPage     = redemptions.current_page  ?? 1;
  const lastPage        = redemptions.last_page      ?? 1;
  const total           = redemptions.total          ?? 0;

  const { toasts, add: addToast } = useToast();

  const [activeTab,        setActiveTab]        = useState("All Rewards");
  const [sortBy,           setSortBy]           = useState("Lowest Points");
  const [detailReward,     setDetailReward]     = useState(null);
  const [confirmReward,    setConfirmReward]    = useState(null);
  const [redeeming,        setRedeeming]        = useState(false);
  const [activeSection,    setActiveSection]    = useState("rewards");
  const [receipt,          setReceipt]          = useState(null);
  const [viewingRedemption, setViewingRedemption] = useState(null); // ← NEW

  /* Filter + sort */
  const filtered = useMemo(() => {
    let list = [...rewards];
    if (activeTab === "Redeemable") list = list.filter((r) => user.points >= r.points_required && r.stock > 0);
    if (activeTab === "High Value")  list = list.filter((r) => r.points_required >= 500);

    if (sortBy === "Lowest Points")     list.sort((a, b) => a.points_required - b.points_required);
    if (sortBy === "Highest Points")    list.sort((a, b) => b.points_required - a.points_required);
    if (sortBy === "Closest to Redeem") list.sort((a, b) => (a.points_required - user.points) - (b.points_required - user.points));

    return list;
  }, [rewards, activeTab, sortBy, user.points]);

  const goToPage = useCallback((p) => {
    router.get(
      route("rewards.index"),
      { page: p },
      {
        preserveScroll: true,
        preserveState:  true,
        only:           ["redemptions"],
      }
    );
  }, []);

  const handleRedeem = useCallback((reward) => {
    setDetailReward(null);
    setConfirmReward(reward);
  }, []);

  const confirmRedeem = useCallback(() => {
    if (!confirmReward || redeeming) return;
    setRedeeming(true);

    const redeemedReward = confirmReward;

    router.post(
      route("rewards.redeem", confirmReward.id),
      {},
      {
        preserveScroll: true,
        onSuccess: (page) => {
          const updatedUser = page.props.auth?.user ?? user;
          setConfirmReward(null);
          setRedeeming(false);
          setReceipt({
            redemptionId: page.props.latestRedemptionId ?? Date.now(),
            date:         new Date().toISOString(),
            rewardName:   redeemedReward.name,
            userEmail:    updatedUser.email ?? user.email,
            pointsUsed:   redeemedReward.points_required,
            pointsAfter:  updatedUser.points ?? (user.points - redeemedReward.points_required),
          });
        },
        onError: () => {
          addToast("Something went wrong. Please try again.", "error");
          setRedeeming(false);
        },
        onFinish: () => setRedeeming(false),
      }
    );
  }, [confirmReward, redeeming, addToast, user]);

  const redeemableCount = rewards.filter((r) => user.points >= r.points_required && r.stock > 0).length;

  return (
    <>
      <Head title="Rewards" />

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.92);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .stagger-1{animation-delay:.05s} .stagger-2{animation-delay:.10s}
        .stagger-3{animation-delay:.15s} .stagger-4{animation-delay:.20s}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      <Toast toasts={toasts} />

      <div className="min-h-screen bg-slate-50">

        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-40 bg-[#1B1F5E] shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={route("dashboard")}
                className="text-white/70 hover:text-white text-sm font-semibold transition-colors"
              >
                ← Back
              </Link>
              <span className="text-white/30">|</span>
              <h1 className="text-white font-extrabold text-base tracking-tight">Rewards</h1>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Your Points</p>
              <p className="text-white font-extrabold text-xl leading-none tabular-nums">
                {Number(user.points).toLocaleString()}
                <span className="text-sm font-semibold text-white/60 ml-1">pts</span>
              </p>
            </div>
          </div>

          {redeemableCount > 0 && (
            <div className="bg-emerald-500 text-white text-[11px] font-bold text-center py-1.5 tracking-wide">
              🎉 You can redeem {redeemableCount} reward{redeemableCount > 1 ? "s" : ""}!
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* ── SECTION SWITCHER ── */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 fade-up">
            {["rewards", "history"].map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                  activeSection === s
                    ? "bg-[#1B1F5E] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s === "rewards" ? "🎁 Rewards" : "🧾 My Redemptions"}
              </button>
            ))}
          </div>

          {activeSection === "rewards" ? (
            <>
              {/* ── FILTER TABS ── */}
              <div className="fade-up stagger-1">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                        activeTab === tab
                          ? "bg-[#1B1F5E] text-white shadow-sm"
                          : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── SORT ── */}
              <div className="flex items-center gap-3 fade-up stagger-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Sort by:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {SORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        sortBy === s
                          ? "bg-slate-800 text-white"
                          : "bg-white text-slate-500 border border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── REWARDS GRID ── */}
              <div className="fade-up stagger-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-3">🎁</p>
                    <p className="font-bold text-slate-600">No rewards found</p>
                    <p className="text-sm text-slate-400 mt-1">Try a different filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((reward) => (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        userPoints={user.points}
                        onDetails={setDetailReward}
                        redeeming={redeeming}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── HISTORY ── */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-up stagger-1">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-extrabold text-[#1B1F5E] uppercase tracking-wider">
                  My Redemptions
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">
                    {total} record{total !== 1 ? "s" : ""}
                  </span>
                  {lastPage > 1 && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                      Page {currentPage} of {lastPage}
                    </span>
                  )}
                </div>
              </div>

              {/* Tap hint */}
              {redemptionData.length > 0 && (
                <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1">
                  <span>👆</span> Tap any row to view its receipt
                </p>
              )}

              {/* Records */}
              <RedemptionHistory
                redemptions={redemptionData}
                onView={setViewingRedemption}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={goToPage}
              />

            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {detailReward && (
        <RewardDetailModal
          reward={detailReward}
          userPoints={user.points}
          onClose={() => setDetailReward(null)}
          onRedeem={handleRedeem}
          redeeming={redeeming}
        />
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirmReward && (
        <ConfirmModal
          reward={confirmReward}
          onConfirm={confirmRedeem}
          onCancel={() => setConfirmReward(null)}
          redeeming={redeeming}
        />
      )}

      {/* ── RECEIPT MODAL (post-redeem) ── */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
          onViewHistory={() => setActiveSection("history")}
        />
      )}

      {/* ── HISTORY RECEIPT MODAL (view past redemption) ── */}
      {viewingRedemption && (
        <HistoryReceiptModal
          redemption={viewingRedemption}
          onClose={() => setViewingRedemption(null)}
        />
      )}
    </>
  );
}
