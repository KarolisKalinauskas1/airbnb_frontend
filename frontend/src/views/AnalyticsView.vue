<template>
  <div class="analytics-view">
    <div v-if="!isOwner" class="bg-yellow-50 p-6 rounded-lg shadow text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 class="text-xl font-bold mb-2">Owner Account Required</h2>
      <p class="mb-4">Only owner accounts can access analytics data.</p>
      <button 
        @click="goToDashboard" 
        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
      >
        Go to Dashboard
      </button>
    </div>
    
    <div v-else>
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

      <div v-if="loading" class="flex justify-center items-center my-20">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="error" class="bg-red-50 p-4 rounded-md mb-6">
        <p class="text-red-700">{{ error }}</p>
        <button @click="loadAnalyticsData" 
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Try Again
        </button>
      </div>

      <div v-else class="space-y-8">
        <!-- Overview Section -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-6">Monthly Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Revenue -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h3 class="text-sm font-medium text-gray-500">Revenue This Month</h3>
              <p class="text-2xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.monthly || 0) }}</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="dashboardData?.revenue?.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.revenue?.monthlyChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.revenue?.monthlyChange || 0) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Bookings -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 class="text-sm font-medium text-gray-500">Bookings This Month</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.bookings?.monthly || 0 }}</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="dashboardData?.bookings?.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.bookings?.monthlyChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.bookings?.monthlyChange || 0) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Average Duration -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 class="text-sm font-medium text-gray-500">Avg. Stay Duration</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.averageDuration || 0 }} days</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="dashboardData?.durationChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.durationChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.durationChange || 0) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Occupancy Rate -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <h3 class="text-sm font-medium text-gray-500">Occupancy Rate</h3>
              <p class="text-2xl font-bold">{{ occupancyRate }}%</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="dashboardData?.occupancyChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.occupancyChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.occupancyChange || 0) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue Overview with improved layout -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Revenue Breakdown</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p class="text-sm text-gray-500">All Time Revenue</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.total || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Last Month Revenue</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.lastMonth || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Average Revenue/Booking</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.average || 0) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Projected Next Month</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.projected || 0) }}</p>
            </div>
          </div>
        </div>

        <!-- Popular Spots & Performance with improved layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Popular Spots -->
          <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Most Popular Spots</h2>
            <div class="space-y-4">
              <div v-if="!dashboardData?.popularSpots || dashboardData.popularSpots.length === 0" 
                  class="py-6 text-center text-gray-500">
                No spot data available
              </div>
              <div v-for="spot in dashboardData?.popularSpots || []" :key="spot.id" 
                   class="flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border-b last:border-b-0">
                <div>
                  <h3 class="font-medium">{{ spot.name || 'Unnamed Spot' }}</h3>
                  <div class="flex items-center gap-4">
                    <p class="text-sm text-gray-500">{{ spot.bookings || 0 }} bookings</p>
                    <p class="text-sm text-gray-500">{{ spot.occupancyRate || 0 }}% occupied</p>
                  </div>
                </div>
                <p class="text-red-600 font-semibold">€{{ formatCurrency(spot.revenue || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- Spot Performance -->
          <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Monthly Performance</h2>
            <div class="space-y-6">
              <div v-if="!dashboardData?.spotPerformance || dashboardData.spotPerformance.length === 0" 
                  class="py-6 text-center text-gray-500">
                No performance data available
              </div>
              <div v-for="spot in dashboardData?.spotPerformance || []" :key="spot.id" class="space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-800">{{ spot.name || 'Unnamed Spot' }}</h3>
                  <div class="text-right">
                    <span class="text-sm font-medium text-red-600">€{{ formatCurrency(spot.performance || 0) }}/day</span>
                    <div class="text-xs text-gray-500">
                      {{ spot.changePercentage >= 0 ? '↑' : '↓' }} {{ Math.abs(spot.changePercentage || 0) }}% vs last month
                    </div>
                  </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div class="bg-red-600 h-2.5 rounded-full transition-all duration-500" 
                       :style="{ width: getPerformanceWidth(spot.performance) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Bookings -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <div class="flex justify-between items-center mb-6 border-b pb-3">
            <h2 class="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            <div class="text-sm text-gray-500">
              Last 30 days: {{ dashboardData?.bookings?.last30Days || 0 }} bookings
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="!dashboardData?.recentBookings || dashboardData.recentBookings.length === 0">
                  <td colspan="5" class="px-6 py-6 text-center text-gray-500">No recent bookings</td>
                </tr>
                <tr v-for="booking in dashboardData?.recentBookings || []" :key="booking.id">
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.spotName || 'Unnamed Spot' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.guestName || 'Unknown Guest' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ booking.startDate ? formatDate(booking.startDate) : 'N/A' }} - 
                    {{ booking.endDate ? formatDate(booking.endDate) : 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">€{{ formatCurrency(booking.revenue || 0) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="{
                      'px-2 py-1 text-xs rounded-full': true,
                      'bg-green-100 text-green-800': booking.status === 'completed',
                      'bg-yellow-100 text-yellow-800': booking.status === 'pending' || booking.status === 'upcoming',
                      'bg-blue-100 text-blue-800': booking.status === 'active' || booking.status === 'confirmed',
                      'bg-red-100 text-red-800': booking.status === 'cancelled'
                    }">
                      {{ booking.status || 'Unknown' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import dashboardService from '@/services/dashboardService'
import { storeToRefs } from 'pinia'
import { authDebugger } from '@/utils/authDebugger'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()
const dashboardStore = useDashboardStore()
const { dashboardData, loading, error } = storeToRefs(dashboardStore)
const toast = useToast()
const loadAttempts = ref(0)

// Check if user is an owner
const isOwner = computed(() => authStore.isOwner)

// Go to main dashboard
const goToDashboard = () => {
  router.push('/dashboard')
}

// Helper function to calculate performance bar width
const getPerformanceWidth = (performance) => {
  if (!performance || !dashboardData.value || !dashboardData.value.spotPerformance) return 0;
  
  const performances = dashboardData.value.spotPerformance
    .map(spot => spot.performance || 0)
    .filter(val => val > 0);
  
  const max = performances.length > 0 ? Math.max(...performances) : 1;
  return Math.min((performance / max) * 100, 100);
}

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
}

// Helper function to safely format currency values
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00';
  if (typeof value !== 'number') {
    value = Number(value) || 0;
  }
  return value.toFixed(2);
}

// Calculate occupancy rate
const occupancyRate = computed(() => {
  if (!dashboardData.value || !dashboardData.value.totalBookedDays || !dashboardData.value.totalAvailableDays) {
    return 0;
  }
  const rate = (dashboardData.value.totalBookedDays / dashboardData.value.totalAvailableDays) * 100;
  return Math.min(rate, 100).toFixed(1);
});

// Load analytics data with proper error handling
const loadAnalyticsData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const token = await authStore.getAuthToken();
    const response = await axios.get('/api/dashboard/analytics', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    dashboardStore.setDashboardData(response.data);
  } catch (err) {
    console.error('Error loading analytics:', err);
    error.value = 'Failed to load analytics data';
  } finally {
    loading.value = false;
  }
};

// Initialize and load data
onMounted(async () => {
  await loadAnalyticsData()
})

// Debug permissions function
const debugPermissions = async () => {
  try {
    const result = await authDebugger.debugOwnerPermissions()
    console.log('Permission debug result:', result)
    if (result.success) {
      toast.info(`Owner check result: ${result.permissions.roles.isOwner}`)
    } else {
      toast.error('Permission check failed')
    }
  } catch (e) {
    console.error('Debug error:', e)
  }
}
</script>

<style scoped>
.analytics-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>