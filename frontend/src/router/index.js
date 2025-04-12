import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CampersView from '../views/CampersView.vue'
import LoginView from '../views/LoginView.vue'
import AccountView from '../views/AccountView.vue'
import DashboardView from '../views/DashboardView.vue'
import CampingSpotsView from '../views/CampingSpotsView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PaymentView from '@/views/PaymentView.vue'
import BookingSuccessView from '@/views/BookingSuccessView.vue'
import BookingFailedView from '@/views/BookingFailedView.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/campers', name: 'campers', component: () => import('@/views/CampersView.vue') },
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
    component: () => import('@/views/DashboardSpots.vue'),
    meta: { requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/dashboard/analytics',
    name: 'dashboard-analytics',
    component: AnalyticsView,
    meta: { requiresAuth: true, requiresSeller: true }
  },
  { 
    path: '/camper/:id', 
    name: 'camper-detail',
    component: () => import('@/views/CampingSpotDetail.vue')
  },
  {
    path: '/camper/create-booking/:id',
    name: 'create-booking',
    component: () => import('@/views/CreateBooking.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment',
    name: 'payment',
    component: PaymentView,
    meta: { 
      requiresAuth: true,
      requiresBookingDetails: true
    }
  },
  {
    path: '/booking-success',
    name: 'booking-success',
    component: BookingSuccessView,
    meta: { requiresAuth: true }
  },
  {
    path: '/booking-failed',
    name: 'booking-failed',
    component: BookingFailedView,
    meta: { requiresAuth: true }
  },
  {
    path: '/booking/:id',
    name: 'booking-details',
    component: () => import('../views/BookingDetailsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  },
  {
    path: '/payment',
    name: 'payment',
    component: () => import('../views/PaymentView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize if it's not already
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }

  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresOwner = to.matched.some(record => record.meta.requiresOwner)
  
  // Get current authentication state
  const isAuthenticated = !!authStore.user
  const isOwner = authStore.fullUser?.isowner === 1
  
  if (requiresAuth && !isAuthenticated) {
    // Redirect to login page if authentication is required but user is not authenticated
    next({ 
      path: '/auth',
      query: { redirect: to.fullPath }
    })
  } else if (requiresOwner && (!isAuthenticated || !isOwner)) {
    // Redirect to home if owner access is required but user is not an owner
    next({ path: '/' })
  } else {
    // Continue to the requested route
    next()
  }
})

export default router
