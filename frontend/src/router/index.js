import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AccountView from '../views/AccountView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PaymentView from '../views/PaymentView.vue'
import BookingSuccessView from '../views/BookingSuccessView.vue'
import BookingFailedView from '../views/BookingFailedView.vue'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'

// Prevent route guards from running multiple times
let isNavigationRunning = false;
let lastRedirectTime = 0;
const MIN_REDIRECT_INTERVAL = 2000; // 2 seconds minimum between redirects

// Fix duplicate navigation prevention
function preventDuplicateNavigation(to, from, next) {
  const now = Date.now();
  
  // Prevent rapid redirect loops
  if (now - lastRedirectTime < MIN_REDIRECT_INTERVAL && 
      from.path === '/auth' && to.path === '/auth') {
    console.warn('Stopping potential auth redirect loop');
    next(false);
    return true;
  }
  
  // Regular navigation protection
  if (isNavigationRunning) {
    next();
    return true;
  }
  
  isNavigationRunning = true;
  lastRedirectTime = now;
  return false;
}

// Guard for booking routes that require additional verification
async function bookingAuthGuard(to, from, next) {
  const bookingId = to.params.id;
  
  if (preventDuplicateNavigation(to, from, next)) return;
  
  // Get the auth store
  const authStore = useAuthStore();
  
  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    isNavigationRunning = false;
    next({
      path: '/auth',
      query: { redirect: to.fullPath }
    });
    return;
  }

  if (!bookingId) {
    isNavigationRunning = false;
    next();
    return;
  }

  try {
    // Try to access the booking - the backend will verify permissions
    await axios.get(`/api/bookings/${bookingId}`);
    isNavigationRunning = false;
    next();
  } catch (error) {
    isNavigationRunning = false;
    if (error.response?.status === 403) {
      // Unauthorized access
      next('/account');
    } else {
      // Other errors - proceed but the component will handle display
      next();
    }
  }
}

// Add a dashboard route guard to prevent infinite redirects
function dashboardGuard(to, from, next) {
  if (preventDuplicateNavigation(to, from, next)) return;
  
  const authStore = useAuthStore();
  
  // If coming directly to dashboard (like from a refresh), ensure auth is initialized
  if (from.name === null && !authStore.isInitialized) {
    // Initialize auth first
    authStore.initAuth().finally(() => {
      if (authStore.isLoggedIn && authStore.isSeller) {
        next();
      } else if (authStore.isLoggedIn) {
        next('/account'); // User is logged in but not a seller
      } else {
        // Only redirect if not currently on the auth page
        if (to.path !== '/auth') {
          next({ path: '/auth', query: { redirect: to.fullPath } });
        } else {
          next();
        }
      }
      isNavigationRunning = false;
    });
  } else {
    // Normal navigation
    if (authStore.isLoggedIn && authStore.isSeller) {
      next();
    } else if (authStore.isLoggedIn) {
      next('/account'); // User is logged in but not a seller
    } else {
      // Only redirect if not currently on the auth page
      if (to.path !== '/auth') {
        next({ path: '/auth', query: { redirect: to.fullPath } });
      } else {
        next();
      }
    }
    isNavigationRunning = false;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/campers', name: 'campers', component: () => import('../views/CampersView.vue') },
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
      beforeEnter: dashboardGuard,
      meta: { requiresAuth: true, requiresSeller: true }
    },
    {
      path: '/dashboard/spots',
      name: 'DashboardSpots',
      component: () => import('@/views/DashboardSpots.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard/analytics',
      name: 'dashboard-analytics',
      component: AnalyticsView,
      beforeEnter: dashboardGuard,
      meta: { requiresAuth: true, requiresSeller: true }
    },
    { 
      path: '/camper/:id', 
      name: 'camper-detail',
      component: () => import('../views/CampingSpotDetail.vue')
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
      beforeEnter: bookingAuthGuard,
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
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  // Special handling for auth page to prevent loops
  if (to.path === '/auth') {
    const authStore = useAuthStore();
    
    // If user is already logged in, redirect away from auth page
    if (authStore.isLoggedIn) {
      isNavigationRunning = false;
      return next(authStore.isSeller ? '/dashboard' : '/campers');
    }
    
    // Otherwise proceed to auth page
    isNavigationRunning = false;
    return next();
  }
  
  // Check if any raw JSON error is shown in the document body
  if (document.body && document.body.textContent && 
      document.body.textContent.includes('{"error":"Not Found","status":404}')) {
    // We've hit the raw JSON error, reload the page through the frontend
    window.location.href = window.location.origin + to.fullPath;
    return;
  }

  // For routes requiring auth, check authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresSeller = to.matched.some(record => record.meta.requiresSeller);
  
  // Don't check if the route doesn't require auth
  if (!requiresAuth && !requiresSeller) {
    isNavigationRunning = false;
    return next();
  }
  
  // Get auth status
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isLoggedIn;
  const isOwner = authStore.isSeller;
  
  // Don't run multiple route guards simultaneously
  if (preventDuplicateNavigation(to, from, next)) return;
  
  // Handle navigation based on auth requirements
  if (requiresAuth && !isAuthenticated) {
    isNavigationRunning = false;
    // Redirect to login page if authentication is required but user is not authenticated
    next({ 
      path: '/auth',
      query: { redirect: to.fullPath }
    });
  } else if (requiresSeller && (!isAuthenticated || !isOwner)) {
    isNavigationRunning = false;
    // Redirect to home if owner access is required but user is not an owner
    next({ path: '/' });
  } else {
    isNavigationRunning = false;
    // Continue to the requested route
    next();
  }
})

export default router
