/// <reference types="vitest" />
import { default as packageInfo } from './package.json'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {},
  plugins: [
    VitePWA({
      // devOptions: { enabled: true },
      registerType: 'autoUpdate',
      manifest: {
        theme_color: '#000',
        background_color: '#000',
      },
      workbox: {
        navigationPreload: true,
        runtimeCaching: [
          { urlPattern: /.*\.ico\b/, handler: 'NetworkOnly' },
          {
            urlPattern: /.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: packageInfo.name },
          },
        ],
      },
    }),
  ],
})
