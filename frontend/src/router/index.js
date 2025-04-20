import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
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

// Add this function to handle lazy loading with better error handling
function lazyLoadView(viewPath) {
  return () => {
    const AsyncComponent = import(`../views/${viewPath}.vue`);
    AsyncComponent.catch(error => {
      console.error(`Error loading view ${viewPath}:`, error);
    });
    return AsyncComponent;
  };
}

const routes = [
  {
    path: '/', 
    name: 'Home',
    component: () => import('@/views/HomeView.vue'), // Point home to the new HomeView
  },
  {
    path: '/campers',
    name: 'Campers',
    component: () => import('@/views/CampersView.vue'), // Make campers its own route
  },
  {
    path: '/camping-spot/:id',
    name: 'CampingSpotDetail',
    component: () => import('@/views/CampingSpotDetail.vue')
  },
  {
    path: '/camper/:id',
    name: 'camping-spot-detail',
    component: () => import('../views/CampingSpotDetail.vue'),
    // No auth required for viewing camping spots
  },
  {
    path: '/auth',
    name: 'auth',
    component: LoginView
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('@/views/AccountView.vue'),
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
    component: lazyLoadView('DashboardSpots'),
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
    component: lazyLoadView('BookingDetailsView'),
    beforeEnter: bookingAuthGuard,
    meta: { requiresAuth: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: lazyLoadView('NotFound')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Fix the authentication guard logic
router.beforeEach(async (to, from, next) => {
  // Prevent multiple simultaneous navigation guards from running
  if (isNavigationRunning) {
    next(false);
    return;
  }
  
  isNavigationRunning = true;
  const now = Date.now();
  
  // Special handling for auth page to prevent loops
  if (to.path === '/auth') {
    const authStore = useAuthStore();
    
    // If user is already logged in, redirect away from auth page
    if (authStore.isLoggedIn) {
      isNavigationRunning = false;
      const redirectTarget = to.query.redirect || 
                          (authStore.isSeller ? '/dashboard' : '/');
      return next(redirectTarget);
    }
    
    // Otherwise proceed to auth page
    isNavigationRunning = false;
    return next();
  }

  // Special handling for account and camper pages
  if (to.path === '/account' || to.path.startsWith('/camping-spot/') || 
      to.path.startsWith('/campers')) {
    const authStore = useAuthStore();
    
    // For campers path, allow access without login
    if (to.path === '/campers' || to.path.startsWith('/camping-spot/')) {
      isNavigationRunning = false;
      return next();
    }
    
    // For account page, ensure auth is initialized
    if (!authStore.isInitialized) {
      try {
        console.log('Router guard: Initializing auth for protected route');
        await authStore.initAuth();
      } catch (error) {
        console.error('Router guard: Auth initialization failed:', error);
      }
    }
    
    // After initialization attempt, check if we're authenticated
    if (authStore.isLoggedIn) {
      isNavigationRunning = false;
      return next();
    } else {
      isNavigationRunning = false;
      return next({ 
        path: '/auth',
        query: { redirect: to.fullPath }
      });
    }
  }
  
  // Check if any raw JSON error is shown in the document body
  if (document.body && document.body.textContent && 
      document.body.textContent.includes('{"error":"Not Found","status":404}')) {
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
  
  // Handle navigation based on auth requirements
  if (requiresAuth && !isAuthenticated) {
    isNavigationRunning = false;
    next({ 
      path: '/auth',
      query: { redirect: to.fullPath }
    });
  } else if (requiresSeller && (!isAuthenticated || !isOwner)) {
    isNavigationRunning = false;
    next({ path: '/' });
  } else {
    isNavigationRunning = false;
    next();
  }
});

export default router
