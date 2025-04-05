<template>
  <DashboardLayout>
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    </div>
    <div v-else-if="error" class="text-center py-8 text-red-600 bg-red-50 rounded-lg">{{ error }}</div>
    <template v-else>
      <!-- Stats Cards with improved spacing -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <!-- Quick Stats -->
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Spots</h3>
          <p class="text-3xl font-bold text-red-600">{{ dashboardData.totalSpots }}</p>
        </div>
        
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Bookings</h3>
          <p class="text-3xl font-bold text-red-600">{{ dashboardData.bookings.total }}</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <h3 class="text-lg font-semibold mb-3 text-gray-800">Total Revenue</h3>
          <p class="text-3xl font-bold text-red-600">€{{ dashboardData.revenue.total.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Recent Activity with improved spacing -->
      <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
        <h3 class="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">Recent Activity</h3>
        <div v-if="dashboardData.recentBookings?.length" class="space-y-4">
          <div v-for="booking in dashboardData.recentBookings" 
               :key="booking.id" 
               class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border-b last:border-b-0">
            <div>
              <p class="font-medium text-gray-800">{{ booking.spotName }}</p>
              <p class="text-sm text-gray-600">{{ formatDate(booking.startDate) }} - {{ formatDate(booking.endDate) }}</p>
              <p class="text-sm text-gray-600">Guest: {{ booking.guestName }}</p>
            </div>
            <div class="text-right space-y-2">
              <p class="font-semibold text-red-600">€{{ booking.revenue.toFixed(2) }}</p>
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
          No recent bookings found
        </div>
      </div>
    </template>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '@/components/DashboardLayout.vue'
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const { dashboardData, loading, error } = storeToRefs(dashboardStore)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800',
    upcoming: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status.toLowerCase()] || 'bg-gray-100 text-black-800'
}

onMounted(dashboardStore.fetchDashboardData)
</script>