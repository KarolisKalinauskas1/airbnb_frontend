<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)

// Fix the authentication checks to be more reliable
const isAuthenticated = computed(() => {
  return authStore.isLoggedIn
})

const userName = computed(() => authStore.fullUser?.full_name || 'User')
const isOwner = computed(() => {
  return authStore.fullUser?.isowner === 1
})

// Compute menu items based on auth state with correct routes
const menuItems = computed(() => {
  const items = [
    { name: 'Home', path: '/' },
    // Add "Browse Campers" for ALL users
    { name: 'Browse Campers', path: '/campers' }
  ]
  
  if (isAuthenticated.value) {
    // Account link for all logged in users
    items.push({ name: 'Account', path: '/account' })
    
    // Dashboard link ONLY for owners (isowner === 1)
    if (isOwner.value) {
      items.push({ name: 'Dashboard', path: '/dashboard' })
    }
  } else {
    // Guest users get the login option
    items.push({ name: 'Login', path: '/auth' })
  }
  
  return items
})

const handleLogout = async () => {
  try {
    console.log('Attempting logout...')
    await authStore.logout()
    console.log('Logout successful, redirecting to home')
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Initialize auth state
onMounted(async () => {
  try {
    isLoading.value = true
    if (!authStore.isInitialized) {
      await authStore.initAuth()
    }
    isLoading.value = false
  } catch (error) {
    console.error('NavComponent: Auth initialization error:', error)
    isLoading.value = false
  }
})

// Single watcher for auth state changes
watch(() => authStore.isLoggedIn, (newIsLoggedIn) => {
  if (newIsLoggedIn && !authStore.fullUser) {
    authStore.fetchFullUserInfo()
  }
}, { immediate: false })
</script>

<template>
  <nav v-if="!isLoading" class="nav-container">
    <div class="nav-content">
      <RouterLink to="/" class="logo-container">
        <img src="../assets/logo_for_airbnb.webp" alt="Logo" class="logo">
      </RouterLink>

      <div class="nav-links">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'active': $route.path === item.path }"
        >
          {{ item.name }}
        </RouterLink>

        <router-link to="/network-diagnostics" class="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm">
          Network Diagnostics
        </router-link>

        <button 
          v-if="isAuthenticated" 
          @click="handleLogout" 
          class="logout-button"
        >
          Logout
        </button>
      </div>
    </div>
  </nav>
  <nav v-else class="nav-container">
    <!-- Loading placeholder -->
    <div class="nav-content">
      <div class="logo-container">
        <img src="../assets/logo_for_airbnb.webp" alt="Logo" class="logo">
      </div>
      <div class="flex items-center justify-center">
        <div class="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav-container {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.nav-content {
  max-width: 7xl;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  transition: transform 0.2s;
}

.logo-container:hover {
  transform: scale(1.05);
}

.logo {
  height: 3rem;
  width: auto;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  font-weight: 500;
  color: #222222;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #F7F7F7;
  color: #FF385C;
}

.nav-link.active {
  background: #FFF8F6;
  color: #FF385C;
  font-weight: 600;
}

.logout-button {
  background: #FF385C;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-button:hover {
  background: #E31C5F;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 56, 92, 0.2);
}
</style>
