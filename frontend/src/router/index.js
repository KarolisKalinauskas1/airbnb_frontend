import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PaymentView from '../views/PaymentView.vue'
import BookingSuccessView from '../views/BookingSuccessView.vue'
import BookingFailedView from '../views/BookingFailedView.vue'
import DashboardBookings from '@/views/DashboardBookings.vue'
import SocialAuthSuccess from '@/views/SocialAuthSuccess.vue' // Import the new component
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
  
  // Allow these pages for everyone, no auth check needed
  const publicPaths = [
    '/campers',
    '/camping-spot',
    '/camper',
    '/api/reviews',
    '/', // Home page
    '/auth', // Login/register page
    '/404', // Not found page
    '/offline' // Offline page
  ];

  // Check if current path matches any public path
  const isPublicPath = publicPaths.some(publicPath => 
    to.path === publicPath || to.path.startsWith(publicPath + '/')
  );

  if (isPublicPath) {
    next();
    return;
  }

  // If user isn't logged in, redirect to login for authenticated pages
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
  
  // If user is already logged in, redirect to home or the requested redirect
  if (authStore.isLoggedIn) {
    // If there's a redirect parameter, go there instead of home
    const redirectPath = to.query.redirect || '/';
    next(redirectPath);
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

// Simplified navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresSeller = to.matched.some(record => record.meta.requiresSeller)
  const requiresRenter = to.matched.some(record => record.meta.requiresRenter)
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/campers',
    '/camping-spot',
    '/camper',
    '/auth',
    '/offline',
    '/404'
  ];
  
  // Check if current path is a public path
  const isPublicPath = publicPaths.some(publicPath => 
    to.path === publicPath || to.path.startsWith(publicPath + '/')
  );
  
  // Handle direct OAuth callback to home page
  if (to.path === '/' && to.query.source === 'oauth') {
    
    // We'll let the HomeView component handle the OAuth processing
    // Just clean up the URL to not show the OAuth parameters
    if (to.query.source) {
      const query = { ...to.query };
      delete query.source;
      
      if (Object.keys(query).length === 0) {
        // If no other query parameters, just use the path
        next({ path: to.path, replace: true });
        return;
      } else {
        // Keep other query parameters if they exist
        next({ path: to.path, query, replace: true });
        return;
      }
    }
  }

  // Ensure auth is initialized
  if (!authStore.initialized) {
    try {
      await authStore.initAuth()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }

  // Handle auth page access
  if (to.path === '/auth' && authStore.isLoggedIn) {
    return next('/')
  }

  // Allow public paths or routes not requiring auth
  if (isPublicPath || !requiresAuth) {
    return next()
  }

  // Check authentication for protected routes
  if (!authStore.isLoggedIn) {
    console.log('User not authenticated, redirecting to login page from:', to.fullPath)
    // Store the path user was trying to access for post-login redirect
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
