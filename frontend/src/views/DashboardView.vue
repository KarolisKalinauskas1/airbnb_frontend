<template>
  <DashboardLayout>
    <div v-if="loading" class="text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Quick Stats -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Total Spots</h3>
          <p class="text-3xl font-bold text-red-600">{{ dashboardData.totalSpots }}</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Active Bookings</h3>
          <p class="text-3xl font-bold text-red-600">{{ dashboardData.bookings.active }}</p>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold mb-2">Total Revenue</h3>
          <p class="text-3xl font-bold text-red-600">€{{ dashboardData.revenue.total.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
        <div v-if="dashboardData.recentBookings?.length" class="space-y-4">
          <div v-for="booking in dashboardData.recentBookings" :key="booking.id" 
               class="flex items-center justify-between border-b pb-4">
            <div>
              <p class="font-medium">{{ booking.spotName }}</p>
              <p class="text-sm text-black-500">{{ formatDate(booking.startDate) }} - {{ formatDate(booking.endDate) }}</p>
              <p class="text-sm text-black-500">Guest: {{ booking.guestName }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-red-600">€{{ booking.revenue.toFixed(2) }}</p>
              <span :class="[
                'px-3 py-1 rounded-full text-sm',
                getStatusClass(booking.status)
              ]">
                {{ booking.status }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-black-500">
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