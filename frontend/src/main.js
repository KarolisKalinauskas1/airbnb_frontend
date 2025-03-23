import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Block for auth0 initiation
import { createAuth0 } from '@auth0/auth0-vue';

app.use(
  createAuth0({
    domain: "dev-skrkdln2jclssxpi.us.auth0.com",
    clientId: "XkiTK3vFzFFAyn9JxcaIwj6ezbIpwR0L",
    authorizationParams: {
      redirect_uri: window.location.origin
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  })
);

app.use(createPinia())
app.use(router)

app.mount('#app')
