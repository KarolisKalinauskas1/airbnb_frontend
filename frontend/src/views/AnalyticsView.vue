<template>
  <DashboardLayout>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
    <div v-else-if="error" class="text-center py-8 text-red-600 bg-red-50 rounded-lg">{{ error }}</div>
    <template v-else>
      <div class="space-y-8">
        <!-- Revenue Overview with improved layout -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Revenue Overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p class="text-2xl font-bold text-red-600">€{{ formatCurrency(dashboardData.revenue.total) }}</p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">This Month</h3>
              <p class="text-2xl font-bold text-red-600">€{{ formatCurrency(dashboardData.revenue.monthly) }}</p>
              <p class="text-sm text-gray-500" :class="dashboardData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ dashboardData.revenue.growth >= 0 ? '↑' : '↓' }} {{ Math.abs(dashboardData.revenue.growth) }}% from last month
              </p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Average per Booking</h3>
              <p class="text-2xl font-bold text-red-600">€{{ formatCurrency(dashboardData.revenue.average) }}</p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Cancelled Revenue</h3>
              <p class="text-2xl font-bold text-amber-600">€{{ formatCurrency(dashboardData.revenue.cancelled) }}</p>
              <p class="text-xs text-gray-500">Lost from cancellations</p>
            </div>
          </div>
        </div>

        <!-- Booking Statistics with improved layout -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Booking Statistics <span class="text-xs font-normal text-gray-500">(Excluding cancellations)</span></h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Total Bookings</h3>
              <p class="text-2xl font-bold text-gray-800">{{ dashboardData.bookings.total }}</p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Monthly Bookings</h3>
              <p class="text-2xl font-bold text-gray-800">{{ dashboardData.bookings.monthly }}</p>
              <p class="text-sm" :class="dashboardData.bookings.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ dashboardData.bookings.growth >= 0 ? '↑' : '↓' }} {{ Math.abs(dashboardData.bookings.growth) }}% from last month
              </p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Average Duration</h3>
              <p class="text-2xl font-bold text-gray-800">{{ dashboardData.bookings.averageDuration.toFixed(1) }} days</p>
              <p class="text-xs text-gray-500">Completed & confirmed bookings</p>
            </div>
            <div class="p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <h3 class="text-sm font-medium text-gray-600">Occupancy Rate</h3>
              <p class="text-2xl font-bold text-gray-800">{{ dashboardData.bookings.occupancyRate }}%</p>
            </div>
          </div>
        </div>

        <!-- Popular Spots & Performance with improved layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Popular Spots -->
          <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Most Popular Spots</h2>
            <div class="space-y-4">
              <div v-for="spot in dashboardData.popularSpots" :key="spot.id" 
                   class="flex justify-between items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border-b last:border-b-0">
                <div>
                  <h3 class="font-medium">{{ spot.name }}</h3>
                  <div class="flex items-center gap-4">
                    <p class="text-sm text-gray-500">{{ spot.bookings }} bookings</p>
                    <p class="text-sm text-gray-500">{{ spot.occupancyRate }}% occupied</p>
                  </div>
                </div>
                <p class="text-red-600 font-semibold">€{{ formatCurrency(spot.revenue) }}</p>
              </div>
            </div>
          </div>

          <!-- Spot Performance -->
          <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Spot Performance</h2>
            <div class="space-y-6">
              <div v-for="spot in dashboardData.spotPerformance" :key="spot.id" class="space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-800">{{ spot.name }}</h3>
                  <span class="text-sm font-medium text-red-600">€{{ formatCurrency(spot.performance) }}/day</span>
                </div>
                <!-- Progress bar -->
                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div class="bg-red-600 h-2.5 rounded-full transition-all duration-500" 
                       :style="{ width: Math.min((spot.performance / maxPerformance) * 100, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Bookings Table with improved layout -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <h2 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Recent Bookings</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="booking in dashboardData.recentBookings" :key="booking.id">
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.spotName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ booking.guestName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {{ formatDate(booking.startDate) }} - 
                    {{ formatDate(booking.endDate) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">€{{ formatCurrency(booking.revenue) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="{
                      'px-2 py-1 text-xs rounded-full': true,
                      'bg-green-100 text-green-800': booking.status === 'completed',
                      'bg-yellow-100 text-yellow-800': booking.status === 'upcoming',
                      'bg-blue-100 text-blue-800': booking.status === 'active',
                      'bg-red-100 text-red-800': booking.status === 'cancelled'
                    }">
                      {{ booking.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const { dashboardData, loading, error } = storeToRefs(dashboardStore)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

// Helper function to safely format currency values
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00'
  return Number(value).toFixed(2)
}

const maxPerformance = computed(() => {
  if (!dashboardData.value.spotPerformance || dashboardData.value.spotPerformance.length === 0) return 1
  return Math.max(...dashboardData.value.spotPerformance.map(spot => spot.performance || 0))
})

onMounted(async () => {
  await dashboardStore.fetchDashboardData()
})
</script>