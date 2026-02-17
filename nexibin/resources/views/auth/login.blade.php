<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexiBin Login</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Poppins', sans-serif;
        }
    </style>
</head>

<body class="min-h-screen flex items-center justify-center bg-gray-300">

    <!-- Phone Style Card -->
    <div class="w-[360px] bg-white rounded-[35px] shadow-2xl px-8 py-10">

        <!-- Header -->
        <div class="text-center">
            <h1 class="text-xs font-semibold text-gray-500 tracking-widest">
                WELCOME TO
            </h1>

            <h2 class="text-2xl font-extrabold text-[#1B1F5E] mt-2 tracking-widest">
                NEXIBIN
            </h2>

            <p class="text-[11px] text-gray-400 mt-2">
                Sign up to continue to your Account.
            </p>
        </div>

        <!-- Session Status -->
        <x-auth-session-status class="mt-4 text-center text-green-600 text-xs" :status="session('status')" />

        <!-- Form -->
        <form method="POST" action="{{ route('login') }}" class="mt-8">
            @csrf

            <!-- Email -->
            <div class="mb-5">
                <label for="email" class="text-[11px] text-gray-600">Email</label>

                <input 
                    id="email"
                    type="email"
                    name="email"
                    value="{{ old('email') }}"
                    required autofocus
                    placeholder="Enter your Email Address"
                    class="w-full mt-2 px-4 py-3 rounded-lg bg-blue-100 focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]"
                >

                <x-input-error :messages="$errors->get('email')" class="mt-1 text-[10px] text-red-500" />
            </div>

            <!-- Password -->
            <div class="mb-2">
                <label for="password" class="text-[11px] text-gray-600">Password</label>

                <input 
                    id="password"
                    type="password"
                    name="password"
                    required
                    placeholder="Enter your Password"
                    class="w-full mt-2 px-4 py-3 rounded-lg bg-blue-100 focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]"
                >

                <x-input-error :messages="$errors->get('password')" class="mt-1 text-[10px] text-red-500" />
            </div>

            <!-- Remember + Forgot -->
            <div class="flex items-center justify-between mt-3 text-[10px]">
                <label class="flex items-center text-gray-500">
                    <input type="checkbox" name="remember" class="mr-2">
                    Remember me
                </label>

                @if (Route::has('password.request'))
                    <a href="{{ route('password.request') }}" class="text-gray-400 hover:text-[#1B1F5E]">
                        Forgot Password?
                    </a>
                @endif
            </div>

            <!-- Login Button -->
            <button 
                type="submit"
                class="w-full py-3 mt-6 rounded-full bg-[#1B1F5E] text-white text-sm font-semibold hover:opacity-90 transition"
            >
                LOG IN
            </button>

            <!-- Register -->
            <div class="text-center mt-6">
                <p class="text-[11px] text-gray-400">
                    Don’t have an account?
                </p>

                <a 
                    href="{{ route('register') }}"
                    class="inline-block mt-3 px-6 py-2 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] text-sm font-semibold hover:bg-[#1B1F5E] hover:text-white transition"
                >
                    CREATE ACCOUNT
                </a>
            </div>

            <p class="text-[9px] text-gray-400 text-center mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>

        </form>
    </div>

</body>
</html>
