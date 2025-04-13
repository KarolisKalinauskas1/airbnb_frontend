import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import axios from '@/axios'

// Create the Pinia store
const pinia = createPinia()

// Add this before the app initialization
const checkBackendStatus = async () => {
  try {
    const response = await axios.get('/', { timeout: 3000 });
    console.log('Backend status:', response.data);
    return true;
  } catch (error) {
    console.warn('Backend not available. Some features may not work properly.');
    return false;
  }
}

// Then in your initialization code, add:
checkBackendStatus().then(isBackendAvailable => {
  // Optional: Store this info in a global state for reference
  // Could add a small indicator in the UI if backend is down
  if (!isBackendAvailable) {
    // Display offline banner or fallback to read-only mode
    // You could even use localStorage for this state
    localStorage.setItem('appOfflineMode', 'true');
  } else {
    localStorage.removeItem('appOfflineMode');
  }
});

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
