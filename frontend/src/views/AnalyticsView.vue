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
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <button 
          @click="refreshData" 
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
          :class="{'opacity-50 cursor-not-allowed': refreshing}"
          :disabled="refreshing"
        >
          <span class="mr-2" :class="{'animate-spin': refreshing}">↻</span> 
          <span v-if="refreshing">Refreshing...</span>
          <span v-else>Refresh Data</span>
        </button>
      </div>

      <div v-if="loading" class="flex flex-col justify-center items-center my-20">
        <div class="spinner mb-4"></div>
        <p class="text-gray-600">Loading analytics data...</p>
      </div>
      
      <div v-else-if="error" class="bg-red-50 p-4 rounded-md mb-6">
        <p class="text-red-700">{{ error }}</p>
        <button @click="useDebugData()" 
                class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Use Debug Data
        </button>
      </div>

      <div v-else-if="!hasDashboardData" class="flex flex-col justify-center items-center my-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 mb-2">No analytics data available yet</p>
        <button @click="refreshData(true)" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Refresh Data
        </button>
      </div>

      <div v-else class="space-y-8">
        <!-- Overview Section -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-6">
            Monthly Overview 
            <span class="text-lg font-normal text-gray-500 ml-2">({{ dashboardData?.currentMonth || 'This Month' }})</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Monthly Revenue -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h3 class="text-sm font-medium text-gray-500">{{ dashboardData?.currentMonth?.split(' ')[0] || 'Monthly' }} Revenue</h3>
              <p class="text-2xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.monthly || 0) }}</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="(dashboardData?.revenue?.growth >= 0) ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.revenue?.growth > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.revenue?.growth || 0).toFixed(1) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Bookings -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h3 class="text-sm font-medium text-gray-500">Bookings This Month</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.bookings?.monthly || 0 }}</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="(dashboardData?.bookings?.monthlyChange >= 0) ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.bookings?.monthlyChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.bookings?.monthlyChange || 0).toFixed(1) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Average Duration -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 class="text-sm font-medium text-gray-500">Avg. Stay Duration</h3>
              <p class="text-2xl font-bold">{{ (dashboardData?.bookings?.averageDuration || 0).toFixed(1) }} days</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="(dashboardData?.bookings?.durationChange >= 0) ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.bookings?.durationChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.bookings?.durationChange || dashboardData?.durationChange || 0).toFixed(1) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>

            <!-- Occupancy Rate -->
            <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <h3 class="text-sm font-medium text-gray-500">Occupancy Rate</h3>
              <p class="text-2xl font-bold">{{ calculateOccupancyRate() }}%</p>
              <div class="flex items-center mt-2 text-sm">
                <span :class="(dashboardData?.occupancyChange >= 0) ? 'text-green-600' : 'text-red-600'">
                  {{ dashboardData?.occupancyChange > 0 ? '↑' : '↓' }} 
                  {{ Math.abs(dashboardData?.occupancyChange || 0).toFixed(1) }}%
                </span>
                <span class="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Business Insights Section -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-8">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Business Insights</h2>
          
          <!-- Key metrics cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Repeat Booking Rate -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg">
              <h3 class="text-sm font-medium text-gray-600 mb-1">Guest Loyalty</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.insights?.repeatBookingRate || 0 }}%</p>
              <p class="text-xs text-gray-600 mt-1">Guests who book multiple times</p>
            </div>
            
            <!-- Average Lead Time -->
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg">
              <h3 class="text-sm font-medium text-gray-600 mb-1">Booking Lead Time</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.insights?.averageLeadTime || 0 }} days</p>
              <p class="text-xs text-gray-600 mt-1">Average time before check-in</p>
            </div>
            
            <!-- Cancellation Rate -->
            <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-lg">
              <h3 class="text-sm font-medium text-gray-600 mb-1">Cancellation Rate</h3>
              <p class="text-2xl font-bold">{{ (dashboardData?.insights?.overallCancellationRate || 0).toFixed(1) }}%</p>
              <p class="text-xs text-gray-600 mt-1">Of all bookings</p>
            </div>
            
            <!-- Weekend Popularity -->
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg">
              <h3 class="text-sm font-medium text-gray-600 mb-1">Weekend Bookings</h3>
              <p class="text-2xl font-bold">{{ dashboardData?.insights?.weekendPopularity || 0 }}%</p>
              <p class="text-xs text-gray-600 mt-1">Friday-Saturday occupancy</p>
            </div>
          </div>
          
          <!-- Detailed insights - Seasonal and Day trends -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Seasonal Trends -->
            <div>
              <h3 class="text-md font-semibold mb-3 text-gray-700">Seasonal Trends</h3>
              <div class="bg-blue-50 rounded-lg p-4">
                <p class="font-medium">Peak Month: <span class="text-blue-800">{{ dashboardData?.insights?.seasonalTrends?.peakMonth || 'Unknown' }}</span></p>
                <p class="text-sm text-gray-600 mt-1">This is your busiest month across all camping spots. Consider adjusting your pricing strategy to maximize revenue during this period.</p>
                
                <div class="mt-4" v-if="dashboardData?.insights?.seasonalTrends?.distribution">
                  <h4 class="text-xs font-medium text-gray-500 mb-1">Monthly Distribution</h4>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <div v-for="(count, month) in dashboardData?.insights?.seasonalTrends?.distribution" :key="month" 
                         class="px-2 py-1 bg-white rounded border text-xs">
                      {{ month }}: {{ count }} bookings
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Day of Week Analysis -->
            <div>
              <h3 class="text-md font-semibold mb-3 text-gray-700">Popular Days</h3>
              <div class="bg-green-50 rounded-lg p-4">
                <div class="flex justify-between mb-3">
                  <p class="font-medium">Peak Day: <span class="text-green-800">{{ dashboardData?.insights?.peakDays?.peakDay || 'Unknown' }}</span></p>
                  <p class="font-medium">Lowest Day: <span class="text-red-800">{{ dashboardData?.insights?.peakDays?.lowestDay || 'Unknown' }}</span></p>
                </div>
                
                <div class="space-y-2">
                  <div v-for="day in dashboardData?.insights?.peakDays?.distribution || []" :key="day.day" class="flex items-center">
                    <span class="w-20 text-xs text-gray-600">{{ day.day }}</span>
                    <div class="flex-1 mx-2">
                      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-green-500 rounded-full" :style="{ width: day.percentage + '%' }"></div>
                      </div>
                    </div>
                    <span class="text-xs font-medium">{{ day.percentage }}%</span>
                  </div>
                </div>
                
                <p class="text-sm text-gray-600 mt-3">Weekend bookings account for <span class="font-medium">{{ dashboardData?.insights?.peakDays?.weekendPercentage || 0 }}%</span> of all bookings. Consider weekend-specific promotions to increase bookings on slower days.</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Revenue Overview -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Revenue Breakdown</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p class="text-sm text-gray-500">All Time Revenue</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.total || 0) }}</p>
              <p class="text-xs text-gray-500 mt-1">All completed and cancelled bookings</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">This Month Revenue</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.monthly || 0) }}</p>
              <p class="text-xs text-gray-500 mt-1">From active stays this month</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Revenue from Cancelled</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.cancelled || 0) }}</p>
              <p class="text-xs text-gray-500 mt-1">From all cancelled bookings</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Projected Next Month</p>
              <p class="text-xl font-bold">€{{ formatCurrency(dashboardData?.revenue?.projected || 0) }}</p>
              <p class="text-xs text-gray-500 mt-1">Estimated based on current trends</p>
            </div>
          </div>
        </div>

        <!-- Popular Spots & Performance -->
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
                      {{ spot.changePercentage >= 0 ? '↑' : '↓' }} {{ Math.abs(spot.changePercentage || 0).toFixed(1) }}% vs last month
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
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            <div class="text-sm text-gray-500">
              Last {{ dashboardData?.recentBookings?.length || 0 }} bookings (includes cancelled)
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
                <tr v-for="booking in dashboardData?.recentBookings || []" :key="booking.id" :class="{ 'bg-red-50': booking.cancelled }">
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.spotName || 'Unnamed Spot' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.guestName || 'Unknown Guest' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ booking.startDate ? formatDate(booking.startDate) : 'N/A' }} - 
                    {{ booking.endDate ? formatDate(booking.endDate) : 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap font-medium">€{{ formatCurrency(booking.revenue || 0) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full" 
                          :class="{
                            'bg-green-100 text-green-800': booking.status === 'confirmed',
                            'bg-blue-100 text-blue-800': booking.status === 'completed',
                            'bg-red-100 text-red-800': booking.status === 'cancelled',
                            'bg-yellow-100 text-yellow-800': booking.status === 'pending',
                            'bg-gray-100 text-gray-800': !booking.status || booking.status === 'unknown'
                          }">
                      {{ capitalizeFirst(booking.status || 'Unknown') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Debug section - only shown in debug mode -->
        <div v-if="dashboardStore.debugMode" class="bg-gray-100 p-6 rounded-xl mt-8 border border-gray-300">
          <h3 class="text-lg font-semibold mb-2">Dashboard Data Debug</h3>
          <div class="space-y-2">
            <p><strong>Data Age:</strong> {{ dashboardStore.dataAge }}</p>
            <p><strong>Loading State:</strong> {{ loading }}</p>
            <p><strong>Has Data:</strong> {{ !!dashboardData }}</p>
            <p><strong>Revenue Object:</strong> {{ !!dashboardData?.revenue }}</p>
            <p><strong>Revenue Values:</strong> 
              Total: {{ dashboardData?.revenue?.total }}, 
              Monthly: {{ dashboardData?.revenue?.monthly }}</p>
            <p><strong>Bookings Object:</strong> {{ !!dashboardData?.bookings }}</p>
            <p><strong>Bookings Values:</strong>
              Total: {{ dashboardData?.bookings?.total }},
              Monthly: {{ dashboardData?.bookings?.monthly }}</p>
            <p><strong>Insights Object:</strong> {{ !!dashboardData?.insights }}</p>
            <p><strong>Seasonal Trends:</strong> {{ !!dashboardData?.insights?.seasonalTrends }}</p>
            <p><strong>Peak Month:</strong> {{ dashboardData?.insights?.seasonalTrends?.peakMonth }}</p>
            <p><strong>Peak Day:</strong> {{ dashboardData?.insights?.peakDays?.peakDay }}</p>
            <p><strong>Raw data:</strong></p>
            <pre class="p-2 bg-gray-200 rounded text-xs overflow-auto max-h-60">{{ JSON.stringify(dashboardData, null, 2) }}</pre>
            <p><strong>Debug Info:</strong></p>
            <pre class="p-2 bg-gray-200 rounded text-xs overflow-auto max-h-60">{{ JSON.stringify(dashboardStore.debugInfo, null, 2) }}</pre>
            <button @click="refreshData(true)" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">Refresh with force=true</button>
            <button @click="useDebugData()" class="mt-2 ml-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Use Debug Data</button>
            <button @click="useRealData()" class="mt-2 ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Use Real Data</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { storeToRefs } from 'pinia';
import axios from 'axios';
import dashboardService from '@/services/dashboardService';
import { format } from 'date-fns';

const authStore = useAuthStore();
const router = useRouter();
const dashboardStore = useDashboardStore();
const { dashboardData, loading, error } = storeToRefs(dashboardStore);
const toast = useToast();
const refreshInterval = ref(null);
const refreshing = ref(false);

// Check if user is an owner
const isOwner = computed(() => authStore.isOwner);

// Check if we have some dashboard data to display
const hasDashboardData = computed(() => {
  return (
    dashboardData.value &&
    dashboardData.value.revenue &&
    dashboardData.value.revenue.total !== undefined &&
    dashboardData.value.bookings !== undefined
  );
});

// Go to main dashboard
const goToDashboard = () => {
  router.push('/dashboard');
};

/**
 * Calculate performance bar width for visualization
 */
const getPerformanceWidth = (performance) => {
  if (!performance || !dashboardData.value?.spotPerformance) return 0;

  const performances = dashboardData.value.spotPerformance
    .map((spot) => spot.performance || 0)
    .filter((val) => val > 0);

  const max = performances.length > 0 ? Math.max(...performances) : 1;
  return Math.min((performance / max) * 100, 100);
};

/**
 * Calculate and format occupancy rate
 */
const calculateOccupancyRate = () => {
  if (!dashboardData.value) return 0;

  // Use backend-provided occupancy rate if available
  if (dashboardData.value.bookings?.occupancyRate !== undefined) {
    return dashboardData.value.bookings.occupancyRate;
  }

  // Fallback calculation using booked days and available days
  if (dashboardData.value.totalAvailableDays && dashboardData.value.totalAvailableDays > 0) {
    return Math.round((dashboardData.value.totalBookedDays / dashboardData.value.totalAvailableDays) * 100);
  }

  return 0;
};

/**
 * Format currency values with 2 decimal places
 */
const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (err) {
    return 'Invalid Date';
  }
};

/**
 * Calculate impact width for amenity visualization
 */
const getImpactWidth = (impact) => {
  if (!impact || !dashboardData.value?.insights?.amenityImpact) return 0;

  const impacts = dashboardData.value.insights.amenityImpact
    .map((item) => item.impact || 0)
    .filter((val) => val > 0);

  const max = impacts.length > 0 ? Math.max(...impacts) : 1;
  return Math.min((impact / max) * 100, 100);
};

/**
 * Generate a recommendation for a spot based on its metrics
 */
const getSpotRecommendation = (spot) => {
  if (!spot) return null;

  // Low occupancy rate recommendation
  if (spot.occupancyRate && spot.occupancyRate < 40) {
    return 'Consider lowering prices or adding more amenities to increase booking rate.';
  }

  // Short average stay recommendation
  if (spot.averageLeadTime && spot.averageLeadTime < 7) {
    return 'Most bookings are made last-minute. Consider offering early booking discounts.';
  }

  // High cancellation rate
  if (spot.cancellationRate && spot.cancellationRate > 15) {
    return 'High cancellation rate detected. Review your listing description for accuracy.';
  }

  // Low weekend popularity
  if (spot.weekendPopularity && spot.weekendPopularity < 30) {
    return 'Weekend popularity is low. Consider weekend-specific promotions.';
  }

  // Seasonal advice
  if (spot.peakMonth === format(new Date(), 'MMMM')) {
    return 'Your peak booking month is happening now! Ensure your spot is in perfect condition.';
  }

  // Coming peak month
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const currentMonth = new Date().getMonth();
  const peakMonthIndex = months.indexOf(spot.peakMonth);

  if (peakMonthIndex === (currentMonth + 1) % 12) {
    return 'Your peak booking month is approaching. Ensure your spot is in perfect condition and consider pre-season promotions.';
  }

  return null;
};

/**
 * Capitalize first letter of a string
 */
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Debug permissions check for troubleshooting
 */
const debugPermissions = async () => {
  try {
    toast.info('Checking owner permissions...');
    const result = await dashboardService.checkOwnerPermissions();
    toast.success('Permission check completed');
    console.log('Permission check result:', result);

    // Show in toast for visibility
    if (result.isOwner) {
      toast.success(`Owner status confirmed: ${result.ownerStatus}`);
    } else {
      toast.error(`Not an owner: ${result.ownerStatus}`);
    }
  } catch (err) {
    toast.error(`Permission check failed: ${err.message}`);
    console.error('Permission check error:', err);
  }
};

/**
 * Manual refresh handler with visual feedback
 */
const refreshData = async (forceRefresh = true) => {
  try {
    refreshing.value = true;
    error.value = null;
    await dashboardStore.loadDashboardData(forceRefresh);

    // Validate the data after loading
    if (!validateDashboardData()) {
      console.warn('Dashboard data validation failed', dashboardData.value);
      error.value = 'Dashboard data appears to be incomplete. Try using debug data instead.';
    }
  } catch (err) {
    error.value = err.message || 'Failed to refresh analytics data';
    console.error('Error refreshing analytics:', err);
  } finally {
    refreshing.value = false;
  }
};

/**
 * Use debug data instead
 */
const useDebugData = async () => {
  try {
    refreshing.value = true;
    error.value = null;
    await dashboardStore.useDebugDataMode();
  } catch (err) {
    error.value = err.message || 'Failed to load debug data';
  } finally {
    refreshing.value = false;
  }
};

/**
 * Return to real data
 */
const useRealData = async () => {
  try {
    refreshing.value = true;
    error.value = null;
    await dashboardStore.resetToRealData();
  } catch (err) {
    error.value = err.message || 'Failed to load real data';
  } finally {
    refreshing.value = false;
  }
};

/**
 * Validate dashboard data
 */
const validateDashboardData = () => {
  if (!dashboardData.value) return false;

  // Check key metrics
  const hasRevenue =
    dashboardData.value.revenue &&
    typeof dashboardData.value.revenue.total === 'number';

  const hasBookings =
    dashboardData.value.bookings &&
    typeof dashboardData.value.bookings.total === 'number';

  return hasRevenue && hasBookings;
};

/**
 * Watch for changes in owner status
 */
watch(() => authStore.isOwner, (newIsOwner) => {
  console.log('Owner status changed:', newIsOwner);
  if (!newIsOwner) {
    router.push('/dashboard');
  }
});

// Initialize and load data
onMounted(async () => {
  try {
    console.log('Mounting analytics component...');
    // Only call loadAnalyticsData once - this already calls fetchDashboardData
    await refreshData(false);
  } catch (error) {
    console.error('Error in dashboard component:', error);
  }

  // Set up auto-refresh interval - refresh every 3 minutes
  refreshInterval.value = setInterval(() => {
    refreshData(false);
  }, 3 * 60 * 1000);
});

// Clean up interval on component unmount
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
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
  border-left-color: #ff385c;
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