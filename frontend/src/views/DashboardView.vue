<template>
  <DashboardLayout>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
    <div v-else-if="loadError || storeError" class="text-center py-8 text-red-600 bg-red-50 rounded-lg">
      {{ errorMessage || storeError }}
    </div>
    <template v-else>
      <!-- Stats Cards with improved spacing -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <!-- Quick Stats -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Spots</h3>
          <p class="text-3xl font-bold text-red-600">{{ safeData.totalSpots }}</p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Bookings</h3>
          <p class="text-3xl font-bold text-red-600">{{ safeData.bookings.total }}</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Revenue</h3>
          <p class="text-3xl font-bold text-red-600">€{{ formatCurrency(safeData.revenue.total) }}</p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Cancelled Revenue</h3>
          <p class="text-3xl font-bold text-amber-600">€{{ formatCurrency(safeData.revenue.cancelled) }}</p>
        </div>
      </div>

      <!-- Recent Activity with improved spacing -->
      <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
        <h3 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Recent Activity</h3>
        
        <div v-if="safeData.recentBookings?.length" class="space-y-4">
          <div v-for="booking in safeData.recentBookings" 
               :key="booking.id" 
               class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border-b last:border-b-0"
               :class="{ 'bg-amber-50': booking.cancelled }">
            <div>
              <p class="font-medium text-gray-800">{{ booking.spotName }}</p>
              <p class="text-sm text-gray-600">{{ formatDate(booking.startDate) }} - {{ formatDate(booking.endDate) }}</p>
              <p class="text-sm text-gray-600">Guest: {{ booking.guestName }}</p>
            </div>
            <div class="text-right space-y-2">
              <p class="font-semibold" :class="booking.cancelled ? 'text-amber-600' : 'text-red-600'">€{{ formatCurrency(booking.revenue) }}</p>
              <span :class="[
                'px-3 py-1 rounded-full text-sm inline-block min-w-[90px] text-center',
                getStatusClass(booking.status)
              ]">
                {{ booking.status }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No recent bookings
        </div>
      </div>
    </template>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { isOffline } from '@/utils/offlineDataHandler'
import axios from '@/axios'

const router = useRouter()
const route = useRoute()
const dashboardStore = useDashboardStore()
const authStore = useAuthStore()
const { dashboardData, loading, error: storeError } = storeToRefs(dashboardStore)
const toast = useToast()

// Loading state tracking
const retryCount = ref(0);
const maxRetries = 2;
const dataLoadedInSession = ref(false);
const loadError = ref(false);
const errorMessage = ref('');
const authPromptShown = ref(false);
const loadingInitiated = ref(false);

// Timestamp to track when we last tried to load data
const lastLoadAttempt = ref(Date.now() - 10000);
const MIN_LOAD_INTERVAL = 3000; // 3 seconds

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00'
  return Number(value).toFixed(2)
}

const getStatusClass = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800'
  
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-amber-100 text-amber-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Error handling function
const handleLoadError = (error) => {
  console.error('Error loading dashboard data:', error);
  errorMessage.value = 'Failed to load dashboard data';
  loadError.value = true;
  
  // Set fallback data to prevent null reference errors
  if (!dashboardData.value) {
    dashboardStore.setDashboardData({
      totalSpots: 0,
      totalBookings: 0,
      revenue: { total: 0, monthly: 0, average: 0, projected: 0 },
      bookings: { total: 0, monthly: 0, occupancyRate: 0 },
      popularSpots: [],
      spotPerformance: [],
      recentBookings: []
    });
  }
  
  if (error.response?.status === 401) {
    if (!authPromptShown.value) {
      router.push('/auth?redirect=' + encodeURIComponent(route.fullPath));
      authPromptShown.value = true;
    }
  } else {
    toast.error('Failed to load dashboard data. Please try again later.');
  }
};

// Updated loadDashboardData to handle errors more gracefully
const loadDashboardData = async (force = false) => {
  // Prevent loading if already initiated or too soon after last attempt
  const now = Date.now();
  if (
    (!force && loadingInitiated.value) || 
    (!force && now - lastLoadAttempt.value < MIN_LOAD_INTERVAL)
  ) {
    console.log('Skipping duplicate dashboard load request');
    return;
  }
  
  // Skip load if data already exists and not forced
  if (!force && dataLoadedInSession.value && !route.query.refresh) {
    console.log('Using already loaded dashboard data from this session');
    return;
  }
  
  loadingInitiated.value = true;
  lastLoadAttempt.value = now;
  loadError.value = false;
  errorMessage.value = '';
  
  if (!authStore.isLoggedIn && !isOffline()) {
    try {
      await authStore.initAuth();
      if (!authStore.isLoggedIn) {
        loadingInitiated.value = false;
        return router.push('/auth?redirect=' + encodeURIComponent(route.fullPath));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      loadingInitiated.value = false;
      return;
    }
  }
  
  try {
    // Use the dashboard store to load data
    await dashboardStore.fetchDashboardData();
    dataLoadedInSession.value = true;
    retryCount.value = 0;
  } catch (err) {
    console.error('Dashboard load error:', err);
    
    // Handle the error more gracefully - prevent null reference issues
    handleLoadError(err);
  } finally {
    loadingInitiated.value = false;
  }
};

// Watch for route query params to reload data when needed
watch(() => route.query.refresh, (newVal) => {
  if (newVal === 'true') {
    console.log('Forced refresh requested via URL param');
    loadDashboardData(true);
  }
});

// Create safe data with default values to prevent null reference errors
const safeData = computed(() => {
  if (!dashboardData.value) {
    // Return default structure that matches what the template expects
    return {
      totalSpots: 0,
      totalBookings: 0,
      revenue: { 
        total: 0, 
        monthly: 0, 
        average: 0,
        projected: 0,
        cancelled: 0
      },
      bookings: { 
        total: 0, 
        monthly: 0, 
        occupancyRate: 0,
        growth: 0,
        averageDuration: 0
      },
      popularSpots: [],
      spotPerformance: [],
      recentBookings: []
    }
  }
  return dashboardData.value
})

// Initialize dashboard data
onMounted(() => {
  try {
    // Initialize the default data structure in the store if needed
    if (!dashboardData.value) {
      dashboardStore.setDashboardData({
        totalSpots: 0,
        totalBookings: 0,
        revenue: { 
          total: 0, 
          monthly: 0, 
          average: 0,
          projected: 0,
          cancelled: 0
        },
        bookings: { 
          total: 0, 
          monthly: 0, 
          occupancyRate: 0,
          growth: 0,
          averageDuration: 0
        },
        popularSpots: [],
        spotPerformance: [],
        recentBookings: []
      });
    }
    
    // Small delay to ensure everything is properly initialized
    setTimeout(() => {
      loadDashboardData(false);
    }, 500);
  } catch (err) {
    console.error('Error during dashboard initialization:', err);
    handleLoadError(err);
  }
});

</script>