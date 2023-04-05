/// <reference types="vitest" />
import { default as packageInfo } from './package.json'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {},
  plugins: [
    VitePWA({
      devOptions: { enabled: true, type: 'module' },
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src/service',
      filename: 'serviceWorker.ts',
      injectRegister: 'inline',
      manifest: {
        theme_color: '#000',
        background_color: '#000',
      },
    }),
  ],
})
