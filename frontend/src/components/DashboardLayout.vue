<template>
  <div class="dashboard-layout">
    <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <div class="sidebar-header">
        <img v-if="!isCollapsed" src="@/assets/logo.svg" alt="Logo" class="logo" />
        <span v-if="!isCollapsed" class="logo-text">CampSpot</span>
        <div class="minimize-arrow" @click="toggleSidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'rotated': isCollapsed }">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ 'active': $route.path === '/dashboard' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span v-if="!isCollapsed">Overview</span>
        </router-link>
        <router-link to="/dashboard/spots" class="nav-item" :class="{ 'active': $route.path.startsWith('/dashboard/spots') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span v-if="!isCollapsed">My Spots</span>
        </router-link>
        <router-link to="/dashboard/bookings" class="nav-item" :class="{ 'active': $route.path.startsWith('/dashboard/bookings') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span v-if="!isCollapsed">Bookings</span>
        </router-link>
        <router-link to="/dashboard/analytics" class="nav-item" :class="{ 'active': $route.path.startsWith('/dashboard/analytics') }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span v-if="!isCollapsed">Analytics</span>
        </router-link>
      </nav>
    </div>
    <div class="main-content" :class="{ 'expanded': isCollapsed }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.sidebar {
  width: 280px;
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #eee;
  position: relative;
}

.minimize-arrow {
  position: absolute;
  right: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.minimize-arrow:hover {
  background: #f5f5f5;
}

.minimize-arrow svg {
  transition: transform 0.3s ease;
}

.minimize-arrow svg.rotated {
  transform: rotate(180deg);
}

.logo {
  width: 40px;
  height: 40px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.sidebar-nav {
  padding: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #ff385c;
}

.nav-item.active {
  background: #fff5f5;
  color: #ff385c;
}

.nav-item svg {
  flex-shrink: 0;
}

.main-content {
  margin-left: 280px;
  flex: 1;
  transition: all 0.3s ease;
}

.main-content.expanded {
  margin-left: 80px;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.collapsed {
    transform: translateX(0);
    width: 80px;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .main-content.expanded {
    margin-left: 80px;
  }
}
</style>