import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Create the Pinia store
const pinia = createPinia()

// Create app
const app = createApp(App)

// Toast configuration
const toastOptions = {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
}

// Use plugins
app.use(pinia)
app.use(Toast, toastOptions)
app.use(router)

// Mount the app
app.mount('#app')

// Initialize auth store early
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initAuth().catch(console.error)
