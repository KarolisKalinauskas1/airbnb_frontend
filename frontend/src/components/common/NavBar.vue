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
  console.log('NavBar: Checking isAuthenticated:', {
    isAuthenticated: authStore.isAuthenticated,
    hasUser: !!authStore.user,
    hasSession: !!authStore.session
  })
  return authStore.isAuthenticated
})

const userName = computed(() => {
  if (isInitializing.value) return 'Loading...'
  console.log('NavBar: Checking userName:', {
    user: authStore.user
  })
  return authStore.user?.email || 'Guest'
})

const isOwner = computed(() => {
  if (isInitializing.value) return false
  console.log('NavBar: Checking isOwner:', {
    user: authStore.user,
    isowner: authStore.user?.user_metadata?.isowner
  })
  return authStore.isOwner
})

// Menu items
const menuItems = ref([])

// Consolidated auth state watcher
watch(
  [() => authStore.isAuthenticated, () => authStore.user, isInitializing], 
  async ([newAuth, newUser, newIsInitializing], [oldAuth, oldUser]) => {
    if (newIsInitializing) return
    
    console.log('NavBar: Auth state changed:', { 
      isAuthenticated: newAuth, 
      hasUser: !!newUser,
      isOwner: newUser?.user_metadata?.isowner,
      user: authStore.user
    })

    // Handle login redirect
    if (!oldAuth && newAuth) {
      const redirectPath = router.currentRoute.value.query.redirect || 
        (newUser?.user_metadata?.isowner === 1 ? '/dashboard' : '/campers')
      router.push(redirectPath)
    }
    // Handle logout cleanup
    else if (oldAuth && !newAuth) {
      localStorage.clear()
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
  
  console.log('NavBar: Updating menu items:', {
    isAuthenticated: isAuthenticated.value,
    isOwner: isOwner.value,
    currentPath: router.currentRoute.value.path
  })
  
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
  
  console.log('NavBar: Updated menu items:', items)
  menuItems.value = items
}

// Handle logout
const handleLogout = async () => {
  try {
    // Clear session from auth store
    authStore.clearSession()
    
    // Clear any remaining data from localStorage
    localStorage.clear()
    
    // Show success message
    toast.success('Successfully logged out')
    
    // Redirect to login page with logout flag
    router.push({ 
      path: '/auth',
      query: { 
        logout: 'true',
        redirect: router.currentRoute.value.fullPath 
      }
    })
    
    // Force update menu items
    updateMenuItems()
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('Failed to log out. Please try again.')
  }
}

// Initialize auth state once
onMounted(async () => {
  try {
    console.log('NavBar: Initializing auth...')
    if (!authStore.isInitialized) {
      await authStore.initAuth()
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
  
  console.log('NavBar: Auth state changed', {
    loggedIn: newIsLoggedIn ? 'yes' : 'no',
    fullUser: newFullUser ? 'loaded' : 'not loaded',
    isOwner: newFullUser?.user_metadata?.isowner === 1 ? 'yes' : 'no'
  })
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
