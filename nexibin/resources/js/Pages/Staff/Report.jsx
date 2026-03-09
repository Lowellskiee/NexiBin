import { useEffect, useState } from "react";
import StaffLayout from "@/Layouts/StaffLayout";

export default function Report() {

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  /* -----------------------------
     Load Logs
  ----------------------------- */

  useEffect(() => {

    const storedLogs =
      JSON.parse(localStorage.getItem("collectionLogs")) || [];

    setLogs(storedLogs);

  }, []);

  /* -----------------------------
     Export JSON
  ----------------------------- */

  const exportJSON = () => {

    const dataStr = JSON.stringify(logs, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "collection-report.json";

    a.click();

  };

  /* -----------------------------
     Export CSV (Excel)
  ----------------------------- */

  const exportCSV = () => {

    const headers = ["Bin", "Location", "Staff", "Time", "Status"];

    const rows = logs.map(log => [
      log.bin,
      log.location,
      log.staff,
      log.time,
      log.status
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "collection-report.csv";

    a.click();

  };

  /* -----------------------------
     Analytics
  ----------------------------- */

  const today = new Date().toDateString();

  const collectionsToday = logs.filter(log =>
    new Date(log.time).toDateString() === today
  ).length;

  const filteredLogs = logs.filter(log =>
    log.bin?.toLowerCase().includes(search.toLowerCase()) ||
    log.location?.toLowerCase().includes(search.toLowerCase()) ||
    log.staff?.toLowerCase().includes(search.toLowerCase())
  );

  /* -----------------------------
     UI
  ----------------------------- */

  return (

    <StaffLayout>

      <div className="p-6">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

          <h1 className="text-2xl font-bold">
            Collection Reports
          </h1>

          <div className="flex gap-2">

            <button
              onClick={exportJSON}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Export JSON
            </button>

            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export CSV
            </button>

          </div>

        </div>

        {/* Analytics Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">

          <div className="bg-white shadow rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Total Collections
            </p>
            <p className="text-2xl font-bold">
              {logs.length}
            </p>
          </div>

          <div className="bg-white shadow rounded-xl p-5">
            <p className="text-gray-500 text-sm">
              Collections Today
            </p>
            <p className="text-2xl font-bold text-green-600">
              {collectionsToday}
            </p>
          </div>

        </div>

        {/* Search */}

        <div className="mb-4">

          <input
            type="text"
            placeholder="Search bin, location, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 border rounded-lg px-4 py-2"
          />

        </div>

        {/* Table */}

        <div className="overflow-x-auto bg-white shadow rounded-xl">

          <table className="w-full text-sm text-center">

            <thead className="bg-gray-100 text-gray-700">

              <tr>
                <th className="p-3 border">Bin</th>
                <th className="p-3 border">Location</th>
                <th className="p-3 border">Staff</th>
                <th className="p-3 border">Time</th>
                <th className="p-3 border">Status</th>
              </tr>

            </thead>

            <tbody>

              {filteredLogs.length === 0 ? (

                <tr>

                  <td colSpan="5" className="p-6 text-gray-500">
                    No collection logs available
                  </td>

                </tr>

              ) : (

                filteredLogs.map((log, index) => (

                  <tr
                    key={index}
                    className="border hover:bg-gray-50"
                  >

                    <td className="p-3 border font-medium">
                      {log.bin}
                    </td>

                    <td className="p-3 border">
                      {log.location}
                    </td>

                    <td className="p-3 border text-blue-600 font-semibold">
                      {log.staff || "Unknown"}
                    </td>

                    <td className="p-3 border">
                      {log.time}
                    </td>

                    <td className="p-3 border text-green-600 font-semibold">
                      {log.status}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </StaffLayout>

  );

}