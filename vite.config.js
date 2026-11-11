import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/portaleaccoglienzacomo/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'OneSignalSDKWorker.js', 'icon-emergency.png', 'icon-change.png', 'icon-general.png'],
      manifest: {
        id: '/portaleaccoglienzacomo/',
        name: 'Vicini di Strada Como',
        short_name: 'ViciniDiStrada',
        description: 'Mappa interattiva dei servizi per la grave marginalità a Como',
        theme_color: '#124d35',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/portaleaccoglienzacomo/?source=pwa',
        scope: '/portaleaccoglienzacomo/',
        lang: 'it',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ['sw-push.js']
      }
    })
  ]
})
