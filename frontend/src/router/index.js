import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PaymentView from '../views/PaymentView.vue'
import BookingSuccessView from '../views/BookingSuccessView.vue'
import BookingFailedView from '../views/BookingFailedView.vue'
import DashboardBookings from '@/views/DashboardBookings.vue'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import { isBackendAvailable, getCachedData } from '@/utils/connectionHelper'
import OfflinePage from '@/views/OfflinePage.vue';

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

// More robust renter guard - update to allow all users to access campers page
function renterGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // Allow campers page for everyone, no auth check needed
  if (to.path === '/campers') {
    next();
    return;
  }

  // For camping spot detail pages, we'll handle owner's own spot filtering in the component
  if (to.path.startsWith('/camper/')) {
    next();
    return;
  }

  // If user isn't logged in, redirect to login for other pages
  if (!authStore.isLoggedIn) {
    next({
      path: '/auth',
      query: { redirect: to.fullPath }
    });
    return;
  }

  next();
}

// More robust owner guard
function ownerGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // If user isn't logged in, redirect to login
  if (!authStore.isLoggedIn) {
    next({
      path: '/auth',
      query: { redirect: to.fullPath }
    });
    return;
  }
  
  // Ensure we have user details
  if (!authStore.fullUser) {
    // Try to fetch user details first
    authStore.fetchFullUserInfo(true).then(() => {
      // After fetching user details, check if they're an owner
      if (authStore.fullUser?.isowner !== 1) {
        next('/');
      } else {
        next();
      }
    }).catch(() => {
      // On error, redirect to login
      next('/auth');
    });
    return;
  }
  
  // Check if they're an owner
  if (authStore.fullUser?.isowner !== 1) {
    next('/');
    return;
  }
  
  next();
}

// Dashboard guard for routes that require dashboard access
function dashboardGuard(to, from, next) {
  const authStore = useAuthStore();
  
  console.log('Dashboard guard:', {
    path: to.path,
    isLoggedIn: authStore.isLoggedIn,
    isOwner: authStore.isOwner,
    user: authStore.user
  });
  
  // If user isn't logged in at all, redirect to login
  if (!authStore.isLoggedIn || !authStore.token) {
    next({
      path: '/auth',
      query: { redirect: to.fullPath }
    });
    return;
  }
  
  // Allow access to the dashboard base route for all logged-in users
  if (to.path === '/dashboard') {
    next();
    return;
  }
  
  // For now, allow access to all dashboard routes for logged-in users
  next();
  
  // We'll re-enable these checks once we confirm the owner status is working
  /*
  // For owner-specific routes, ensure the user is an owner
  const ownerRoutes = ['/dashboard/spots', '/dashboard/analytics'];
  if (ownerRoutes.includes(to.path) && !authStore.isOwner) {
    next('/dashboard');
    return;
  }
  
  // For renter-specific routes, ensure the user is not an owner
  const renterRoutes = ['/dashboard/bookings'];
  if (renterRoutes.includes(to.path) && authStore.isOwner) {
    next('/dashboard');
    return;
  }
  
  next();
  */
}

// Simplified lazy loading with prefetch
function lazyLoad(view) {
  return () => import(`../views/${view}.vue`)
}

// Auth page guard to prevent authenticated users from accessing login
function authPageGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // If user is already logged in, redirect to home
  if (authStore.isLoggedIn) {
    next('/');
    return;
  }
  
  next();
}

const routes = [
  {
    path: '/', 
    name: 'Home',
    component: lazyLoad('HomeView')
  },
  {
    path: '/campers',
    name: 'campers',
    component: lazyLoad('CampersView'),
    beforeEnter: renterGuard,
  },
  {
    path: '/camping-spot/:id',
    name: 'CampingSpotDetail',
    component: lazyLoad('CampingSpotDetail'),
    beforeEnter: renterGuard,
  },
  {
    path: '/camper/:id',
    name: 'camping-spot-detail',
    component: () => import('../views/CampingSpotDetail.vue'),
    beforeEnter: renterGuard,
  },
  {
    path: '/auth',
    name: 'auth',
    component: lazyLoad('LoginView'),
    beforeEnter: authPageGuard
  },
  {
    path: '/account',
    name: 'Account',
    component: lazyLoad('AccountView'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: lazyLoad('DashboardView'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardOverview',
        component: lazyLoad('DashboardView')
      },
      {
        path: 'spots',
        name: 'DashboardSpots',
        component: () => import('../views/DashboardSpots.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'analytics',
        name: 'DashboardAnalytics',
        component: lazyLoad('AnalyticsView'),
        meta: { requiresAuth: true }
      },
      {
        path: 'bookings',
        name: 'DashboardBookings',
        component: lazyLoad('DashboardBookings'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/payment',
    name: 'payment',
    component: lazyLoad('PaymentView'),
    beforeEnter: renterGuard,
    meta: { 
      requiresAuth: true,
      requiresBookingDetails: true
    }
  },
  {
    path: '/booking-success',
    name: 'booking-success',
    component: lazyLoad('BookingSuccessView'),
    meta: { requiresAuth: true }
  },
  {
    path: '/booking-failed',
    name: 'booking-failed',
    component: lazyLoad('BookingFailedView'),
    meta: { requiresAuth: true }
  },
  {
    path: '/booking/:id',
    name: 'booking-details',
    component: lazyLoad('BookingDetailsView'),
    beforeEnter: bookingAuthGuard,
    meta: { requiresAuth: true }
  },
  {
    path: '/renter-dashboard',
    name: 'renter-dashboard',
    component: lazyLoad('RenterDashboardView'),
    meta: { 
      requiresAuth: true,
      requiresRenter: true // This user should NOT be a seller
    }
  },
  {
    path: '/offline',
    name: 'Offline',
    component: lazyLoad('OfflinePage')
  },
  {
    path: '/network-diagnostics',
    name: 'NetworkDiagnostics',
    component: () => import('@/views/NetworkDiagnosticView.vue'),
    meta: {
      requiresAuth: false // Allow access even when not authenticated
    }
  },
  {
    path: '/api-debug',
    name: 'ApiDebug',
    component: () => import('../views/ApiDebugView.vue'),
    meta: {
      requiresAuth: false // Allow access even when not authenticated
    }
  },
  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('@/views/ApiTestView.vue'),
    meta: {
      requiresAuth: false // Allow access even when not authenticated
    }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: {
      title: 'Reset Password'
    }
  },
  {
    path: '/auth-debug',
    name: 'auth-debug',
    component: () => import('@/views/AuthDebugView.vue'),
    meta: {
      title: 'Auth Debugging'
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: lazyLoad('NotFound')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Simplified navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresSeller = to.matched.some(record => record.meta.requiresSeller)
  const requiresRenter = to.matched.some(record => record.meta.requiresRenter)

  // Ensure auth is initialized
  if (!authStore.initialized) {
    try {
      await authStore.initAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }

  // Handle auth page access
  if (to.path === '/auth' && authStore.isAuthenticated) {
    return next('/')
  }

  // Quick check for routes not requiring auth
  if (!requiresAuth) {
    return next()
  }

  // Check authentication
  if (!authStore.isAuthenticated) {
    return next({
      path: '/auth',
      query: { redirect: to.fullPath }
    })
  }

  // Check seller/renter requirements
  if (requiresSeller && !authStore.isOwner) {
    return next('/dashboard')
  }

  if (requiresRenter && authStore.isOwner) {
    return next('/dashboard')
  }

  next()
})

export default router
