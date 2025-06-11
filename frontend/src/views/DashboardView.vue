<template>
  <DashboardLayout>
    <router-view v-if="$route.path !== '/dashboard'"></router-view>
    <div v-else class="dashboard-view">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadDashboardData">Retry</button>
      </div>
      <div v-else class="dashboard-content">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <h1>Welcome back, {{ user?.full_name }}</h1>
          <p class="subtitle">Here's what's happening with your camping spots</p>
        </div>

        <!-- Quick Stats - Only the 4 most important metrics -->
        <div class="quick-stats">
          <div class="stat-card">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span class="stat-value">{{ totalSpots }}</span>
            <span class="stat-label">Total Spots</span>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span class="stat-value">{{ totalRevenue }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span class="stat-value">{{ activeBookings }}</span>
            <span class="stat-label">Active Bookings</span>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span class="stat-value">{{ occupancyRate }}%</span>
            <span class="stat-label">Occupancy Rate</span>
          </div>
        </div>

        <!-- Recent Bookings Section -->
        <div class="recent-bookings">
            <div class="section-header">
              <h2>Recent Bookings</h2>
              <button class="view-all" @click="viewAllBookings">View All</button>
            </div>

            <div v-if="loadingBookings" class="loading">
              <div class="spinner"></div>
              <p>Loading bookings...</p>
            </div>
            <div v-else-if="recentBookings.length === 0" class="no-bookings">
              <p>No recent bookings found</p>
            </div>
            <div v-else class="bookings-list">
              <div v-for="booking in recentBookings" :key="booking.id" class="booking-item">
                <div class="booking-info">
                  <h3>{{ booking.spot.name }}</h3>
                  <div class="booking-dates">
                    <span class="date-label">Check-in:</span>
                    <span class="date-value">{{ formatDate(booking.start_date) }}</span>
                    <span class="date-label">Check-out:</span>
                    <span class="date-value">{{ formatDate(booking.end_date) }}</span>
                  </div>
                  <div class="booking-meta">
                    <span class="guest-name">{{ booking.guest_name }}</span>
                    <span class="booking-cost">${{ booking.cost }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import DashboardLayout from '@/components/DashboardLayout.vue'
import axios from 'axios'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const loading = ref(true)
const loadingBookings = ref(false)
const error = ref(null)
const user = ref(null)
const spots = ref([])
const bookings = ref([])
const analytics = ref(null)

// Basic metrics
const totalSpots = computed(() => spots.value?.length || 0)

const activeBookings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return 0
  }
  return bookings.value.filter(b => b.status === 'confirmed').length
})

// Revenue metric using either basic bookings or analytics data
const totalRevenue = computed(() => {
  // First try to get from analytics as it's more accurate
  if (analytics.value?.revenue?.total) {
    return formatCurrency(analytics.value.revenue.total)
  }
  
  // Fallback to basic calculation
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return '0.00'
  }
  
  return formatCurrency(
    bookings.value
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.cost || 0), 0)
  )
})

// Occupancy rate from analytics data
const occupancyRate = computed(() => {
  return analytics.value?.bookings?.occupancyRate || 0
})

const recentBookings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return []
  }
  return [...bookings.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
})

// Format currency with 2 decimal places
const formatCurrency = (value) => {
  const num = parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(2)
}

const loadDashboardData = async () => {
  // Check if we're already loading and how long it's been
  if (loading.value) {
    console.log('Dashboard already loading, skipping...');
    // Force reset loading state if it's been loading for more than 30 seconds
    if (!window.dashboardLoadingStartTime || (Date.now() - window.dashboardLoadingStartTime) > 30000) {
      console.warn('Loading state has been active for too long, forcing reset');
      loading.value = false;
    } else {
      return;
    }
  }
  
  // Track when loading started
  window.dashboardLoadingStartTime = Date.now();
  
  try {
    loading.value = true;
    error.value = null;
    console.log('Starting dashboard data load...');
    
    // Ensure auth store is initialized (should already be done by router guard)
    if (!authStore.initialized) {
      console.log('Auth store not initialized, initializing now...');
      await authStore.initAuth();
    }

    if (!authStore.isAuthenticated) {
      error.value = 'Please log in to view your dashboard';
      router.push('/auth?redirect=/dashboard');
      return;
    }

    // Get a fresh session without refreshing token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // Clear session and redirect to login
      await authStore.clearSession();
      error.value = 'Session expired. Please log in again.';
      router.push('/auth?redirect=/dashboard');
      return;
    }

    // Load dashboard data with session token and timeout
    const response = await axios.get('/api/dashboard', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      timeout: 10000 // 10 second timeout for API request
    });

    if (!response.data) {
      throw new Error('No dashboard data received');
    }

    // Update local state
    user.value = response.data;
    spots.value = response.data.spots || [];
    bookings.value = response.data.bookings || [];

    // Load analytics if user is owner - with error isolation
    if (authStore.isOwner) {
      try {
        await dashboardStore.loadDashboardData(false);
        analytics.value = dashboardStore.dashboardData;
      } catch (analyticsErr) {
        console.error('Error loading analytics:', analyticsErr);
        // Don't fail the whole dashboard for analytics error
        // Just log it and continue without analytics
      }
    }
  } catch (err) {
    console.error('Dashboard loading error:', err);
    
    // Handle different types of errors appropriately
    if (err.response?.status === 401) {
      // Handle auth errors by clearing session and redirecting
      await authStore.clearSession();
      error.value = 'Your session has expired. Please log in again.';
      router.push('/auth?redirect=/dashboard');
    } else if (err.response?.status === 429) {
      // Handle rate limiting
      error.value = 'Too many requests. Please wait a moment and try again.';
    } else if (err.message.includes('timeout') || err.message.includes('network')) {
      // Handle timeout/network errors with retry option
      error.value = 'Failed to load dashboard data. Please check your connection and try again.';
    } else if (err.response?.status >= 500) {
      // Handle server errors
      error.value = 'Server error. Please try again later.';
    } else {
      error.value = err.message || 'Failed to load dashboard data';
    }
  } finally {
    loading.value = false;
    window.dashboardLoadingStartTime = null;
    console.log('Dashboard loading completed, loading state reset');
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const viewAllBookings = () => {
  router.push('/dashboard/bookings')
}

onMounted(async () => {
  try {
    // The router guard should have already initialized auth for protected routes
    // If somehow auth is not ready, wait a short time for it to complete
    if (!authStore.initialized && !authStore.isInitializing) {
      console.log('Auth not initialized on dashboard mount, waiting briefly...');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    // Load dashboard data if authenticated
    if (authStore.isAuthenticated) {
      await loadDashboardData();
    } else {
      error.value = 'Authentication required';
      router.push('/auth?redirect=/dashboard');
    }
  } catch (err) {
    console.error('Error loading dashboard on mount:', err);
    error.value = err.message;
  }
})

// Simplified watcher to prevent infinite loops - only watch authentication state changes
let lastAuthState = null
const watcherDebounceTimer = ref(null)

watch(() => authStore.isAuthenticated, 
  (isAuthenticated) => {
    // Skip if this is the same state we already handled
    if (lastAuthState === isAuthenticated) {
      return
    }
    lastAuthState = isAuthenticated
    
    // Clear any existing timer
    if (watcherDebounceTimer.value) {
      clearTimeout(watcherDebounceTimer.value)
    }
    
    // Debounce the watcher to prevent rapid-fire requests
    watcherDebounceTimer.value = setTimeout(async () => {
      try {
        // Only act when auth is fully initialized and we're not already loading
        if (authStore.initialized && isAuthenticated && !loading.value) {
          // Check if we already have data to prevent unnecessary reloads
          if (!user.value) {
            console.log('Auth state changed to authenticated, loading dashboard data')
            await loadDashboardData();
          }
        } else if (authStore.initialized && !isAuthenticated && !authStore.isLoggingOut) {
          console.log('Auth state changed to unauthenticated, redirecting to login')
          error.value = 'Authentication required';
          router.push('/auth?redirect=/dashboard');
        }
      } catch (err) {
        console.error('Error in auth state watcher:', err);
        error.value = err.message;
      }
    }, 1000) // Increased debounce to 1 second
  },
  { immediate: false } // Don't run immediately since onMounted handles initial load
)
</script>

<style scoped>
.dashboard-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  transition: all 0.3s ease;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff385c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  color: #e74c3c;
  padding: 2rem;
}

.welcome-section {
  margin-bottom: 2rem;
}

.welcome-section h1 {
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff385c, #e31c5f);
}

.stat-icon {
  margin-bottom: 1rem;
  color: #ff385c;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #666;
}

.recent-bookings {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-all {
  background: none;
  border: none;
  color: #ff385c;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.view-all:hover {
  background: #fff5f5;
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.booking-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.booking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.booking-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.booking-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: rgba(0, 0, 0, 0.6);
}

.booking-status.confirmed {
  background: #4caf50;
}

.booking-status.pending {
  background: #ff9800;
}

.booking-status.cancelled {
  background: #f44336;
}

.booking-info {
  padding: 1.5rem;
}

.booking-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem;
}

.booking-dates {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
}

.date-label {
  font-size: 0.875rem;
  color: #666;
}

.date-value {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.booking-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.guest-name {
  font-size: 0.875rem;
  color: #666;
}

.booking-cost {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.no-bookings {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>