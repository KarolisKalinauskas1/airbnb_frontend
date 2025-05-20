import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      vueDevTools(),
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
          target: isProduction ? 'https://your-railway-backend-url.railway.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        // Health check endpoints
        '^/(ping|health)': {
          target: isProduction ? 'https://your-railway-backend-url.railway.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        // Other backend endpoints
        '^/(camping-spots|amenities|countries|users|bookings|dashboard)/.*': {
          target: isProduction ? 'https://your-railway-backend-url.railway.app' : 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/(camping-spots|amenities|countries|users|bookings|dashboard)/, '/api/$1')
        }
      },
    },
    build: {
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            vendor: ['axios', 'lodash'],
            ui: ['vue-toastification', 'vue3-toastify']
          }
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'vue-toastification',
        'vue3-toastify',
        'lodash',
        'date-fns'
      ]
    }
  }
})

