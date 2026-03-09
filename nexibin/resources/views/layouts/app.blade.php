<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'NexiBin') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Vite Assets -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1B1F5E">
</head>

<body class="font-sans antialiased">

<div class="min-h-screen bg-gray-100 dark:bg-gray-900">

    @include('layouts.navigation')

    <!-- Page Heading -->
    @if (isset($header))
        <header class="bg-white dark:bg-gray-800 shadow">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {{ $header }}
            </div>
        </header>
    @endif

    <!-- Page Content -->
    <main>
        {{ $slot }}
    </main>

</div>

<!-- ===================== -->
<!-- PWA Service Worker -->
<!-- ===================== -->
<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Error:', err));
    });
}
</script>

<!-- ===================== -->
<!-- PWA Install Button -->
<!-- ===================== -->
<script>
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.createElement('button');
    installBtn.innerText = "Install NexiBin";
    installBtn.className =
        "fixed bottom-6 right-6 bg-[#1B1F5E] text-white px-5 py-3 rounded-full shadow-xl z-50 text-sm font-semibold";

    document.body.appendChild(installBtn);

    installBtn.addEventListener('click', () => {
        installBtn.remove();
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
        });
    });
});
</script>

</body>
</html>
