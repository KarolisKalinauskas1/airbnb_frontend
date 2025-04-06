<script setup>
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { computed, watch } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const { user, fullUser } = storeToRefs(authStore)

const isSeller = computed(() => {
  return fullUser.value?.isowner === 1
})

const navItems = computed(() => {
  if (!user.value) {
    return [
      { name: 'Home', path: '/' },
      { name: 'Campers', path: '/campers' },
      { name: 'Login', path: '/auth' }
    ]
  }
  
  if (isSeller.value) {
    return [
      { name: 'Campers', path: '/campers' },
      { name: 'Account', path: '/account' },
      { name: 'Dashboard', path: '/dashboard' }
    ]
  }
  
  return [
    { name: 'Home', path: '/' },
    { name: 'Campers', path: '/campers' },
    { name: 'Account', path: '/account' }
  ]
})

const handleLogout = async () => {
  await authStore.handleLogout()
  router.push('/auth')
}
</script>

<template>
  <nav class="nav-container">
    <div class="nav-content">
      <RouterLink to="/" class="logo-container">
        <img src="../assets/logo_for_airbnb.webp" alt="Logo" class="logo">
      </RouterLink>

      <div class="nav-links">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'active': $route.path === item.path }"
        >
          {{ item.name }}
        </RouterLink>

        <button 
          v-if="user" 
          @click="handleLogout" 
          class="logout-button"
        >
          Logout
        </button>
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
