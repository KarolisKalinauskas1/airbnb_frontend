import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const backendUrl = process.env.VITE_API_URL || 'http://localhost:3000';

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
    },    server: {
      host: true,
      port: process.env.PORT || 5173,
      strictPort: false,
      cors: true,
      proxy: {
        '^/api/.*': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('[Proxy Error]', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('[Proxy Request]', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('[Proxy Response]', proxyRes.statusCode, req.url);
            });
          }
        }
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
      }
    }
  }
})

