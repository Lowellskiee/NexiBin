import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isNgrok = process.env.VITE_DEV_MODE === 'ngrok';

export default defineConfig({
    server: isNgrok
        ? {
              host: true,
              port: 5173,
              strictPort: true,
              cors: true,
              hmr: {
                  host: 'twiddly-unbeatable-elenore.ngrok-free.dev',
                  protocol: 'wss',
                  clientPort: 443,
              },
          }
        : {
              host: 'localhost',
              port: 5173,
          },

    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: { enabled: true },
            includeAssets: [
                'pwa/icons/android/android-launchericon-192-192.png',
                'pwa/icons/android/android-launchericon-512-512.png',
            ],
            manifest: {
                name: 'NexiBin',
                short_name: 'NexiBin',
                description: 'Smart Recycling Reward System',
                theme_color: '#1B1F5E',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/pwa/icons/android/android-launchericon-192-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa/icons/android/android-launchericon-512-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
});