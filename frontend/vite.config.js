import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const backendUrl = isProduction 
    ? 'https://airbnbbackend-production-5ffb.up.railway.app' 
    : 'http://localhost:3000';

  return {
    plugins: [
      vue(),
      !isProduction && vueDevTools(),
    ].filter(Boolean),
    base: '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      host: true,
      port: process.env.PORT || 5173,
      strictPort: false,
      cors: true,
      proxy: {
        '^/api/.*': {
          target: backendUrl,
          changeOrigin: true,
          secure: isProduction,
          rewrite: (path) => path
        },
      },
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      target: 'es2018',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['vue-toastification', 'vue3-toastify'],
            'http-vendor': ['axios'],
            'date-vendor': ['date-fns']
          }
        }
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
        'date-fns'
      ]
    }
  }
})

