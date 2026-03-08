import { Head, usePage } from "@inertiajs/react";
import StaffLayout from "@/Layouts/StaffLayout";
import { Trash2 } from "lucide-react";
import { useState } from "react";

function getColor(level) {
    if (level >= 80) return "#ef4444";
    if (level >= 50) return "#f59e0b";
    return "#22c55e";
}

function getStatus(level) {
    if (level >= 80) return "Needs Collection";
    if (level >= 50) return "Almost Full";
    return "Normal";
}

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
            className="bg-white rounded-xl shadow p-6 flex flex-col items-center cursor-pointer hover:shadow-lg"
        >

            <h2 className="text-sm text-gray-500 mb-4">
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

export default function StaffDashboard() {

    const { auth } = usePage().props;
    const user = auth.user;

    const [bins, setBins] = useState([
        { id: 1, name: "Dry Bin", level: 35, location: "Area A", lastCollected: "-" },
        { id: 2, name: "Wet Bin", level: 65, location: "Area A", lastCollected: "-" },
        { id: 3, name: "Metallic Bin", level: 90, location: "Area A", lastCollected: "-" }
    ]);

    const [selectedBin, setSelectedBin] = useState(null);

    function collectBin(id) {

        const updatedBins = bins.map(bin => {

            if (bin.id === id) {

                const time = new Date().toLocaleString();

                const newLog = {
                    bin: bin.name,
                    location: bin.location,
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
                    ...bin,
                    level: 0,
                    lastCollected: time
                };
            }

            return bin;
        });

        setBins(updatedBins);
        setSelectedBin(updatedBins.find(b => b.id === id));
    }

    return (
        <>
            <Head title="Staff Dashboard" />

            <h1 className="text-2xl font-bold text-gray-800">
                Smart Waste Monitoring
            </h1>

            <p className="text-gray-600 mb-8">
                Welcome, {user.name}
            </p>

            <div className="grid md:grid-cols-3 gap-6">

                {bins.map(bin => (

                    <BinCard
                        key={bin.id}
                        bin={bin}
                        onClick={() => setSelectedBin(bin)}
                    />

                ))}

            </div>

            {selectedBin && (

                <div className="mt-10 bg-white shadow rounded-xl p-6">

                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBin.name} Details
                    </h2>

                    <p><strong>Fill Level:</strong> {selectedBin.level}%</p>
                    <p><strong>Status:</strong> {getStatus(selectedBin.level)}</p>
                    <p><strong>Location:</strong> {selectedBin.location}</p>
                    <p><strong>Last Collected:</strong> {selectedBin.lastCollected}</p>

                    <button
                        onClick={() => collectBin(selectedBin.id)}
                        className="mt-6 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700"
                    >
                        Collect Bin
                    </button>

                </div>

            )}

        </>
    );
}

StaffDashboard.layout = page => <StaffLayout>{page}</StaffLayout>;