import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          name: 'Tetris 3D',
          short_name: 'Tetris',
          description: 'A classic 3D Tetris game optimized for mobile.',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#09090b',
          theme_color: '#09090b',
          icons: [
            {src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png'},
            {src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png'},
            {
              src: 'icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache the real hashed build output + static assets.
          globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
