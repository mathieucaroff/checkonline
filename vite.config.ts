/// <reference types="vitest" />
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { default as packageInfo } from './package.json' with { type: 'json' }

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
