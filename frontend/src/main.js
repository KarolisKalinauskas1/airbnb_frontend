import './assets/main.css'
import './assets/z-index-fixes.css'
import './assets/map-markers.css'
import './assets/back-button.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { useAuthStore } from './stores/auth'
import { supabase } from '@/lib/supabase'

const app = createApp(App)
const pinia = createPinia()

// Install plugins
app.use(pinia)
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: true
})

// Initialize auth store and ensure it's ready before mounting
const authStore = useAuthStore()

// Initialize auth once at startup
Promise.resolve().then(async () => {
  try {
    await authStore.initAuth()
    
    // Set up auth state change listener after initial auth
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        authStore.setSession(session)
      } else if (event === 'SIGNED_OUT') {
        authStore.clearSession()
      }
    })

    // Mount the app only after auth is initialized
    app.mount('#app')
  } catch (error) {
    console.error('Failed to initialize auth:', error)
    // Mount the app anyway to allow error recovery
    app.mount('#app')
  }
})
