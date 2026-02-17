<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexiBin | Welcome</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f5f6fa;
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center bg-gray-200">

    <!-- Phone Frame -->
    <div class="w-[360px] bg-white rounded-[35px] shadow-2xl px-8 py-10">

        <!-- Welcome Content -->
        <div class="text-center">

            <h1 class="text-sm font-semibold text-gray-500 tracking-widest">
                WELCOME TO
            </h1>

            <h2 class="text-3xl font-extrabold text-[#1B1F5E] mt-2 tracking-widest">
                NEXIBIN
            </h2>

            <p class="text-xs text-gray-400 mt-4">
                Smart Waste Monitoring & Management System
            </p>

        </div>

        <!-- Buttons -->
        <div class="mt-16">

            <!-- Login Button -->
            <a 
                href="{{ route('login') }}"
                class="block w-full text-center py-3 rounded-full bg-[#1B1F5E] text-white font-semibold hover:opacity-90 transition"
            >
                LOG IN
            </a>

            <!-- Register Button -->
            <a 
                href="{{ route('register') }}"
                class="block w-full text-center mt-5 py-3 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] font-semibold hover:bg-[#1B1F5E] hover:text-white transition"
            >
                REGISTER
            </a>

        </div>

    </div>

</body>
</html>
