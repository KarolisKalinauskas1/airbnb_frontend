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
  // Try several endpoints to ensure at least one works
  const endpointsToTry = ['/', '/health'];
  
  for (const endpoint of endpointsToTry) {
    try {
      const response = await axios.get(endpoint, { 
        timeout: 3000,
        // Accept 2xx and 4xx responses as "success" for the connectivity check
        // This is just to check if the server is responding at all
        validateStatus: (status) => status >= 200 && status < 500
      });
      
      console.log(`Backend status check succeeded with ${endpoint}`);
      return true;
    } catch (error) {
      console.error(`Backend status check failed for ${endpoint}:`, error.message);
    }
  }
  
  console.error('All backend status checks failed');
  return false;
}

const app = createApp(App)

// Add the following lines near where Vue app is created
import SimpleDateRangeSelector from './components/SimpleDateRangeSelector.vue'
import SimpleLocationPicker from './components/SimpleLocationPicker.vue'

// Register components globally
app.component('DateRangePicker', SimpleDateRangeSelector)
app.component('LocationPicker', SimpleLocationPicker)

// Configure toast notifications
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

// Initialize auth store early but don't block rendering
import { useAuthStore } from '@/stores/auth';
try {
  const authStore = useAuthStore();
  if (typeof authStore.initAuth === 'function') {
    authStore.initAuth().catch(error => console.error("Auth initialization error:", error));
  } else {
    console.error("Auth initialization method not found - check auth store implementation");
  }
} catch (err) {
  console.error("Failed to initialize auth store:", err);
}
