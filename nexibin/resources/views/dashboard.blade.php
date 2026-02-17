<!DOCTYPE html>
<html>
<head>
    <title>NexiBin Dashboard</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Poppins', sans-serif; }
    </style>
</head>

<body class="bg-gray-100">

<div class="max-w-sm mx-auto min-h-screen bg-white shadow-lg">

    <!-- Header -->
    <div class="px-5 pt-6 pb-4">

        <div class="flex justify-between items-center">

            <div>
                <h1 class="text-sm text-gray-500">Welcome back,</h1>
                <h2 class="font-bold text-xl text-[#1B1F5E]">
                    {{ auth()->user()->name }}!
                </h2>
            </div>

            <div class="flex items-center gap-3">

                <!-- Scan Button -->
                <button onclick="openScanner()"
                    class="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow hover:scale-105 transition">

                    <svg xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3 7h3l2-2h8l2 2h3v12H3V7z" />
                        <circle cx="12" cy="13" r="3" />
                    </svg>

                </button>

                <!-- Profile Button -->
                <div class="relative">
                    <button onclick="toggleMenu()"
                        class="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#1B1F5E]">
                        {{ strtoupper(substr(auth()->user()->name, 0, 2)) }}
                    </button>

                    <!-- Dropdown -->
                    <div id="profileMenu"
                        class="hidden absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border text-sm z-50">

                        <a href="{{ route('profile.edit') }}"
                            class="block px-4 py-2 hover:bg-gray-100">
                            Profile
                        </a>

                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button class="w-full text-left px-4 py-2 hover:bg-gray-100">
                                Logout
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>

        <!-- Points Card -->
        <div class="bg-[#1B1F5E] text-white rounded-2xl mt-5 p-5 shadow-md">
            <h3 class="text-sm opacity-80">Total Points</h3>
            <p class="text-3xl font-bold mt-1">
                {{ number_format(auth()->user()->points) }}
                <span class="text-lg font-medium">pts</span>
            </p>
        </div>

    </div>

    <!-- Rewards Section -->
    <div class="bg-gray-50 px-5 py-5 space-y-4">

        <div class="flex justify-between text-sm">
            <span class="font-semibold">Rewards</span>
            <span class="text-gray-500">Details</span>
        </div>

        <!-- Reward Card -->
        <div class="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">

            <div>
                <h4 class="font-semibold text-sm">Eco Bottle</h4>
                <p class="text-xs text-gray-500 mt-1">
                    Redeem reusable eco-friendly bottle.
                </p>
            </div>

            <div class="text-right">
                <p class="font-bold text-[#1B1F5E]">30 pts</p>
                <button class="mt-2 text-xs bg-[#1B1F5E] text-white px-3 py-1 rounded-full hover:opacity-90">
                    Redeem
                </button>
            </div>

        </div>

    </div>

</div>

<!-- Scanner Modal -->
<div id="scannerModal"
     class="hidden fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">

    <div class="bg-white w-[90%] max-w-sm rounded-2xl p-5 text-center">

        <h2 class="font-bold text-lg text-[#1B1F5E] mb-4">
            Scan QR Code
        </h2>

        <div id="reader" class="w-full mb-4"></div>

        <button onclick="closeScanner()"
                class="px-6 py-2 bg-[#1B1F5E] text-white rounded-full text-sm">
            Close
        </button>

    </div>
</div>

<script src="https://unpkg.com/html5-qrcode"></script>

<script>
let html5QrCode = null;

function toggleMenu() {
    document.getElementById('profileMenu').classList.toggle('hidden');
}

function openScanner() {
    document.getElementById('scannerModal').classList.remove('hidden');

    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {
        if (devices.length) {
            html5QrCode.start(
                devices[0].id,
                { fps: 10, qrbox: 200 },
                (decodedText) => {
                    alert("Scanned: " + decodedText);
                }
            );
        }
    });
}

function closeScanner() {
    document.getElementById('scannerModal').classList.add('hidden');

    if (html5QrCode) {
        html5QrCode.stop().catch(err => console.log(err));
    }
}
</script>

</body>
</html>
