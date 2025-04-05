import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Initialize auth after pinia is installed
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

authStore.initAuth().then(() => {
  app.use(router)
  app.mount('#app')
})
