import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CampersView from '../views/CampersView.vue'
import LoginView from '../views/LoginView.vue'
import AccountView from '../views/AccountView.vue'
import DashboardView from '../views/DashboardView.vue'
import CampingSpotsView from '../views/CampingSpotsView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/campers', name: 'campers', component: CampersView },
  { path: '/auth', name: 'auth', component: LoginView },
  {
    path: '/account',
    name: 'account',
    component: AccountView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/dashboard/spots',
    name: 'dashboard-spots',
    component: CampingSpotsView,
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/dashboard/analytics',
    name: 'dashboard-analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true, requiresSeller: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for fullUser data to be loaded
  if (!authStore.user || !authStore.fullUser) {
    await authStore.initAuth()
  }

  const isAuthenticated = !!authStore.user
  const isSeller = Number(authStore.fullUser?.isowner) === 1

  // Debug logs
  console.log('Auth check:', {
    isAuthenticated,
    isSeller,
    fullUser: authStore.fullUser,
    isowner: authStore.fullUser?.isowner
  })

  // Check if route requires auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } })
    return
  }

  // Check if route requires seller privileges
  if (to.meta.requiresSeller && !isSeller) {
    next({ path: '/account' })
    return
  }

  next()
})

export default router
