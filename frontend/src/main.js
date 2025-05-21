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
import axios from '@/axios'
import { applyUserDataFix } from './utils/userDataFix'
import { configureAxiosInterceptors } from './axios-interceptors'
import { useAuthStore } from './stores/auth'
import { supabase } from '@/lib/supabase'

// Apply the user data fix before Vue initialization
try {
  applyUserDataFix()
} catch (error) {
  console.error('Error applying user data fix:', error)
}

// Create the Pinia store
const pinia = createPinia()

// Create and configure the app
const app = createApp(App)

// Configure plugins
try {
  app.use(pinia)
  app.use(router)
  app.use(Toast, {
    position: 'top-right',
    timeout: 3000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: true,
    closeButton: 'button',
    icon: true,
    rtl: false
  })} catch (error) {
  console.error('Error configuring plugins:', error)
}

// Configure axios interceptors
try {
  configureAxiosInterceptors()
} catch (error) {
  console.error('Error configuring axios interceptors:', error)
}

// Initialize auth store before mounting
const authStore = useAuthStore()

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    authStore.setSession(session)
  } else if (event === 'SIGNED_OUT') {
    authStore.clearSession()
  }
})

// Mount the app immediately to prevent loading delays
app.mount('#app')

// Start auth initialization in the background
if (!authStore.isInitialized && !authStore.isInitializing) {
  authStore.initAuth()
    .catch((error) => {
      console.error('Auth initialization failed:', error)
    })
}
