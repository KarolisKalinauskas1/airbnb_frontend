import './assets/main.css'
import './assets/z-index-fixes.css'
import './assets/map-markers.css'
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

console.log('Starting app initialization...')

// Apply the user data fix before Vue initialization
try {
  applyUserDataFix()
  console.log('User data fix applied successfully')
} catch (error) {
  console.error('Error applying user data fix:', error)
}

// Create the Pinia store
const pinia = createPinia()
console.log('Pinia store created')

// Create and configure the app
const app = createApp(App)
console.log('Vue app created')

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
  })
  console.log('Plugins configured successfully')
} catch (error) {
  console.error('Error configuring plugins:', error)
}

// Configure axios interceptors
try {
  configureAxiosInterceptors()
  console.log('Axios interceptors configured')
} catch (error) {
  console.error('Error configuring axios interceptors:', error)
}

// Initialize auth store before mounting
const authStore = useAuthStore()
console.log('Auth store initialized')

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event)
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    authStore.setSession(session)
  } else if (event === 'SIGNED_OUT') {
    authStore.clearSession()
  }
})

// Initialize auth and mount app
authStore.initAuth()
  .then(() => {
    console.log('Auth initialization completed')
    app.mount('#app')
  })
  .catch((error) => {
    console.error('Auth initialization failed:', error)
    // Still mount the app even if auth init fails
    app.mount('#app')
  })
