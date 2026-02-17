<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NexiBin Register</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Poppins', sans-serif; }
    </style>
</head>

<body class="min-h-screen flex items-center justify-center bg-gray-300">

<div class="w-[360px] bg-white rounded-[35px] shadow-2xl px-8 py-10">

    <!-- Header -->
    <div class="text-center">
        <h1 class="text-lg font-bold text-[#1B1F5E]">WELCOME TO</h1>
        <h2 class="text-3xl font-black text-[#1B1F5E] mt-1">NEXIBIN</h2>
        <p class="text-xs text-gray-400 mt-2">Sign up to get started.</p>
    </div>

    <form method="POST" action="{{ route('register') }}" class="mt-8">
        @csrf

        <!-- Name -->
        <div class="mb-4">
            <label class="text-xs text-gray-600">Username</label>
            <input type="text"
                   name="name"
                   value="{{ old('name') }}"
                   required
                   class="w-full mt-2 px-4 py-3 rounded-md bg-blue-100 focus:ring-2 focus:ring-[#1B1F5E]"
                   placeholder="Enter Username">
            <x-input-error :messages="$errors->get('name')" class="mt-1 text-xs text-red-500" />
        </div>

        <!-- Email -->
        <div class="mb-4">
            <label class="text-xs text-gray-600">Email</label>
            <input type="email"
                   name="email"
                   value="{{ old('email') }}"
                   required
                   class="w-full mt-2 px-4 py-3 rounded-md bg-blue-100 focus:ring-2 focus:ring-[#1B1F5E]"
                   placeholder="Enter Email">
            <x-input-error :messages="$errors->get('email')" class="mt-1 text-xs text-red-500" />
        </div>

        <!-- Password -->
        <div class="mb-4">
            <label class="text-xs text-gray-600">Password</label>
            <input type="password"
                   name="password"
                   required
                   class="w-full mt-2 px-4 py-3 rounded-md bg-blue-100 focus:ring-2 focus:ring-[#1B1F5E]"
                   placeholder="Enter Password">
            <x-input-error :messages="$errors->get('password')" class="mt-1 text-xs text-red-500" />
        </div>

        <!-- Confirm Password -->
        <div class="mb-4">
            <label class="text-xs text-gray-600">Confirm Password</label>
            <input type="password"
                   name="password_confirmation"
                   required
                   class="w-full mt-2 px-4 py-3 rounded-md bg-blue-100 focus:ring-2 focus:ring-[#1B1F5E]"
                   placeholder="Confirm Password">
        </div>

        <!-- Role Selection -->
        <div class="mb-6">
            <label class="text-xs text-gray-600">Register As</label>

            <div class="flex gap-4 mt-2">

                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value="user" checked>
                    <span class="text-sm">User</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="role" value="staff">
                    <span class="text-sm">Staff</span>
                </label>

            </div>

            <x-input-error :messages="$errors->get('role')" class="mt-1 text-xs text-red-500" />
        </div>

        <!-- Submit -->
        <button type="submit"
                class="w-full py-3 rounded-full bg-[#1B1F5E] text-white font-semibold hover:opacity-90 transition">
            SIGN UP
        </button>

        <!-- Login Link -->
        <div class="text-center mt-6">
            <p class="text-xs text-gray-500">Already have an account?</p>
            <a href="{{ route('login') }}"
               class="text-sm font-semibold text-[#1B1F5E] hover:underline">
                Login
            </a>
        </div>

    </form>
</div>

</body>
</html>
