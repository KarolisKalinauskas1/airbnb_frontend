<template>
  <DashboardLayout>
    <div v-if="loading" class="text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>
    <template v-else>
      <div class="space-y-8">
        <!-- Revenue Overview -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h2 class="text-xl font-semibold mb-4">Revenue Overview</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 class="text-sm text-gray-500">Total Revenue</h3>
              <p class="text-2xl font-bold text-red-600">€{{ dashboardData.revenue.total.toFixed(2) }}</p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">This Month</h3>
              <p class="text-2xl font-bold text-red-600">€{{ dashboardData.revenue.monthly.toFixed(2) }}</p>
              <p class="text-sm text-gray-500" :class="dashboardData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ dashboardData.revenue.growth >= 0 ? '↑' : '↓' }} {{ Math.abs(dashboardData.revenue.growth) }}% from last month
              </p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">Average per Booking</h3>
              <p class="text-2xl font-bold text-red-600">€{{ dashboardData.revenue.average.toFixed(2) }}</p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">Projected Monthly</h3>
              <p class="text-2xl font-bold text-red-600">€{{ dashboardData.revenue.projected.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Booking Statistics -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h2 class="text-xl font-semibold mb-4">Booking Statistics</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 class="text-sm text-gray-500">Total Bookings</h3>
              <p class="text-2xl font-bold">{{ dashboardData.bookings.total }}</p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">This Month</h3>
              <p class="text-2xl font-bold">{{ dashboardData.bookings.monthly }}</p>
              <p class="text-sm" :class="dashboardData.bookings.growth >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ dashboardData.bookings.growth >= 0 ? '↑' : '↓' }} {{ Math.abs(dashboardData.bookings.growth) }}% from last month
              </p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">Average Duration</h3>
              <p class="text-2xl font-bold">{{ dashboardData.bookings.averageDuration.toFixed(1) }} days</p>
            </div>
            <div>
              <h3 class="text-sm text-gray-500">Occupancy Rate</h3>
              <p class="text-2xl font-bold">{{ dashboardData.bookings.occupancyRate }}%</p>
            </div>
          </div>
        </div>

        <!-- Popular Spots & Performance -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Popular Spots -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold mb-4">Most Popular Spots</h2>
            <div class="space-y-4">
              <div v-for="spot in dashboardData.popularSpots" :key="spot.id" 
                  class="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 class="font-medium">{{ spot.name }}</h3>
                  <div class="flex items-center gap-4">
                    <p class="text-sm text-gray-500">{{ spot.bookings }} bookings</p>
                    <p class="text-sm text-gray-500">{{ spot.occupancyRate }}% occupied</p>
                  </div>
                </div>
                <p class="text-red-600 font-semibold">€{{ spot.revenue.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Spot Performance -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold mb-4">Spot Performance</h2>
            <div class="space-y-4">
              <div v-for="spot in dashboardData.spotPerformance" :key="spot.id" class="space-y-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium">{{ spot.name }}</h3>
                  <span class="text-sm font-medium">€{{ spot.performance.toFixed(2) }}/day</span>
                </div>
                <!-- Progress bar -->
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-red-600 h-2.5 rounded-full" 
                       :style="{ width: Math.min((spot.performance / maxPerformance) * 100, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h2 class="text-xl font-semibold mb-4">Recent Bookings</h2>
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
                  <td class="px-6 py-4 whitespace-nowrap">€{{ booking.revenue.toFixed(2) }}</td>
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
import { computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const { dashboardData, loading, error } = storeToRefs(dashboardStore)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const maxPerformance = computed(() => {
  if (dashboardData.value.spotPerformance.length === 0) return 0
  return Math.max(...dashboardData.value.spotPerformance.map(spot => spot.performance))
})
</script>