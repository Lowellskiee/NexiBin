import { useState, useEffect } from "react";
import { usePage, Link, Head, router } from "@inertiajs/react";
import { Html5Qrcode } from "html5-qrcode";

export default function Dashboard() {

  const { auth, rewards, flash } = usePage().props;
  const user = auth.user;

  /* -----------------------------
     STATE
  ----------------------------- */

  const [showMenu, setShowMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [qrInstance, setQrInstance] = useState(null);

  const [confirmReward, setConfirmReward] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const [search, setSearch] = useState("");

  /* -----------------------------
     FLASH RECEIPT
  ----------------------------- */

  useEffect(() => {

    if (flash?.success) {

      setReceipt({
        user: user.name,
        reward: flash.reward_name,
        points: flash.points_used,
        transaction: flash.transaction_id,
        date: new Date().toLocaleString()
      });

    }

  }, [flash]);

  /* -----------------------------
     QR SCANNER
  ----------------------------- */

  const openScanner = async () => {

    setShowScanner(true);

    const qr = new Html5Qrcode("reader");
    setQrInstance(qr);

    const devices = await Html5Qrcode.getCameras();

    if (devices.length) {

      qr.start(
        devices[0].id,
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          alert("Scanned: " + decodedText);
        }
      );

    }

  };

  const closeScanner = async () => {

    setShowScanner(false);

    if (qrInstance) {
      await qrInstance.stop().catch(() => {});
    }

  };

  /* -----------------------------
     REDEEM REWARD
  ----------------------------- */

  const redeemReward = (reward) => {

    router.post(
      route("rewards.redeem", reward.id),
      {},
      { preserveScroll: true }
    );

    setConfirmReward(null);

  };

  /* -----------------------------
     FILTER REWARDS
  ----------------------------- */

  const filteredRewards = rewards
    .filter(reward =>
      reward.name.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 5);

  /* -----------------------------
     UI
  ----------------------------- */

  return (

    <>
      <Head title="Dashboard" />

      <div className="min-h-screen bg-gray-100 flex justify-center p-4">

        <div className="w-full max-w-xl">

          {/* HEADER */}

          <div className="flex justify-between items-center mb-6">

            <div>

              <p className="text-gray-500 text-sm">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold text-[#1B1F5E]">
                {user.name}
              </h2>

            </div>

            <div className="flex gap-3">

              {/* SCANNER BUTTON */}

              <button
                onClick={openScanner}
                className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl"
              >
                📷
              </button>

              {/* USER MENU */}

              <div className="relative">

                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-12 h-12 bg-blue-100 rounded-full font-bold text-[#1B1F5E]"
                >
                  {user.name.substring(0, 2).toUpperCase()}
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

          {/* POINTS CARD */}

          <div className="bg-[#1B1F5E] text-white p-6 rounded-3xl mb-6 shadow">

            <p className="text-sm opacity-80">
              Total Points
            </p>

            <p className="text-4xl font-bold mt-1">
              {Number(user.points).toLocaleString()}
              <span className="text-lg"> pts</span>
            </p>

          </div>

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search rewards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-xl mb-6"
          />

          {/* REWARDS */}

          <div className="space-y-4">

            <h3 className="text-lg font-semibold">
              Rewards
            </h3>

            {filteredRewards.length === 0 ? (

              <p className="text-gray-500 text-sm">
                No rewards found.
              </p>

            ) : (

              filteredRewards.map(reward => {

                const canRedeem =
                  user.points >= reward.points_required;

                return (

                  <div
                    key={reward.id}
                    className="bg-white p-5 rounded-2xl shadow flex justify-between items-center"
                  >

                    <div>

                      <h4 className="font-semibold">
                        {reward.name}
                      </h4>

                      <p className="text-sm text-gray-500">
                        {reward.description}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-bold text-[#1B1F5E]">
                        {reward.points_required} pts
                      </p>

                      <button
                        disabled={!canRedeem}
                        onClick={() => setConfirmReward(reward)}
                        className={`mt-2 px-4 py-2 rounded-full text-white ${
                          canRedeem
                            ? "bg-[#1B1F5E]"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >

                        {canRedeem
                          ? "Redeem"
                          : "Not enough points"}

                      </button>

                    </div>

                  </div>

                );

              })

            )}

            {/* VIEW ALL */}

            <div className="text-center mt-4">

              <Link
                href={route("rewards.index")}
                className="text-blue-600 font-semibold text-sm"
              >
                View All Rewards →
              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* CONFIRM REDEEM MODAL */}

      {confirmReward && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm text-center">

            <h2 className="font-bold text-lg mb-3">
              Confirm Redemption
            </h2>

            <p className="text-sm mb-4">
              Redeem <strong>{confirmReward.name}</strong> for
              <strong> {confirmReward.points_required} points</strong>?
            </p>

            <div className="flex justify-center gap-3">

              <button
                onClick={() => setConfirmReward(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => redeemReward(confirmReward)}
                className="px-4 py-2 bg-[#1B1F5E] text-white rounded-lg"
              >
                Confirm
              </button>

            </div>

          </div>

        </div>

      )}

      {/* RECEIPT MODAL */}

      {receipt && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-white rounded-3xl shadow-xl p-6 w-[90%] max-w-sm">

            <h2 className="text-center text-xl font-bold text-[#1B1F5E] mb-4">
              Redemption Receipt
            </h2>

            <div className="border-t border-dashed py-4 text-sm space-y-2">

              <div className="flex justify-between">
                <span>User</span>
                <span className="font-semibold">{receipt.user}</span>
              </div>

              <div className="flex justify-between">
                <span>Reward</span>
                <span className="font-semibold">{receipt.reward}</span>
              </div>

              <div className="flex justify-between">
                <span>Points Used</span>
                <span className="font-semibold">{receipt.points}</span>
              </div>

              <div className="flex justify-between">
                <span>Transaction</span>
                <span className="font-semibold">{receipt.transaction}</span>
              </div>

              <div className="flex justify-between">
                <span>Date</span>
                <span>{receipt.date}</span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-green-600 font-semibold">
                  Successful
                </span>
              </div>

            </div>

            <div className="border-t border-dashed pt-4 text-center">

              <button
                onClick={() => setReceipt(null)}
                className="px-6 py-2 bg-[#1B1F5E] text-white rounded-lg"
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );

}