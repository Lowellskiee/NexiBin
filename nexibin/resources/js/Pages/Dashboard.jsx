import { useState, useEffect, useRef } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

export default function Dashboard() {

  /* ===============================================
     GET DATA FROM INERTIA PROPS
  =============================================== */

  const { auth, rewards = [], recentScans = [] } = usePage().props;
  const user = auth.user;

  /* ===============================================
     STATE VARIABLES
  =============================================== */

  const [points, setPoints] = useState(user.points);
  const [showMenu, setShowMenu] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [scanError, setScanError] = useState(null);

  /* ===============================================
     QR SCANNER REFERENCES
  =============================================== */

  const qrRef = useRef(null);
  const scannedRef = useRef(false);
  const restartTimer = useRef(null);

  /* ===============================================
     GREETING
  =============================================== */

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  /* ===============================================
     STOP SCANNER
     Prevent camera freezing
  =============================================== */

  const stopScanner = async () => {

    if (!qrRef.current) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch {}

    qrRef.current = null;
    scannedRef.current = false;

  };

  /* ===============================================
     QR SCANNER INITIALIZATION
  =============================================== */

  useEffect(() => {

    if (!showScanner) return;

    const startScanner = async () => {

      try {

        const qr = new Html5Qrcode("reader");
        qrRef.current = qr;

        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },

          async (decodedText) => {

            if (scannedRef.current) return;
            scannedRef.current = true;

            setScanError(null);

            /* Extract token if QR contains URL */

            let token = decodedText;

            if (decodedText.includes("?")) {
              try {
                const url = new URL(decodedText);
                token = url.searchParams.get("token") || decodedText;
              } catch {}
            }

            try {

              const res = await axios.post(route("qr.scan"), {
                code: token
              });

              const data = res.data;

              if (data.success) {

                setScanSuccess({
                  points: data.points,
                  event: data.event
                });

                setPoints(prev => prev + data.points);

              } else {

                setScanError(data.message || "Invalid QR code");

              }

            } catch (error) { 
                if (error.response && error.response.data && error.response.data.message) { 
                    /* Show real backend message */ 
                    setScanError(error.response.data.message); } 
                else { 
                    /* Unknown error */ 
                    setScanError("Scan failed. Please try again."); 
                } 
            }

            /* Restart scanner automatically */

            restartTimer.current = setTimeout(() => {
              scannedRef.current = false;
            }, 1500);

          },

          () => {}

        );

      } catch {

        setScanError("Camera could not start.");

      }

    };

    setTimeout(startScanner, 200);

    return () => {
      clearTimeout(restartTimer.current);
      stopScanner();
    };

  }, [showScanner]);

  /* ===============================================
     SCANNER CONTROLS
  =============================================== */

  const openScanner = () => {
    setScanError(null);
    setScanSuccess(null);
    setShowScanner(true);
  };

  const closeScanner = async () => {
    clearTimeout(restartTimer.current);
    await stopScanner();
    setShowScanner(false);
  };

  /* ===============================================
     REWARD PREVIEW
  =============================================== */

  const previewRewards = rewards.slice(0, 4);

  /* ===============================================
     UI
  =============================================== */

  return (

    <>
      <Head title="Dashboard" />

      <div className="min-h-screen bg-gray-100 flex justify-center p-4">

        <div className="w-full max-w-3xl">

          {/* =====================================
              HEADER
          ===================================== */}

          <div className="flex justify-between items-center mb-6">

            <div>
              <p className="text-gray-500 text-sm">{getGreeting()}</p>
              <h2 className="text-2xl font-bold text-[#1B1F5E]">{user.name}</h2>
            </div>

            <div className="flex gap-3">

              {/* SCANNER BUTTON */}

              <button
                onClick={openScanner}
                className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl"
              >
                📷
              </button>

              {/* PROFILE MENU */}

              <div className="relative">

                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-12 h-12 bg-blue-100 rounded-full font-bold text-[#1B1F5E]"
                >
                  {user.name.substring(0,2).toUpperCase()}
                </button>

                {showMenu && (

                  <div className="absolute right-0 mt-2 w-40 bg-white shadow rounded-xl">

                    <Link
                      href={route("profile.edit")}
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Profile
                    </Link>

                    <Link
                      href={route("logout")}
                      method="post"
                      as="button"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </Link>

                  </div>

                )}

              </div>

            </div>

          </div>

          {/* =====================================
              POINTS CARD
          ===================================== */}

          <div className="bg-[#1B1F5E] text-white p-6 rounded-3xl mb-6 shadow">

            <p className="text-sm opacity-80">Total Points</p>

            <p className="text-4xl font-bold mt-1">
              {Number(points).toLocaleString()}
              <span className="text-lg"> pts</span>
            </p>

          </div>

          {/* =====================================
              REWARDS
          ===================================== */}

          <div className="flex justify-between items-center mb-4">

            <h3 className="text-lg font-semibold">Rewards</h3>

            <Link
              href={route("rewards.index")}
              className="text-sm text-blue-600 font-semibold"
            >
              View All →
            </Link>

          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">

            {previewRewards.map(reward => (

              <div
                key={reward.id}
                className="min-w-[180px] bg-white rounded-xl shadow p-3"
              >

                <img
                  src={reward.image
                    ? `/storage/${reward.image}`
                    : "https://via.placeholder.com/200"}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />

                <h4 className="font-semibold text-sm">{reward.name}</h4>

                <p className="text-xs text-gray-500">
                  {reward.points_required} pts
                </p>
                
                <Link
                  href={route("rewards.index")}
                  className="text-xs bg-[#1B1F5E] text-white px-3 py-1 rounded-lg text-center"
                >
                  View
                </Link>

              </div>

            ))}

          </div>

          {/* =====================================
              RECENT ACTIVITY
          ===================================== */}

          <div className="mt-8">

            <h3 className="text-lg font-semibold mb-3">
              Recent Activity
            </h3>

            <div className="bg-white rounded-xl shadow divide-y">

              {recentScans.length === 0 && (
                <p className="p-4 text-sm text-gray-500">
                  No scans yet.
                </p>
              )}

              {recentScans.map(scan => (

                <div
                  key={scan.id}
                  className="flex justify-between items-center p-4"
                >

                  <div>

                    <p className="font-semibold text-sm">
                      {scan.trash_event?.name ?? "Points acquired"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {new Date(scan.created_at).toLocaleString()}
                    </p>

                  </div>

                  <span className="text-green-600 font-bold">
                    +{scan.trash_event?.points ?? 0} pts
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          SCANNER MODAL
      ===================================== */}

      {showScanner && (

        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white p-4 rounded-xl w-[95%] max-w-sm text-center">

            <h2 className="font-bold mb-3">Scan QR Code</h2>

            <div id="reader" className="w-full"></div>

            <button
              onClick={closeScanner}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>

          </div>

        </div>

      )}

      {/* =====================================
          SUCCESS MODAL
      ===================================== */}

      {scanSuccess && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl text-center w-[90%] max-w-sm">

            <h2 className="text-green-600 text-xl font-bold mb-3">
              Scan Successful
            </h2>

            <p className="mb-2">{scanSuccess.event}</p>

            <p className="mb-4 font-semibold">
              +{scanSuccess.points} Points
            </p>

            <button
              onClick={() => {
                setScanSuccess(null);
                router.reload();}}
              className="bg-green-600 text-white px-5 py-2 rounded"
            >
              Done
            </button>

          </div>

        </div>

      )}

      {/* =====================================
          ERROR MODAL
      ===================================== */}

      {scanError && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl text-center w-[90%] max-w-sm">

            <h2 className="text-red-600 font-bold mb-3">
              QR Scan Failed
            </h2>

            <p className="mb-4">{scanError}</p>

            <button
              onClick={() => setScanError(null)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              OK
            </button>

          </div>

        </div>

      )}

    </>
  );

}
