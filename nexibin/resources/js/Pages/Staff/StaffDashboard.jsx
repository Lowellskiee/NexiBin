import { Head, usePage, router } from "@inertiajs/react";
import StaffLayout from "@/Layouts/StaffLayout";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ---------------------------
Helper Functions
----------------------------*/

const getColor = (level) => {
  if (level >= 80) return "#ef4444";
  if (level >= 50) return "#f59e0b";
  return "#22c55e";
};

const getStatusLabel = (level) => {
  if (level >= 80) return { text: "Needs Collection", cls: "text-red-500" };
  if (level >= 50) return { text: "Almost Full", cls: "text-amber-500" };
  return { text: "Normal", cls: "text-green-500" };
};

/* ---------------------------
Bin Card Component
----------------------------*/

function BinCard({ bin, onClick }) {
  const radius = 56;
  const stroke = 10;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const color = getColor(bin.level);
  const strokeDashoffset = circumference - (bin.level / 100) * circumference;
  const { text, cls } = getStatusLabel(bin.level);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center cursor-pointer hover:shadow-md active:scale-95 transition-all duration-150"
    >
      <h2 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
        {bin.name}
      </h2>

      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Trash2 size={20} color={color} />
          <span className="text-base font-bold text-slate-700 tabular-nums">
            {bin.level}%
          </span>
        </div>
      </div>

      <p className={`text-xs font-semibold mt-2 ${cls}`}>{text}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full">{bin.location}</p>
    </div>
  );
}

/* ---------------------------
Custom Tooltip
----------------------------*/

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1B1F5E] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey}>
          {p.name ?? p.dataKey}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ---------------------------
Staff Dashboard
----------------------------*/

export default function StaffDashboard() {
  const { auth, logs } = usePage().props;
  const user = auth.user;

  const [bins, setBins] = useState([
    { id: 1, name: "Dry Bin",      level: 30, location: "CCIS", lastCollected: "—" },
    { id: 2, name: "Wet Bin",      level: 60, location: "CCIS", lastCollected: "—" },
    { id: 3, name: "Metallic Bin", level: 90, location: "CCIS", lastCollected: "—" },
  ]);

  const [selectedBin, setSelectedBin] = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [trendData, setTrendData]     = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  /* ---------------------------
  Generate Analytics from DB
  ----------------------------*/

  useEffect(() => {
    const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    /* Weekly */
    const counts = {};
    logs.forEach((log) => {
      const day = days[new Date(log.collected_at).getDay()];
      counts[day] = (counts[day] || 0) + 1;
    });
    setTrendData(days.map((day) => ({ day, bins: counts[day] || 0 })));

    /* Monthly */
    const mc = {};
    months.forEach((m) => { mc[m] = { month: m, wet: 0, dry: 0, metallic: 0 }; });
    logs.forEach((log) => {
      const m = months[new Date(log.collected_at).getMonth()];
      mc[m][log.bin_type]++;
    });
    setMonthlyData(Object.values(mc));
  }, [logs]);

  /* ---------------------------
  Collect Bin
  ----------------------------*/

  const collectBin = (id) => {
    const bin = bins.find((b) => b.id === id);
    if (bin.level === 0) { alert("This bin has already been collected."); return; }
    if (!window.confirm(`Collect ${bin.name} at ${bin.location}?`)) return;

    let binType = "dry";
    if (bin.name.toLowerCase().includes("wet"))      binType = "wet";
    if (bin.name.toLowerCase().includes("metallic")) binType = "metallic";

    router.post(
      route("collect.bin"),
      { bin: bin.name, location: bin.location, bin_type: binType },
      {
        onSuccess: () => {
          const time = new Date().toLocaleString();
          const updated = bins.map((b) =>
            b.id === id ? { ...b, level: 0, lastCollected: time } : b
          );
          setBins(updated);
          setSelectedBin(updated.find((b) => b.id === id));
        },
      }
    );
  };

  /* ---------------------------
  Derived Stats
  ----------------------------*/

  const binsNeedingCollection = bins.filter((b) => b.level >= 80).length;
  const avgLevel = Math.round(bins.reduce((a, b) => a + b.level, 0) / bins.length);

  /* ---------------------------
  UI
  ----------------------------*/

  return (
    <>
      <Head title="Staff Dashboard" />

      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 md:px-8 py-5 md:py-8 overflow-x-hidden space-y-5 md:space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            Smart Waste Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome, {user.name}</p>
        </div>

        {/* ── Analytics Cards ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] md:text-sm text-slate-400 uppercase tracking-wide font-semibold">Total Bins</h3>
            <p className="text-2xl md:text-3xl font-bold text-[#1B1F5E] mt-1 tabular-nums">{bins.length}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] md:text-sm text-slate-400 uppercase tracking-wide font-semibold leading-tight">Needs Collection</h3>
            <p className="text-2xl md:text-3xl font-bold text-red-500 mt-1 tabular-nums">{binsNeedingCollection}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-[10px] md:text-sm text-slate-400 uppercase tracking-wide font-semibold leading-tight">Avg Fill</h3>
            <p className="text-2xl md:text-3xl font-bold text-[#1B1F5E] mt-1 tabular-nums">{avgLevel}%</p>
          </div>
        </div>

        {/* ── Bin Grid ── */}
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-700 mb-3">Bin Status</h2>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {bins.map((bin) => (
              <BinCard
                key={bin.id}
                bin={bin}
                onClick={() => { setSelectedBin(bin); setShowModal(true); }}
              />
            ))}
          </div>
        </div>

        {/* ── Weekly Trend ── */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm md:text-base font-semibold text-slate-700 mb-4">
            Collection Trend (Weekly)
          </h2>
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="bins"
                  stroke="#1B1F5E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#1B1F5E" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Monthly by Type ── */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm md:text-base font-semibold text-slate-700 mb-4">
            Monthly Collection by Type
          </h2>
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconSize={10}
                />
                <Bar dataKey="wet"      stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                <Bar dataKey="dry"      stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
                <Bar dataKey="metallic" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Modal (bottom sheet on mobile, centered on desktop) ── */}
      {showModal && selectedBin && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-5 relative
              animate-[slideUp_0.25s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-sm"
            >
              ✕
            </button>

            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4 pr-8">
              {selectedBin.name} Details
            </h2>

            {/* Fill level bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Fill Level</span>
                <span className="font-semibold" style={{ color: getColor(selectedBin.level) }}>
                  {selectedBin.level}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${selectedBin.level}%`,
                    backgroundColor: getColor(selectedBin.level),
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Status</span>
                <span className={`font-semibold ${getStatusLabel(selectedBin.level).cls}`}>
                  {getStatusLabel(selectedBin.level).text}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-400">Location</span>
                <span className="font-medium">{selectedBin.location}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Last Collected</span>
                <span className="font-medium">{selectedBin.lastCollected}</span>
              </div>
            </div>

            <button
              onClick={() => collectBin(selectedBin.id)}
              className="mt-5 w-full py-3 rounded-xl text-white font-semibold bg-green-600 hover:bg-green-700 active:scale-95 transition-all duration-150 text-sm"
            >
              Collect Bin
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { transform: translateY(16px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        }
      `}</style>
    </>
  );
}

StaffDashboard.layout = (page) => <StaffLayout>{page}</StaffLayout>;
