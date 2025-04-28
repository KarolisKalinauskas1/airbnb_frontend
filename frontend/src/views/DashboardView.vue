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

        <!-- Quick Stats -->
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
            <span class="stat-value">{{ upcomingBookings }}</span>
            <span class="stat-label">Upcoming</span>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span class="stat-value">{{ totalEarnings }}</span>
            <span class="stat-label">Total Earnings</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DashboardLayout from '@/components/DashboardLayout.vue'
import axios from 'axios'
import { format } from 'date-fns'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const loadingBookings = ref(false)
const error = ref(null)
const user = ref(null)
const spots = ref([])
const bookings = ref([])

const totalSpots = computed(() => spots.value?.length || 0)
const activeBookings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return 0
  }
  return bookings.value.filter(b => b.status === 'confirmed').length
})
const upcomingBookings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return 0
  }
  return bookings.value.filter(b => {
    const startDate = new Date(b.start_date)
    return startDate >= new Date() && b.status === 'confirmed'
  }).length
})
const totalEarnings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return '0.00'
  }
  return bookings.value
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.cost || 0), 0)
    .toFixed(2)
})
const recentBookings = computed(() => {
  if (!bookings.value || !Array.isArray(bookings.value)) {
    return []
  }
  return [...bookings.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4)
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null
    
    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error('No user found')
    }

    const token = await authStore.getAuthToken()
    if (!token) {
      throw new Error('No valid authentication token found')
    }

    const response = await axios.get('/api/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.data) {
      throw new Error('No user data received')
    }

    user.value = response.data
    spots.value = response.data.spots || []
    bookings.value = response.data.bookings || []
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    if (err.response?.status === 401) {
      error.value = 'Your session has expired. Please log in again.'
      router.push('/login')
    } else {
      error.value = 'Failed to load dashboard data. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const viewAllBookings = () => {
  router.push('/dashboard/bookings')
}

onMounted(() => {
  loadDashboardData()
})
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