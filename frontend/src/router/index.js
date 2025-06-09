import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PaymentView from '../views/PaymentView.vue'
import BookingSuccessView from '../views/BookingSuccessView.vue'
import BookingFailedView from '../views/BookingFailedView.vue'
import DashboardBookings from '@/views/DashboardBookings.vue'
import SocialAuthSuccess from '@/views/SocialAuthSuccess.vue'
import ConnectionErrorView from '@/views/ConnectionErrorView.vue'
import { useAuthStore } from '@/stores/auth'
import axios from '@/axios'
import { isBackendAvailable, getCachedData } from '@/utils/connectionHelper'
import OfflinePage from '@/views/OfflinePage.vue'

// Define public paths
const publicPaths = [
  '/',
  '/campers',
  '/camping-spot',
  '/camper',
  '/auth',
  '/offline',
  '/404',
  '/camping-spots',
  '/api/reviews/stats',
  '/api/camping-spots',
  '/camping-spot/',
  '/connection-error',
  '/reset-password',
  '/social-auth-success'
]

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
  
  // Special case: If this is the review route, just let it proceed
  // The ReviewView component will handle any booking validation
  if (to.name === 'Review') {
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
    console.error('Booking auth guard error:', error.response?.status, error.message);
    isNavigationRunning = false;
    if (error.response?.status === 403) {
      // Unauthorized access
      console.warn('Booking auth guard: User not authorized to access this booking');
      next('/account');
    } else if (error.response?.status === 404) {
      // Booking not found
      console.warn(`Booking auth guard: Booking ${bookingId} not found`);
      next('/account');
    } else {
      // Other errors - proceed but the component will handle display
      console.warn('Booking auth guard: Other error, allowing component to handle:', error.message);
      next();
    }
  }
}

// More robust renter guard - update to allow all users to access campers page
function renterGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // Check if path is public or a detail page before requiring auth
  if (to.matched.some(record => record.meta.public) || 
      to.path.match(/^\/(camper|camping-spot)\/\d+$/) ||
      ['/campers', '/camping-spot', '/camper', '/'].includes(to.path) ||
      to.path.startsWith('/camping-spot/') ||
      to.path.startsWith('/camper/')) {
    console.log('Public path detected, allowing access:', to.path);
    next();
    return;
  }

  // If user isn't logged in, redirect to login for authenticated pages
  if (!authStore.isLoggedIn) {
    console.log('User not authenticated, redirecting from private path:', to.path);
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
  
  // If user isn't logged in, redirect to login
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
  
  // For owner-specific routes, ensure the user is an owner
  const ownerRoutes = ['/dashboard/spots', '/dashboard/analytics'];
  if (ownerRoutes.includes(to.path)) {
    // If we don't have owner status yet, fetch full user info
    if (authStore.fullUser === null) {
      authStore.fetchFullUserInfo().then(() => {
        if (!authStore.isOwner) {
          next('/dashboard');
        } else {
          next();
        }
      }).catch(() => {
        next('/dashboard');
      });
      return;
    }
    
    if (!authStore.isOwner) {
      next('/dashboard');
      return;
    }
  }
  
  // For renter-specific routes, ensure the user is not an owner
  const renterRoutes = ['/dashboard/bookings'];
  if (renterRoutes.includes(to.path) && authStore.isOwner) {
    next('/dashboard');
    return;
  }
  
  next();
}

// Simplified lazy loading with prefetch
function lazyLoad(view) {
  return () => import(`../views/${view}.vue`)
}

// Auth page guard to prevent authenticated users from accessing login
function authPageGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // If user is already logged in and this wasn't a logout, redirect to home or the requested redirect
  if (authStore.isLoggedIn && !to.query.logout) {
    // If there's a redirect parameter and it's not to /auth itself, use it
    const redirectPath = to.query.redirect && !to.query.redirect.startsWith('/auth') 
      ? to.query.redirect 
      : '/';
    next(redirectPath);
    return;
  }
  
  next();
}

// CRITICAL FIX: Removed renterGuard from camper routes to allow non-logged-in users to view camping spots
// This allows users to browse without being forced to log in, improving user experience
// The booking process will still require authentication when the user attempts to make a reservation

// Routes that define camping spot details - needs to be BEFORE renterGuard
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
    meta: { public: true }  // Explicitly mark as public
  },
  {
    path: '/camping-spot/:id',
    name: 'CampingSpotDetail',
    component: lazyLoad('CampingSpotDetail'),
    meta: { public: true }  // Explicitly mark as public
  },
  {
    path: '/camper/:id',
    name: 'camping-spot-detail',
    component: () => import('../views/CampingSpotDetail.vue'),
    meta: { public: true }  // Explicitly mark as public
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
    path: '/create-checkout-session',
    name: 'checkout',
    component: lazyLoad('PaymentView'),
    meta: { 
      requiresAuth: true
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
    path: '/review/:id',
    name: 'Review',
    component: lazyLoad('ReviewView'),
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
    path: '/connection-error',
    name: 'ConnectionError',
    component: ConnectionErrorView,
    meta: {
      public: true
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
    path: '/social-auth-success',
    name: 'SocialAuthSuccess',
    component: SocialAuthSuccess, // Keep for backward compatibility
    meta: {
      deprecated: true // Mark as deprecated
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

// Router navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresSeller = to.matched.some(record => record.meta.requiresSeller)
  const requiresRenter = to.matched.some(record => record.meta.requiresRenter)
  
  // Check if this is the root page with OAuth tokens in URL fragment
  if (to.path === '/' && window.location.hash.includes('access_token')) {
    // Redirect to the SocialAuthSuccess page which will handle the authentication
    next({ path: '/social-auth-success', replace: true })
    return
  }

  // Check if it's a public path first
  const isPublicPath = publicPaths.some(path => {
    if (typeof path === 'string') {
      return to.path.startsWith(path)
    }
    return path.test(to.path)
  })

  // Allow public paths or routes not requiring auth WITHOUT initializing auth
  if (isPublicPath || !requiresAuth) {
    return next()
  }

  // Only initialize auth for protected routes
  if (!authStore.initialized) {
    try {
      await authStore.initAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }

  // Handle unauthenticated access to protected routes
  if (!authStore.isLoggedIn) {
    // Don't add redirect if user is explicitly trying to logout
    if (to.path === '/auth' && to.query.logout) {
      return next()
    }
    
    return next({
      path: '/auth',
      query: { redirect: to.fullPath }
    })
  }

  // Check seller/renter requirements
  if (requiresSeller && !authStore.isOwner) {
    return next('/')
  }

  if (requiresRenter && authStore.isOwner) {
    return next('/')
  }

  next()
})

export default router
