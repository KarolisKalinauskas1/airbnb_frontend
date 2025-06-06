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
  try {
    loading.value = true;
    error.value = null;
    
    // Check auth store initialization with a timeout
    const startTime = Date.now();
    const timeout = 5000; // 5 seconds timeout
    
    while (!authStore.initialized && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!authStore.initialized) {
      throw new Error('Authentication initialization timed out');
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

    // Load dashboard data with session token
    const response = await axios.get('/api/dashboard', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (!response.data) {
      throw new Error('No dashboard data received');
    }

    // Update local state
    user.value = response.data;
    spots.value = response.data.spots || [];
    bookings.value = response.data.bookings || [];

    // Load analytics if user is owner
    if (authStore.isOwner) {
      try {
        await dashboardStore.loadDashboardData(false);
        analytics.value = dashboardStore.dashboardData;
      } catch (analyticsErr) {
        console.error('Error loading analytics:', analyticsErr);
        // Don't fail the whole dashboard for analytics error
      }
    }
  } catch (err) {
    console.error('Dashboard loading error:', err);
    if (err.response?.status === 401 || err.message.includes('authentication')) {
      // Handle auth errors by redirecting to login
      await authStore.clearSession();
      error.value = 'Your session has expired. Please log in again.';
      router.push('/auth?redirect=/dashboard');
    } else {
      error.value = err.message || 'Failed to load dashboard data';
    }
  } finally {
    loading.value = false;
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
    // Give a short delay for auth store to initialize from route guard
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Only load if we're already authenticated
    if (authStore.isAuthenticated) {
      await loadDashboardData();
    }
  } catch (err) {
    console.error('Error loading dashboard on mount:', err);
    error.value = err.message;
  }
})

// Watch for auth state changes, but avoid infinite loops by checking initialization
watch([() => authStore.isAuthenticated, () => authStore.initialized], 
  async ([isAuthenticated, isInitialized]) => {
    try {
      if (isInitialized && isAuthenticated) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Error in auth state watcher:', err);
      error.value = err.message;
    }
  },
  { immediate: true }
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