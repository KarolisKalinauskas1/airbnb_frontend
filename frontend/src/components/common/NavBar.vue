<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)
const isInitializing = inject('isInitializing', ref(false))
const toast = useToast()
// Computed properties
const isAuthenticated = computed(() => {
  if (isInitializing.value) return false
  return authStore.isAuthenticated
})
const userName = computed(() => {
  if (isInitializing.value) return 'Loading...'
  return authStore.user?.email || 'Guest'
})
const isOwner = computed(() => {
  if (isInitializing.value) return false
  return authStore.isOwner
})
// Menu items
const menuItems = ref([])
// Consolidated auth state watcher
watch(
  [() => authStore.isAuthenticated, () => authStore.user, isInitializing], 
  async ([newAuth, newUser, newIsInitializing], [oldAuth, oldUser]) => {
    if (newIsInitializing) return
    // Handle login redirect
    if (!oldAuth && newAuth) {
      // We'll just log session activation here - actual redirect will be handled by login page
      console.log('Auth state changed: User logged in');
      
      // Navigation will be handled by the login page directly
      // This prevents multiple components competing to handle redirection
      // But we can set a flag indicating authentication is complete for other components
      localStorage.setItem('authenticationComplete', 'true');
      
      // Let LoginView handle redirects to avoid race conditions
    }
    // Handle logout cleanup
    else if (oldAuth && !newAuth) {
      // Clear all localStorage items except pendingBooking-related ones
      // to avoid losing booking state during auth/logout operations
      const bookingState = localStorage.getItem('pendingBooking');
      const bookingUrl = localStorage.getItem('pendingBookingUrl');
      const pendingRedirect = localStorage.getItem('pendingRedirect');
      
      localStorage.clear();
      
      // Restore booking data if it exists
      if (bookingState) localStorage.setItem('pendingBooking', bookingState);
      if (bookingUrl) localStorage.setItem('pendingBookingUrl', bookingUrl);
      if (pendingRedirect) localStorage.setItem('pendingRedirect', pendingRedirect);
      
      const currentRoute = router.currentRoute.value.path
      if (currentRoute.startsWith('/profile') || 
          currentRoute.startsWith('/my-listings') || 
          currentRoute.startsWith('/my-bookings') || 
          currentRoute.startsWith('/add-listing')) {
        router.push('/')
      }
    }
    updateMenuItems()
}, { immediate: true, deep: true })
// Watch for route changes to update menu items
watch(() => router.currentRoute.value.path, () => {
  if (!isInitializing.value) {
    updateMenuItems()
  }
}, { immediate: true })
function updateMenuItems() {
  if (isInitializing.value) return
  const items = []
  if (isAuthenticated.value) {
    // Always show these items for authenticated users
    items.push(
      { name: 'Home', path: '/' },
      { name: 'Camping Spots', path: '/campers' },
      { name: 'Account', path: '/account' }
    )
    // Add owner-specific items
    if (isOwner.value) {
      items.push(
        { name: 'Dashboard', path: '/dashboard' }
      )
    }
  } else {
    // Items for non-authenticated users
    items.push(
      { name: 'Home', path: '/' },
      { name: 'Camping Spots', path: '/campers' },
      { name: 'Sign In', path: '/auth' }
    )
  }
  menuItems.value = items
}
// Handle logout with proper error handling and cleanup
const handleLogout = async () => {
  try {
    // Save pending state if any
    const bookingState = localStorage.getItem('pendingBooking')
    const bookingUrl = localStorage.getItem('pendingBookingUrl')
    const pendingRedirect = localStorage.getItem('pendingRedirect')

    // Clear the session which handles both backend and Supabase logout
    await authStore.clearSession()
    
    // Clear all localStorage
    localStorage.clear()

    // Show success message and redirect
    toast.success('Successfully logged out')
    
    // Immediately redirect to home page
    router.push('/')

    // Check current route and redirect if on protected route
    const currentRoute = router.currentRoute.value.path
    if (currentRoute.startsWith('/profile') || 
        currentRoute.startsWith('/my-listings') || 
        currentRoute.startsWith('/my-bookings') || 
        currentRoute.startsWith('/add-listing') ||
        currentRoute.startsWith('/dashboard')) {
      await router.push('/')
    }

    // Force update menu items
    updateMenuItems()

  } catch (error) {
    console.error('Logout error:', error)
    toast.error('An error occurred during logout. Some cleanup may not be complete.')
    
    // Force a page refresh as a last resort to clear any stuck state
    if (error.message?.includes('Failed to completely clear session')) {
      window.location.reload()
    }
  }
}
// Initialize auth state once
onMounted(async () => {
  try {
    // Only initialize if not already initialized
    if (!authStore.isInitialized && !authStore.isInitializing) {
      await authStore.initAuth()
    } else {
    }
    isLoading.value = false
    updateMenuItems()
  } catch (error) {
    console.error('NavBar: Failed to initialize auth:', error)
    isLoading.value = false
  }
})
// For debugging - log auth state changes
watch(() => [isAuthenticated.value, authStore.fullUser, isInitializing.value], ([newIsLoggedIn, newFullUser, newIsInitializing]) => {
  if (newIsInitializing) return
}, { immediate: true })
</script>
<template>
  <nav v-if="!isLoading" class="nav-container">
    <div class="nav-content">
      <RouterLink to="/" class="logo-container">
        <img src="../../assets/logo_for_airbnb.webp" alt="Logo" class="logo">
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
        <img src="../../assets/logo_for_airbnb.webp" alt="Logo" class="logo">
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
