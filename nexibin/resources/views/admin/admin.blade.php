<!DOCTYPE html>
<html>
<head>
    <title>Staff Dashboard</title>
    @vite(['resources/css/app.css'])
</head>

<body class="bg-gray-100 min-h-screen">

    <div class="flex">

        <!-- Sidebar -->
        <div class="w-64 bg-[#1B1F5E] text-white min-h-screen p-6">
            <h2 class="text-xl font-bold mb-8">NEXIBIN STAFF</h2>

            <ul class="space-y-4">
                <li><a href="#" class="hover:underline">Dashboard</a></li>
                <li><a href="#" class="hover:underline">Manage Users</a></li>
                <li><a href="#" class="hover:underline">Reports</a></li>
                <li>
                    <form method="POST" action="{{ route('logout') }}">
                        @csrf
                        <button class="hover:underline text-left">Logout</button>
                    </form>
                </li>
            </ul>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-10">
            <h1 class="text-2xl font-bold text-gray-800">
                Welcome, {{ auth()->user()->name }}
            </h1>

            <p class="mt-4 text-gray-600">
                You are logged in as STAFF (Admin).
            </p>
        </div>

    </div>

</body>
</html>
