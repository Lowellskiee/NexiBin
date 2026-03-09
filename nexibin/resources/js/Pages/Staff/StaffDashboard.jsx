import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/Layouts/StaffLayout";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

/* ---------------------------
   Helper Functions
----------------------------*/

const getColor = (level) => {
  if (level >= 80) return "#ef4444";
  if (level >= 50) return "#f59e0b";
  return "#22c55e";
};

const getStatus = (level) => {
  if (level >= 80) return "Needs Collection";
  if (level >= 50) return "Almost Full";
  return "Normal";
};

/* ---------------------------
   Bin Card Component
----------------------------*/

function BinCard({ bin, onClick }) {
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;

  const color = getColor(bin.level);
  const strokeDashoffset =
    circumference - (bin.level / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow p-4 sm:p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
    >
      <h2 className="text-sm text-gray-500 mb-4">{bin.name}</h2>

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

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Trash2 size={30} color={color} />
          <span className="text-lg font-bold text-gray-700">
            {bin.level}%
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        {getStatus(bin.level)}
      </p>
    </div>
  );
}

/* ---------------------------
   Main Dashboard
----------------------------*/

export default function StaffDashboard() {
  const { auth } = usePage().props;
  const user = auth.user;

  const [bins, setBins] = useState([
    { id: 1, name: "Dry Bin", level: 30, location: "CCIS Lobby", lastCollected: "-" },
    { id: 2, name: "Wet Bin", level: 60, location: "CCIS Lobby", lastCollected: "-" },
    { id: 3, name: "Metallic Bin", level: 90, location: "CCIS Lobby     ", lastCollected: "-" }
  ]);

  const [selectedBin, setSelectedBin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trendData, setTrendData] = useState([]);

  /* ---------------------------
     Load Collection Analytics
  ----------------------------*/

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("collectionLogs")) || [];

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = {};

    logs.forEach((log) => {
      const date = new Date(log.time);
      const day = days[date.getDay()];
      counts[day] = (counts[day] || 0) + 1;
    });

    const chartData = days.map((day) => ({
      day,
      bins: counts[day] || 0
    }));

    setTrendData(chartData);
  }, []);

  /* ---------------------------
     Collect Bin Function
  ----------------------------*/
  
const collectBin = (id) => {

  const bin = bins.find(b => b.id === id);

  /* If bin already empty */

  if (bin.level === 0) {
    alert("This bin has already been collected.");
    return;
  }

  /* Confirmation prompt */

  const confirmCollect = window.confirm(
    `Collect ${bin.name} located at ${bin.location}?`
  );

  if (!confirmCollect) return;

  const updatedBins = bins.map((b) => {

    if (b.id === id) {

      const time = new Date().toLocaleString();

      const newLog = {
        bin: b.name,
        location: b.location,
        staff: user.name,
        time: time,
        status: "Collected"
      };

      const existingLogs =
        JSON.parse(localStorage.getItem("collectionLogs")) || [];

      localStorage.setItem(
        "collectionLogs",
        JSON.stringify([newLog, ...existingLogs])
      );

      return {
        ...b,
        level: 0,
        lastCollected: time
      };

    }

    return b;

  });

  setBins(updatedBins);
  setSelectedBin(updatedBins.find(b => b.id === id));

};

  /* ---------------------------
     Analytics Data
  ----------------------------*/

  const binsNeedingCollection = bins.filter(
    (bin) => bin.level >= 80
  ).length;

  const avgLevel = Math.round(
    bins.reduce((a, b) => a + b.level, 0) / bins.length
  );

  return (
    <>
      <Head title="Staff Dashboard" />

      <h1 className="text-2xl font-bold text-gray-800">
        Smart Waste Monitoring
      </h1>

      <p className="text-gray-600 mb-8">
        Welcome, {user.name}
      </p>

      {/* Analytics Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">Total Bins</h3>
          <p className="text-2xl font-bold">{bins.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">Needs Collection</h3>
          <p className="text-2xl font-bold text-red-500">
            {binsNeedingCollection}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">Average Fill Level</h3>
          <p className="text-2xl font-bold">{avgLevel}%</p>
        </div>

      </div>

      {/* Waste Collection Trend */}

      <div className="bg-white p-6 rounded-xl shadow mb-10">

        <h2 className="text-lg font-semibold mb-4">
          Waste Collection Trend
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="bins"
              stroke="#1B1F5E"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* Bin Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {bins.map((bin) => (
          <BinCard
            key={bin.id}
            bin={bin}
            onClick={() => {
              setSelectedBin(bin);
              setShowModal(true);
            }}
          />
        ))}

      </div>

      {/* Modal */}

      {showModal && selectedBin && (

        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >

          <div
            className="bg-white w-[90%] max-w-md rounded-xl shadow-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {selectedBin.name} Details
            </h2>

            <div className="space-y-2 text-gray-600">

              <p>
                <strong>Fill Level:</strong> {selectedBin.level}%
              </p>

              <p>
                <strong>Status:</strong> {getStatus(selectedBin.level)}
              </p>

              <p>
                <strong>Location:</strong> {selectedBin.location}
              </p>

              <p>
                <strong>Last Collected:</strong> {selectedBin.lastCollected}
              </p>

            </div>

            <button
              onClick={() => collectBin(selectedBin.id)}
              className="mt-6 w-full px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700"
            >
              Collect Bin
            </button>

          </div>

        </div>

      )}

    </>
  );
}

StaffDashboard.layout = (page) => <StaffLayout>{page}</StaffLayout>;