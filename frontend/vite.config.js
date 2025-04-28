import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // Remove tailwindcss() plugin as it's not needed and might be misconfigured
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // API endpoints
      '^/api/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      // Health check endpoints
      '^/(ping|health)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Other backend endpoints
      '^/(camping-spots|amenities|countries|users|bookings|dashboard)/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/(camping-spots|amenities|countries|users|bookings|dashboard)/, '/api/$1')
      }
    },
    // Handle history mode routing
    historyApiFallback: true
  }
})

